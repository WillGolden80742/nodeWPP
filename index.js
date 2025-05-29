const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Escaneie o QR Code com seu celular para autenticar.');
});

client.on('authenticated', () => {
  console.log('Autenticado com sucesso!');
});

client.on('ready', () => {
  console.log('Cliente WhatsApp está pronto!');
});

client.on('message', async msg => {
  if (msg.fromMe || msg.type !== 'chat') return;

  try {
    const contact = await msg.getContact();
    const nome = contact.pushname || contact.name || 'cliente';

    const resposta = `Oi, ${nome}. Aguarde um momento que um atendente já irá te chamar...`;
    await client.sendMessage(msg.from, resposta);

    console.log(`Mensagem automática enviada para ${nome}: ${resposta}`);
  } catch (error) {
    console.error('Erro ao responder mensagem:', error.message);
  }
});

client.initialize();
