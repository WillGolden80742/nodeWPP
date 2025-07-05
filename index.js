const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs').promises;
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const _ = require('lodash');
require('dotenv').config();

const app = express();
const port = 3000;
let synchronizationFinished = false;
const DEFAULT_TIME_STAMP = "2000-01-01T00:00:00.000Z";

const httpServer = createServer(app);
const io = new Server(httpServer, {});

app.use(fileUpload());
app.use(express.static('public'));
app.use(express.json({ limit: '1024mb' }));

const dataDir = path.join(__dirname, 'data');
const contactsFilePath = path.join(dataDir, 'contacts.json');
const deletedContactsFilePath = path.join(dataDir, 'deleted_contacts.json');

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
        let contacts = JSON.parse(data);
        return contacts;
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

async function loadDeletedContactsFromFile() {
    try {
        const data = await fs.readFile(deletedContactsFilePath, 'utf8');
        let deletedContacts = JSON.parse(data);
        return deletedContacts;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Deleted contacts file not found, returning empty list.');
            return [];
        } else if (error instanceof SyntaxError) {
            console.error('Error parsing deleted contacts file (invalid JSON):', error);
            try {
                await fs.writeFile(deletedContactsFilePath, '[]');
                console.log('Deleted contacts file reset due to invalid JSON.');
                return [];
            } catch (writeError) {
                console.error('Error resetting deleted contacts file:', writeError);
                return [];
            }
        }
        else {
            console.error('Error reading deleted contacts file:', error);
            return [];
        }
    }
}

async function saveContactsToFile(contacts) {
    try {
        saveDeletedContactsToFile(contacts);
        contacts = contacts.filter(contact => !contact.isDeleted);
        const jsonData = JSON.stringify(contacts, null, 2);
        await fs.writeFile(contactsFilePath, jsonData);
        console.log('Contacts saved to file.');
    } catch (error) {
        console.error('Error writing contacts file:', error);
    }
}

async function saveDeletedContactsToFile(contacts) {
    try {
        const currentDeletedContacts = await loadDeletedContactsFromFile();
        const deletedContacts = contacts.filter(contact => contact.isDeleted);
        currentDeletedContacts.push(...deletedContacts);
        const jsonData = JSON.stringify(_.uniqBy(currentDeletedContacts, 'phoneNumber'), null, 2);
        await fs.writeFile(deletedContactsFilePath, jsonData);
        console.log('Contacts saved to file.');
    } catch (error) {
        console.error('Error writing contacts file:', error);
    }
}

