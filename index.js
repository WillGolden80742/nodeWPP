const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs').promises;
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;

// Create HTTP server
const httpServer = createServer(app);

// Create WebSocket server
const io = new Server(httpServer, { /* options */ });

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

async function loadContactsFromServer() {
    try {
        const data = await fs.readFile(contactsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        } else {
            console.error('Error reading contacts file:', error);
            return [];
        }
    }
}

async function saveContactsToServer(contacts) {
    try {
        const jsonData = JSON.stringify(contacts, null, 2);
        await fs.writeFile(contactsFilePath, jsonData);
        console.log('Contacts saved to server.');
    } catch (error) {
        console.error('Error writing contacts file:', error);
    }
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Modify this path if needed
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let whatsappReady = false;
let contacts = [];

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR Code com seu celular para autenticar.');
});

client.on('authenticated', () => {
    console.log('Autenticado com sucesso!');
});


async function verifyAndFixContactStatuses() {
    if (!whatsappReady) {
        console.log("WhatsApp not ready, skipping contact status verification.");
        return;
    }

    console.log("Verifying and fixing contact statuses...");

    for (const contact of contacts) {
        // Validação: o número deve conter apenas dígitos e ter entre 12 e 15 dígitos
        if (!/^\d{12,15}$/.test(contact.phoneNumber)) {
            console.warn(`Número inválido ignorado: ${contact.phoneNumber}`);
            continue;
        }

        const chatId = `${contact.phoneNumber}@c.us`;

        try {
            const chat = await client.getChatById(chatId);
            const messages = await chat.fetchMessages({ limit: 1 }); // Get the last message

            let lastMessageContent = "";

            if (messages && messages.length > 0) {
                const lastMessage = messages[0];
                const messageTimestamp = new Date(lastMessage.timestamp * 1000).toISOString(); // Convert seconds to milliseconds and format

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
                    if (contact.status !== 'sent' && contact.status !== 'answered') {
                        await updateContactStatus(contact.phoneNumber, 'sent', messageTimestamp, lastMessageContent);
                        console.log(`Updated status of ${contact.phoneNumber} to sent, timestamp: ${messageTimestamp}, lastMessage: ${lastMessageContent}`);
                    }
                } else {
                    if (contact.status !== 'answered') {
                        await updateContactStatus(contact.phoneNumber, 'answered', messageTimestamp, lastMessageContent);
                        console.log(`Updated status of ${contact.phoneNumber} to answered, timestamp: ${messageTimestamp}, lastMessage: ${lastMessageContent}`);
                    }
                }
            } else {
                console.log(`No messages found for ${contact.phoneNumber}.`);
                await updateContactStatus(contact.phoneNumber, contact.status, contact.timestamp, ""); //Keep the value on the server
            }
        } catch (error) {
            console.error(`Error processing chat for ${contact.phoneNumber}:`, error.message);
        }
    }

    console.log("Contact status verification completed.");
}



client.on('ready', async () => {
    console.log('Cliente WhatsApp está pronto!');
    whatsappReady = true;
    try {
        contacts = await loadContactsFromServer();
        console.log('Contacts loaded from server:', contacts.length, 'contacts.');

        // Ensure all contacts have a timestamp.  If not, set it to now.
        contacts = contacts.map(contact => {
            if (!contact.timestamp) {
                contact.timestamp = new Date().toISOString();
            }
            if (!contact.lastMessage) {
                contact.lastMessage = "";
            }

            return contact;
        });

        await saveContactsToServer(contacts); // Save back with updated timestamp
    } catch (error) {
        console.error('Failed to load contacts on ready:', error);
    }

    // Send initial contact list to connected clients
    io.emit('contacts_updated', contacts);

    // Initial status verification
    await verifyAndFixContactStatuses();

});


