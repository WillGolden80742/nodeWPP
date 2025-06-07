const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs').promises;
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const _ = require('lodash'); // Require lodash library

const app = express();
const port = 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {});

app.use(fileUpload());
app.use(express.static('public'));
app.use(express.json({ limit: '1024mb' }));

const dataDir = path.join(__dirname, 'data');
const contactsFilePath = path.join(dataDir, 'contacts.json');

async function ensureDataDirectoryExists() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
        process.exit(1);
    }
}

async function loadContactsFromFile() {
    try {
        const data = await fs.readFile(contactsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Contacts file not found, returning empty list.');
            return [];
        } else {
            console.error('Error reading contacts file:', error);
            return [];
        }
    }
}

async function saveContactsToFile(contacts) {
    try {
        const jsonData = JSON.stringify(contacts, null, 2);
        await fs.writeFile(contactsFilePath, jsonData);
        console.log('Contacts saved to file.');
    } catch (error) {
        console.error('Error writing contacts file:', error);
    }
}

// Function to remove duplicate contacts based on phone number
function removeDuplicateContacts(contacts) {
    return _.uniqBy(contacts, 'phoneNumber');
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let whatsappReady = false;
let contacts = [];

client.initialize();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR code to authenticate.');
});

client.on('authenticated', () => {
    console.log('Authenticated successfully!');
});

async function verifyAndFixContactStatuses() {
    if (!whatsappReady) {
        console.log("WhatsApp not ready, skipping contact status verification.");
        return;
    }

    console.log("Verifying and fixing contact statuses...");

    for (const contact of contacts) {
        if (!/^\d{12,15}$/.test(contact.phoneNumber)) {
            console.warn(`Invalid number ignored: ${contact.phoneNumber}`);
            continue;
        }

        const chatId = `${contact.phoneNumber}@c.us`;

        try {
            const chat = await client.getChatById(chatId);
            const messages = await chat.fetchMessages({ limit: 1 });

            let lastMessageContent = "";

            if (messages && messages.length > 0) {
                const lastMessage = messages[0];
                const messageTimestamp = new Date(lastMessage.timestamp * 1000).toISOString();

                if (lastMessage.hasMedia) {
                    if (lastMessage.type === 'image') {
                        lastMessageContent = "📸 Image";
                    } else if (lastMessage.type === 'video') {
                        lastMessageContent = "📹 Video";
                    } else if (lastMessage.type === 'audio') {
                        lastMessageContent = "🎵 Audio";
                    } else if (lastMessage.type === 'document') {
                        lastMessageContent = "📄 Document";
                    } else if (lastMessage.type === 'sticker') {
                        lastMessageContent = "✨ Sticker";
                    }
                    else {
                        lastMessageContent = "📎 Media";
                    }
                } else {
                    lastMessageContent = lastMessage.body;
                }

                if (lastMessage.fromMe) {
                    if (contact.status !== 'sent') {
                        await updateContactStatus(contact.phoneNumber, 'sent', messageTimestamp, lastMessageContent, false);
                    }
                } else {
                    if (contact.status !== 'answered') {
                        await updateContactStatus(contact.phoneNumber, 'answered', messageTimestamp, lastMessageContent, false);
                    }
                }
            } else {
                console.log(`No messages found for ${contact.phoneNumber}.`);
            }
        } catch (error) {
            console.error(`Error processing chat for ${contact.phoneNumber}:`, error.message);
        }
    }

    io.emit('contacts_updated', contacts);

    console.log("Contact status verification completed.");
}

client.on('ready', async () => {
    console.log('WhatsApp client is ready!');
    whatsappReady = true;
    try {
        contacts = await loadContactsFromFile();
        console.log('Contacts loaded from file:', contacts.length, 'contacts.');

        contacts = contacts.map(contact => {
            if (!contact.timestamp) {
                contact.timestamp = new Date().toISOString();
            }
            if (!contact.lastMessage) {
                contact.lastMessage = "";
            }

            return contact;
        });

        await saveContactsToFile(contacts);
    } catch (error) {
        console.error('Failed to load contacts on ready:', error);
    }

    io.emit('contacts_updated', contacts);
    await verifyAndFixContactStatuses();

});

