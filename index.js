const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs').promises; // Use promises for fs
const path = require('path'); // Import the 'path' module
const app = express();
const port = 3000;

app.use(fileUpload());
app.use(express.static('public'));
app.use(express.json({ limit: '1024mb' })); // Increased JSON limit

// Define the data directory and file path
const dataDir = path.join(__dirname, 'data');
const contactsFilePath = path.join(dataDir, 'contacts.json');

// Create the data directory if it doesn't exist
async function ensureDataDirectoryExists() {
    try {
        await fs.mkdir(dataDir, { recursive: true }); // recursive: true creates parent directories if needed
    } catch (error) {
        console.error('Error creating data directory:', error);
        // Handle the error appropriately (e.g., exit the application)
        process.exit(1);  // Exit with an error code
    }
}

// Load contacts from the JSON file
async function loadContactsFromServer() {
    try {
        const data = await fs.readFile(contactsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return an empty array
            return [];
        } else {
            console.error('Error reading contacts file:', error);
            return [];  // Or handle the error more gracefully
        }
    }
}

// Save contacts to the JSON file
async function saveContactsToServer(contacts) {
    try {
        const jsonData = JSON.stringify(contacts, null, 2); // Pretty-print the JSON
        await fs.writeFile(contactsFilePath, jsonData, 'utf8');
        console.log('Contacts saved to server.');
    } catch (error) {
        console.error('Error writing contacts file:', error);
    }
}

// Initialize the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let whatsappReady = false;

// Global variable to store contacts
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

    // Load contacts from the server when WhatsApp is ready
    try {
        contacts = await loadContactsFromServer(); // Assign to the global 'contacts' array
        console.log('Contacts loaded from server:', contacts.length, 'contacts.');
    } catch (error) {
        console.error('Failed to load contacts on ready:', error);
    }
});

client.initialize();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/upload', async (req, res) => {
    if (!whatsappReady) {
        return res.status(503).send('WhatsApp ainda não está pronto. Tente novamente em alguns segundos.');
    }

    const contacts = req.body.contacts; // Pega a lista de contatos selecionados do corpo da requisição
    const messageTemplate = req.body.message; // Pega o conteúdo da mensagem do corpo da requisição
    const testMode = req.body.testMode || false; // Pega o estado do modo de teste

    if (!contacts || contacts.length === 0) {
        return res.status(400).send('Nenhum contato selecionado.');
    }

    console.log(`Iniciando envio de mensagens para ${contacts.length} contatos...`);
    console.log(`Modo de Teste: ${testMode}`);

    async function sendMessages() {
        const results = []; // Array para armazenar os resultados de cada envio
        let successCount = 0;
        let errorCount = 0;

        for (const contact of contacts) { // Itera sobre a lista de contatos selecionados
            const fullName = contact.fullName;
            const cleanedNumber = contact.phoneNumber;
            const chatId = `${cleanedNumber}@c.us`;
            const personalizedMessage = messageTemplate.replace(/\[name\]/gi, fullName);

            try {
                if (!testMode) {
                    await client.sendMessage(chatId, personalizedMessage);
                }

                console.log(`Mensagem ${testMode ? '(TESTE) ' : ''}enviada para ${fullName} (${cleanedNumber}): "${personalizedMessage}"`);
                results.push({ contact: fullName, status: 'success', message: personalizedMessage }); // Salva a mensagem enviada
                successCount++;
            } catch (err) {
                console.error(`Erro ao enviar mensagem para ${fullName} (${cleanedNumber}): ${err.message}`);
                results.push({ contact: fullName, status: 'error', message: err.message });
                errorCount++;
            }
        }

        console.log('\nEnvio de mensagens concluído.');
        // Retorna os resultados e os contadores
        return { results, successCount, errorCount };
    }

    // Chama a função assíncrona e envia a resposta após a conclusão
    sendMessages()
        .then(({ results, successCount, errorCount }) => {
            // Formata os resultados para enviar como JSON
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

// Endpoint to update contacts on the server
app.post('/update-contacts', async (req, res) => {
    console.log("Update contacts endpoint called");
    console.log("Request body:", req.body); // Log the request body

    const updatedContacts = req.body.contacts;

    if (!updatedContacts) {
        return res.status(400).json({ error: 'No contacts provided to update.' }); // Send JSON response
    }

    try {
        await saveContactsToServer(updatedContacts);
        contacts = updatedContacts;  // Update the in-memory contacts as well
        res.status(200).json({ message: 'Contacts updated successfully on the server.' }); // Send JSON response
    } catch (error) {
        console.error('Error updating contacts on the server:', error);
        res.status(500).json({ error: 'Failed to update contacts on the server.' }); // Send JSON response
    }
});

// Endpoint to retrieve contacts
app.get('/update-contacts', async (req, res) => {
    try {
        const contacts = await loadContactsFromServer();
        res.status(200).json(contacts);  // Send contacts as JSON
    } catch (error) {
        console.error('Error loading contacts:', error);
        res.status(500).json({ error: 'Failed to load contacts from server.' });
    }
});

// Before starting the server, ensure the data directory exists
ensureDataDirectoryExists().then(() => {
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
});