// Listen for incoming messages and update status to 'answered'
client.on('message', async message => {
    const senderNumber = message.from.replace('@c.us', '');
    const messageTimestamp = new Date(message.timestamp * 1000).toISOString(); //Convert timestamp to readable date
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

client.initialize();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/upload', async (req, res) => {
    if (!whatsappReady) {
        return res.status(503).send('WhatsApp ainda não está pronto. Tente novamente em alguns segundos.');
    }

    const contactsToSend = req.body.contacts;
    const messageTemplate = req.body.message;
    const testMode = req.body.testMode || false;

    if (!contactsToSend || contactsToSend.length === 0) {
        return res.status(400).send('Nenhum contato selecionado.');
    }

    console.log(`Iniciando envio de mensagens para ${contactsToSend.length} contatos...`);
    console.log(`Modo de Teste: ${testMode}`);

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

                    // Update contact status to "sent" IMMEDIATELY after sending
                    const messageTimestamp = new Date().toISOString();

                    await updateContactStatus(cleanedNumber, "sent", messageTimestamp, personalizedMessage);

                }

                console.log(`Mensagem ${testMode ? '(TESTE) ' : ''}enviada para ${fullName} (${cleanedNumber}): "${personalizedMessage}"`);
                results.push({ contact: fullName, status: 'success', message: personalizedMessage });
                successCount++;
            } catch (err) {
                console.error(`Erro ao enviar mensagem para ${fullName} (${cleanedNumber}): ${err.message}`);
                results.push({ contact: fullName, status: 'error', message: err.message });
                errorCount++;
            }
        }

        console.log('\nEnvio de mensagens concluído.');
        return { results, successCount, errorCount };
    }

    sendMessages()
        .then(async ({ results, successCount, errorCount }) => {
            //Format the results for the client
            res.json({
                results: results,
                successCount: successCount,
                errorCount: errorCount
            });
        })
        .catch(error => {
            console.error('Erro durante o envio das mensagens:', error);
            res.status(500).json({ error: 'Ocorreu um erro durante o envio das mensagens.' });
        });
});

app.post('/update-contacts', async (req, res) => {
    console.log("Update contacts endpoint called");
    console.log("Request body:", req.body);

    let updatedContacts = req.body.contacts;
    const defaultCountryCode = req.body.countryCode;
    const defaultDdd = req.body.ddd;

    if (!updatedContacts) {
        return res.status(400).json({ error: 'No contacts provided to update.' });
    }

    // Função para normalizar número de telefone e remover zeros do início
    const normalizePhoneNumber = (phoneNumber) => {
        let cleanedNumber = phoneNumber.replace(/\D/g, '');

        // Remove zeros do começo
        cleanedNumber = cleanedNumber.replace(/^0+/, '');

        if (cleanedNumber.length === 8 || cleanedNumber.length === 9) {
            cleanedNumber = defaultCountryCode + defaultDdd + cleanedNumber;
        } else if (cleanedNumber.length === 10 || cleanedNumber.length === 11) {
            cleanedNumber = defaultCountryCode + cleanedNumber;
        }

        return cleanedNumber;
    };

    // Normaliza os números
    updatedContacts = updatedContacts.map(contact => {
        if (contact.phoneNumber) {
            contact.phoneNumber = normalizePhoneNumber(contact.phoneNumber);
        }
        //If there is no timestamp, add it.
        if (!contact.timestamp) {
            contact.timestamp = new Date().toISOString();
        }

        if (!contact.lastMessage) {
            contact.lastMessage = "";
        }

        return contact;
    });

    // Filtra contatos com número < 12 dígitos
    updatedContacts = updatedContacts.filter(contact => {
        if (contact.phoneNumber && contact.phoneNumber.length >= 12) {
            return true;
        } else {
            console.warn(`Contact ${contact.fullName} with phone number ${contact.phoneNumber} ignored due to length < 12.`);
            return false;
        }
    });

    try {
        await saveContactsToServer(updatedContacts);
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
        const contacts = await loadContactsFromServer();
        res.status(200).json(contacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
        res.status(500).json({ error: 'Failed to load contacts from server.' });
    }
});

async function updateContactStatus(phoneNumber, newStatus, timestamp, lastMessage) {
    const contactToUpdate = contacts.find(contact => contact.phoneNumber === phoneNumber);

    if (contactToUpdate) {
        contactToUpdate.status = newStatus;
        contactToUpdate.timestamp = timestamp; // Update the timestamp
        contactToUpdate.lastMessage = lastMessage; // Update the lastMessage

        await saveContactsToServer(contacts);

        // Emit event to all connected clients
        io.emit('contacts_updated', contacts);

        console.log(`Contact ${phoneNumber} status updated to ${newStatus}, timestamp: ${timestamp}, lastMessage: ${lastMessage}`);
    } else {
        console.warn(`Contact with phone number ${phoneNumber} not found.`);
    }
}

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send the initial contact list to the newly connected client
    socket.emit('contacts_updated', contacts);

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

ensureDataDirectoryExists().then(() => {
    httpServer.listen(port, () => {  // Use httpServer instead of app
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
});