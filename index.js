const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const app = express();
const port = 3000;

app.use(fileUpload());
app.use(express.static('public'));
app.use(express.json({ limit: '1024mb' }));

const dataDir = path.join(__dirname, 'data');
const contactsFilePath = path.join(dataDir, 'contacts.json.gz');

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
        const compressedData = await fs.readFile(contactsFilePath);
        const jsonData = await new Promise((resolve, reject) => {
            zlib.gunzip(compressedData, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.toString('utf8'));
                }
            });
        });
        return JSON.parse(jsonData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        } else {
            console.error('Error reading or decompressing contacts file:', error);
            return [];
        }
    }
}

async function saveContactsToServer(contacts) {
    try {
        const jsonData = JSON.stringify(contacts, null, 2);
        const compressedData = await new Promise((resolve, reject) => {
            zlib.gzip(jsonData, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        await fs.writeFile(contactsFilePath, compressedData);
        console.log('Contacts saved to server (compressed).');
    } catch (error) {
        console.error('Error compressing or writing contacts file:', error);
    }
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

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR Code com seu celular para autenticar.');
});

client.on('authenticated', () => {
    console.log('Autenticado com sucesso!');
});

client.on('ready', async () => {
    console.log('Cliente WhatsApp está pronto!');
    whatsappReady = true;
    try {
        contacts = await loadContactsFromServer();
        console.log('Contacts loaded from server:', contacts.length, 'contacts.');
    } catch (error) {
        console.error('Failed to load contacts on ready:', error);
    }
});

// Listen for incoming messages and update status to 'answered'
client.on('message', async message => {
    const senderNumber = message.from.replace('@c.us', '');
    await updateContactStatus(senderNumber, 'answered');
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
                    await updateContactStatus(cleanedNumber, "sent");
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

    if (!updatedContacts) {
        return res.status(400).json({ error: 'No contacts provided to update.' });
    }

    // Filter out contacts with phone numbers shorter than 9 digits
    updatedContacts = updatedContacts.filter(contact => {
        if (contact.phoneNumber && contact.phoneNumber.length >= 9) {
            return true; // Keep the contact
        } else {
            console.warn(`Contact ${contact.fullName} with phone number ${contact.phoneNumber} ignored due to length < 9.`);
            return false; // Filter out the contact
        }
    });

    try {
        await saveContactsToServer(updatedContacts);
        contacts = updatedContacts;
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

async function updateContactStatus(phoneNumber, newStatus) {
    const contactToUpdate = contacts.find(contact => contact.phoneNumber === phoneNumber);

    if (contactToUpdate) {
        contactToUpdate.status = newStatus;
        await saveContactsToServer(contacts);
        console.log(`Contact ${phoneNumber} status updated to ${newStatus}`);
    } else {
        console.warn(`Contact with phone number ${phoneNumber} not found.`);
    }
}

ensureDataDirectoryExists().then(() => {
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
});