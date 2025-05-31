const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(fileUpload());
app.use(express.static('public'));
app.use(express.json({ limit: '1024mb' })); // Increased JSON limit

// Inicializa o cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let whatsappReady = false;

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

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});