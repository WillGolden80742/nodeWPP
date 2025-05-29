const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware para habilitar o upload de arquivos
app.use(fileUpload());
app.use(express.static('public')); // Serve arquivos estáticos (HTML, CSS, etc.)

/**
 * Função para analisar o conteúdo de um arquivo VCF e extrair contatos.
 * @param {string} vcfContent - O conteúdo completo do arquivo VCF como uma string.
 * @returns {Array<Object>} Uma array de objetos de contato, cada um com 'fullName' e 'phoneNumber'.
 */
function parseVcfContent(vcfContent) {
    const contacts = [];
    const vcards = vcfContent.split(/BEGIN:VCARD\r?\n/).filter(Boolean);

    for (const vcard of vcards) {
        let fullName = 'Contato';
        let phoneNumber = null;

        const lines = vcard.split(/\r?\n/);

        for (const line of lines) {
            if (line.startsWith('FN:')) {
                fullName = line.substring(3).trim();
            } else if (line.startsWith('N:') && fullName === 'Contato') {
                const nameParts = line.substring(2).split(';');
                if (nameParts[1]) {
                    fullName = nameParts[1].trim();
                } else if (nameParts[0]) {
                    fullName = nameParts[0].trim();
                }
                fullName = fullName.replace(/\s+/g, ' ').trim();
            } else if (line.startsWith('TEL;')) {
                const telMatch = line.match(/(\d[\d\s\-\(\)\+]*)$/);
                if (telMatch && telMatch[1]) {
                    phoneNumber = telMatch[1].replace(/\D/g, '');
                }
            }
        }

        if (phoneNumber) {
            contacts.push({ fullName, phoneNumber });
        }
    }
    return contacts;
}


// Inicializa o cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Evento disparado quando o QR Code é gerado para autenticação
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR Code com seu celular para autenticar.');
});

// Evento disparado quando o cliente é autenticado com sucesso
client.on('authenticated', () => {
    console.log('Autenticado com sucesso!');
});

// Variável para armazenar o cliente está pronto.
let whatsappReady = false;

// Evento disparado quando o cliente WhatsApp está pronto para uso
client.on('ready', async () => {
    console.log('Cliente WhatsApp está pronto!');
    whatsappReady = true;
});

client.initialize();

// Rota principal para exibir o formulário de upload
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Assumindo que você tem um index.html na pasta 'public'
});


// Rota para processar o upload do arquivo VCF
app.post('/upload', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }

    const vcfFile = req.files.vcfFile;
    const vcfContent = vcfFile.data.toString('utf8');
    const contacts = parseVcfContent(vcfContent);

    if (!contacts || contacts.length === 0) {
        return res.status(400).send('Nenhum contato encontrado no arquivo VCF.');
    }

    const messageTemplate = req.body.message;

    console.log(`Iniciando envio de mensagens para ${contacts.length} contatos...`);

    if (!whatsappReady) {
        return res.status(503).send('WhatsApp ainda não está pronto. Tente novamente em alguns segundos.');
    }

    // Função assíncrona para enviar as mensagens e lidar com os resultados
    async function sendMessages() {
        const results = []; // Array para armazenar os resultados de cada envio
        let successCount = 0;
        let errorCount = 0;

        for (const contact of contacts) {
            const fullName = contact.fullName;
            const cleanedNumber = contact.phoneNumber;
            const chatId = `${cleanedNumber}@c.us`;
            const personalizedMessage = messageTemplate.replace(/\[name\]/g, fullName);

            try {
                // await client.sendMessage(chatId, personalizedMessage);
                console.log(`Mensagem enviada para ${fullName} (${cleanedNumber}): "${personalizedMessage}"`);
                results.push({ contact: fullName, status: 'success', message: 'Mensagem enviada com sucesso!' });
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
            // Formata os resultados em HTML
            let resultsHtml = '<h2>Resultados do Envio:</h2><ul>';
            results.forEach(result => {
                resultsHtml += `<li>${result.contact}: ${result.status === 'success' ? 'Sucesso' : 'Erro'} - ${result.message}</li>`;
            });
            resultsHtml += '</ul>';
            resultsHtml += `<p>Total de Sucessos: ${successCount}</p>`;
            resultsHtml += `<p>Total de Erros: ${errorCount}</p>`;

            // Envia a resposta HTML para o cliente
            res.send(`<h1>Envio Concluído!</h1>${resultsHtml}`);
        })
        .catch(error => {
            console.error('Erro durante o envio das mensagens:', error);
            res.status(500).send('Ocorreu um erro durante o envio das mensagens.');
        });

});


app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});