client.on('message', async message => {
    const senderNumber = message.from.replace('@c.us', '');
    const messageTimestamp = new Date(message.timestamp * 1000).toISOString();
    let lastMessageContent = "";
    if (message.hasMedia) {
        if (message.type === 'image') {
            lastMessageContent = "📸 Image";
        } else if (message.type === 'video') {
            lastMessageContent = "📹 Video";
        } else if (message.type === 'audio') {
            lastMessageContent = "🎵 Audio";
        } else if (message.type === 'document') {
            lastMessageContent = "📄 Document";
        } else if (message.type === 'sticker') {
            lastMessageContent = "✨ Sticker";
        } else {
            lastMessageContent = "📎 Media";
        }
    } else {
        lastMessageContent = message.body;
    }

    await updateContactStatus(senderNumber, 'answered', messageTimestamp, lastMessageContent);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/upload', async (req, res) => {
    if (!whatsappReady) {
        return res.status(503).send('WhatsApp not ready. Try again in a few seconds.');
    }

    const contactsToSend = req.body.contacts;
    const messageTemplate = req.body.message;
    const testMode = req.body.testMode || false;

    if (!contactsToSend || contactsToSend.length === 0) {
        return res.status(400).send('No contacts selected.');
    }

    console.log(`Starting message sending to ${contactsToSend.length} contacts...`);
    console.log(`Test Mode: ${testMode}`);

    async function sendMessages() {
        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const contact of contactsToSend) {
            const fullName = contact.fullName;
            const cleanedNumber = contact.phoneNumber;
            const chatId = `${cleanedNumber}@c.us`;
            const personalizedMessage = messageTemplate.replace(/\[name\]/gi, fullName);

            try {
                if (!testMode) {
                    await client.sendMessage(chatId, personalizedMessage);

                    const messageTimestamp = new Date().toISOString();

                    await updateContactStatus(cleanedNumber, "sent", messageTimestamp, personalizedMessage);

                }

                console.log(`Message ${testMode ? '(TEST) ' : ''}sent to ${fullName} (${cleanedNumber}): "${personalizedMessage}"`);
                results.push({ contact: fullName, status: 'success', message: personalizedMessage });
                successCount++;
            } catch (err) {
                console.error(`Error sending message to ${fullName} (${cleanedNumber}): ${err.message}`);
                results.push({ contact: fullName, status: 'error', message: err.message });
                errorCount++;
            }
        }

        console.log('\nMessage sending completed.');
        return { results, successCount, errorCount };
    }

    sendMessages()
        .then(async ({ results, successCount, errorCount }) => {
            res.json({
                results: results,
                successCount: successCount,
                errorCount: errorCount
            });
        })
        .catch(error => {
            console.error('Error during message sending:', error);
            res.status(500).json({ error: 'An error occurred during message sending.' });
        });
});

const normalizePhoneNumber = (phoneNumber, defaultCountryCode, defaultDdd) => {
    if (!phoneNumber) return null;

    let cleanedNumber = phoneNumber.replace(/\D/g, '');
    cleanedNumber = cleanedNumber.replace(/^0+/, '');

    if (cleanedNumber.length === 8 || cleanedNumber.length === 9) {
        cleanedNumber = defaultCountryCode + defaultDdd + cleanedNumber;
    } else if (cleanedNumber.length === 10 || cleanedNumber.length === 11) {
        cleanedNumber = defaultCountryCode + cleanedNumber;
    }

    return cleanedNumber;
};

app.post('/update-contacts', async (req, res) => {
    console.log("Update contacts endpoint called");
    console.log("Request body:", req.body);

    let updatedContacts = req.body.contacts;
    const defaultCountryCode = req.body.countryCode;
    const defaultDdd = req.body.ddd;

    if (!updatedContacts) {
        return res.status(400).json({ error: 'No contacts provided to update.' });
    }

    updatedContacts = updatedContacts.map(contact => {
        if (contact.phoneNumber) {
            contact.phoneNumber = normalizePhoneNumber(contact.phoneNumber, defaultCountryCode, defaultDdd);
        }

        if (!contact.timestamp) {
            contact.timestamp = new Date().toISOString();
        }

        if (!contact.lastMessage) {
            contact.lastMessage = "";
        }

        return contact;
    });

    updatedContacts = updatedContacts.filter(contact => {
        if (contact.phoneNumber && contact.phoneNumber.length >= 12) {
            return true;
        } else {
            console.warn(`Contact ${contact.fullName} with phone number ${contact.phoneNumber} ignored due to length < 12.`);
            return false;
        }
    });

    //Remove duplicates
    updatedContacts = removeDuplicateContacts(updatedContacts);

    try {
        await saveContactsToFile(updatedContacts);
        contacts = updatedContacts;

        io.emit('contacts_updated', contacts);

        res.status(200).json({ message: 'Contacts updated successfully on the server.' });
    } catch (error) {
        console.error('Error updating contacts on the server:', error);
        res.status(500).json({ error: 'Failed to update contacts on the server.' });
    }
});

app.get('/update-contacts', async (req, res) => {
    try {
        const contacts = await loadContactsFromFile();
        res.status(200).json(contacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
        res.status(500).json({ error: 'Failed to load contacts from server.' });
    }
});

async function updateContactStatus(phoneNumber, newStatus, timestamp, lastMessage, sendSocket = true) {
    const contactToUpdate = contacts.find(contact => contact.phoneNumber === phoneNumber);

    if (contactToUpdate) {
        contactToUpdate.status = newStatus;
        contactToUpdate.timestamp = timestamp;
        contactToUpdate.lastMessage = lastMessage;

        await saveContactsToFile(contacts);

        if (sendSocket) {
            io.emit('contacts_updated', contacts);
        }

        console.log(`Contact ${phoneNumber} status updated to ${newStatus}, timestamp: ${timestamp}, lastMessage: ${lastMessage}`);
    } else {
        console.warn(`Contact with phone number ${phoneNumber} not found.`);
    }
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.emit('contacts_updated', contacts);

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

ensureDataDirectoryExists().then(() => {
    httpServer.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});