function removeDuplicateContacts(contacts) {
    const groupedContacts = _.groupBy(contacts, 'phoneNumber');
    const uniqueContacts = Object.values(groupedContacts).map(group => {
        if (group.length > 1) {
            const notDeletedContact = group.find(contact => !contact.isDeleted);
            if (notDeletedContact) {
                return notDeletedContact;
            } else {
                return group[0];
            }
        } else {
            return group[0];
        }
    });

    return uniqueContacts;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: process.env.EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let whatsappReady = false;
let contacts = [];
let deletedContacts = [];

client.initialize();

client.on('qr', async qr => {
    try {
        getQRcodeTerminal(qr);
        const qrCodeDataURL = await qrcode.toDataURL(qr);
        io.emit('qr', qrCodeDataURL);
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
});

function getQRcodeTerminal(qr) {
    qrcodeTerminal.generate(qr, { small: true });
    console.log('Scan QR code to authenticate.');
}

client.on('authenticated', () => {
    console.log('Authenticated successfully!');
    io.emit('authenticated');
});

const MEDIA_TYPE_MAP = {
    image: "📸 Image",
    video: "📹 Video",
    audio: "🎵 Audio",
    document: "📄 Document",
    sticker: "✨ Sticker",
}

async function getMessageContent(lastMessage) {
    if (!lastMessage.hasMedia) {
        return lastMessage.body;
    }

    const mediaType = lastMessage.type;
    return MEDIA_TYPE_MAP[mediaType] || "📎 Media";
}

async function fetchContactNameAndMaybeUpdate(phoneNumber, chatId) {
    let deletedContact = deletedContacts.find(c => c.phoneNumber === phoneNumber);
    if (deletedContact) {
        return null;
    }

    let contact = contacts.find(c => c.phoneNumber === phoneNumber);

    if (deletedContact) {
        if (deletedContact.isDeleted) {
            return null;
        }
    }

    if (!contact || contact.fullName.toLowerCase() === "contact") {
        console.warn(`Contact ${phoneNumber} not found in local contacts or has generic name. Attempting to fetch contact name from API.`);
        try {
            const remoteContact = await client.getContactById(chatId);
            let contactName = remoteContact.name || remoteContact.pushname || phoneNumber;
            console.log(`Saving contact with name: ${contactName}`);

            if (contact) {
                contacts = contacts.filter(c => !(c.fullName === contact.fullName && c.phoneNumber === contact.phoneNumber));

                const newContact = {
                    fullName: contactName,
                    phoneNumber: phoneNumber,
                    status: contact.status,
                    timestamp: contact.timestamp,
                    key: `${contactName}-${phoneNumber}`,
                    isDeleted: contact.isDeleted,
                    lastMessage: contact.lastMessage
                };
                contacts.push(newContact);
                console.log(`Replacing contact with name from API: ${contactName}`);
                contact = newContact;
            } else {
                contact = {
                    fullName: contactName,
                    phoneNumber: phoneNumber,
                    status: 'new',
                    timestamp: DEFAULT_TIME_STAMP,
                    key: `${contactName}-${phoneNumber}`,
                    isDeleted: false,
                    lastMessage: ""
                };
                contacts.push(contact);
            }
            try {
                await saveContactsToFile(contacts);
                await updateContactStatus(phoneNumber, contact.status, contact.timestamp, contact.isDeleted, contact.lastMessage, false);
            } catch (serverUpdateError) {
                console.error("Error updating contacts on the server:", serverUpdateError.message);
            }
        } catch (fetchError) {
            console.error(`Failed to fetch contact details for ${phoneNumber}:`, fetchError.message);
            return null;
        }
    }
    return contact;
}

async function verifyAndFixContactStatuses() {
    if (!whatsappReady) {
        console.log("WhatsApp not ready, skipping contact status verification.");
        return;
    }

    console.log("Verifying and fixing contact statuses...");

    const totalContacts = contacts.length;
    let processedContacts = 0;

    for (const contact of contacts) {
        processedContacts++;

        io.emit('synchronization_progress', {
            current: processedContacts,
            total: totalContacts
        });

        if (!/^\d{12,15}$/.test(contact.phoneNumber)) {
            console.warn(`Invalid number ignored: ${contact.phoneNumber}`);
            continue;
        }

        const chatId = `${contact.phoneNumber}@c.us`;

        try {
            let currentContact = await fetchContactNameAndMaybeUpdate(contact.phoneNumber, chatId);
            if (!currentContact) {
                continue;
            }

            const chat = await client.getChatById(chatId);
            const lastMessage = await chat.lastMessage;

            if (lastMessage) {
                const messageTimestamp = new Date(lastMessage.timestamp * 1000).toISOString();
                const lastMessageContent = await getMessageContent(lastMessage);

                const expectedStatus = lastMessage.fromMe ? 'sent' : 'answered';
                if (contact.timestamp !== messageTimestamp) {
                    await updateContactStatus(contact.phoneNumber, expectedStatus, messageTimestamp, contact.isDeleted, lastMessageContent, false);
                }
            } else {
                console.log(`No messages found for ${contact.phoneNumber}.`);
            }
        } catch (error) {
            console.error(`Error processing chat for ${phoneNumber}:`, error.message);
        }
    }

    io.emit('contacts_updated', contacts);

    io.emit('synchronization_finished');
    synchronizationFinished = true;

    console.log("Contact status verification completed.");

    setInterval(checkSentMessagesAndSync, 2000);
}

client.on('ready', async () => {
    console.log('WhatsApp client is ready!');
    whatsappReady = true;
    try {
        contacts = await loadContactsFromFile();
        deletedContacts = await loadDeletedContactsFromFile();
        console.log('Contacts loaded from file:', contacts.length, 'contacts.');
        console.log('Deleted contacts loaded from file:', deletedContacts.length, 'deleted contacts.');


        contacts = contacts.map(contact => ({
            ...contact,
            timestamp: contact.timestamp || new Date().toISOString(),
            lastMessage: contact.lastMessage || ""
        }));

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
    const lastMessageContent = await getMessageContent(message);

    await updateContactStatus(senderNumber, 'answered', messageTimestamp, false, lastMessageContent);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/upload', async (req, res) => {
    if (!whatsappReady) {
        return res.status(503).send('WhatsApp not ready. Try again in a few seconds.');
    }

    const { contacts: contactsToSend, message: messageTemplate, testMode = false } = req.body;

    if (!contactsToSend || contactsToSend.length === 0) {
        return res.status(400).send('No contacts selected.');
    }

    console.log(`Starting message sending to ${contactsToSend.length} contacts...`);
    console.log(`Test Mode: ${testMode}`);

    const sendMessages = async () => {
        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (const contact of contactsToSend) {
            const { fullName, phoneNumber: cleanedNumber } = contact;
            const chatId = `${cleanedNumber}@c.us`;
            const personalizedMessage = messageTemplate.replace(/\[name\]/gi, formatContactName(fullName));

            const messageParts = personalizedMessage.split(/\[send\]/gi);

            try {
                if (!testMode) {
                    for (const part of messageParts) {
                        if (part.trim() !== "") {
                            // Await the message being sent and confirmed
                            await client.sendMessage(chatId, part.trim());

                            console.log(`Message ${testMode ? '(TEST) ' : ''}sent to ${fullName} (${cleanedNumber}): "${part.trim()}"`);
                        }
                    }

                    const messageTimestamp = new Date().toISOString();
                    await updateContactStatus(cleanedNumber, "sent", messageTimestamp, contact.isDeleted, messageParts[messageParts.length - 1], true);
                }
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
    };

    try {
        const { results, successCount, errorCount } = await sendMessages();
        res.json({ results, successCount, errorCount });
    } catch (error) {
        console.error('Error during message sending:', error);
        res.status(500).json({ error: 'An error occurred during message sending.' });
    }
});

const normalizePhoneNumber = (phoneNumber, defaultCountryCode, defaultDdd) => {
    if (!phoneNumber) return null;

    let cleanedNumber = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');

    if (cleanedNumber.length === 8 || cleanedNumber.length === 9) {
        cleanedNumber = defaultCountryCode + defaultDdd + cleanedNumber;
    } else if (cleanedNumber.length === 10 || cleanedNumber.length === 11) {
        cleanedNumber = defaultCountryCode + cleanedNumber;
    }

    return cleanedNumber;
};

function formatContactName(name) {
  if (!name) return '';

  const cleanedName = name.replace(/[^a-zA-Z\u00C0-\u017F\s]/g, ''); // Remove non-alphabetic characters EXCEPT accented letters
  if (!cleanedName) return '';

  const nameParts = cleanedName.split(' ').filter(part => part !== ''); // Split into parts and remove empty strings
  if (nameParts.length === 0) return '';

  const firstName = nameParts[0]; // Take the first part as the first name
  if (!firstName) return '';

  const lowerCaseName = firstName.toLowerCase();
  return lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.slice(1); // Capitalize the first letter
}

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
        const normalizedNumber = normalizePhoneNumber(contact.phoneNumber, defaultCountryCode, defaultDdd);
        return {
            ...contact,
            fullName: contact.fullName,
            phoneNumber: normalizedNumber,
            timestamp: contact.timestamp || new Date().toISOString(),
            lastMessage: contact.lastMessage || ""
        };
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
        // Load the current deleted contacts.
        const currentDeletedContacts = await loadDeletedContactsFromFile();

        // Process each updated contact
        for (const updatedContact of updatedContacts) {
            const deletedContactIndex = currentDeletedContacts.findIndex(deletedContact => deletedContact.phoneNumber === updatedContact.phoneNumber);

            if (deletedContactIndex !== -1) {
                // Contact exists in deleted_contacts.json
                const deletedContact = currentDeletedContacts[deletedContactIndex];

                if (!updatedContact.isDeleted || updatedContact.status === "new") {
                    // Contact is being 'un-deleted'. Retrieve information and remove from deleted_contacts.json
                    updatedContact.status = deletedContact.status;
                    updatedContact.timestamp = deletedContact.timestamp;
                    updatedContact.lastMessage = deletedContact.lastMessage;
                    
                    currentDeletedContacts.splice(deletedContactIndex, 1);
                    console.log(`Removed contact ${updatedContact.fullName} from deleted_contacts.json and restored its data.`);
                }
            }
        }


        // Save the updated deleted contacts array.
        const jsonDataDeleted = JSON.stringify(_.uniqBy(currentDeletedContacts, 'phoneNumber'), null, 2);
        await fs.writeFile(deletedContactsFilePath, jsonDataDeleted);


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

async function checkSentMessagesAndSync() {
    if (!whatsappReady) {
        console.log("WhatsApp not ready, skipping check for sent messages.");
        return;
    }

    try {
        const chats = await client.getChats();
        chats.sort((a, b) => b.timestamp - a.timestamp);
        const recentChats = chats
            .filter(chat => !chat.isGroup)
            .slice(0, 10);
        for (const chat of recentChats) {
            const phoneNumber = chat.id.user;
            const chatId = chat.id._serialized;

            let contact = await fetchContactNameAndMaybeUpdate(phoneNumber, chatId);
            if (!contact) {
                continue;
            }

            try {
                const lastMessage = await chat.lastMessage;
                if (lastMessage) {
                    const messageTimestamp = new Date(lastMessage.timestamp * 1000).toISOString();
                    const lastMessageContent = await getMessageContent(lastMessage);
                    if (contact.timestamp < messageTimestamp || contact.timestamp === DEFAULT_TIME_STAMP) {
                        const newStatus = lastMessage.fromMe ? 'sent' : 'answered';
                        await updateContactStatus(phoneNumber, newStatus, messageTimestamp, contact.isDeleted, lastMessageContent, true);
                    }
                }
            } catch (error) {
               // console.error(`Error processing chat for ${phoneNumber}:`, error.message);
            }
        }
    } catch (error) {
        // console.error("Error getting or processing chats:", error.message);
    }
}

async function updateContactStatus(phoneNumber, newStatus, timestamp, isDeleted, lastMessage, sendSocket = true) {
    const contactToUpdate = contacts.find(contact => contact.phoneNumber === phoneNumber);

    if (contactToUpdate) {
        if (!contactToUpdate.isDeleted) {

            contactToUpdate.status = newStatus;
            contactToUpdate.timestamp = timestamp;
            contactToUpdate.isDeleted = isDeleted;
            contactToUpdate.lastMessage = lastMessage;

            await saveContactsToFile(contacts);

            if (sendSocket) {
                io.emit('contacts_updated', contacts);
            }

            console.log(`Contact ${phoneNumber} status updated to ${newStatus}, timestamp: ${timestamp}, isDeleted: ${isDeleted}, lastMessage: ${lastMessage}`);
        }
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

app.get('/synchronization-status', (req, res) => {
    res.json({ synchronizationFinished: synchronizationFinished });
});