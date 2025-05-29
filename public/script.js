// script.js
const vcfFile = document.getElementById('vcfFile');
const contactListDiv = document.getElementById('contactList');
const searchInput = document.getElementById('search');
const selectAllButton = document.getElementById('selectAll');
const deselectAllButton = document.getElementById('deselectAll');
const messageModal = document.getElementById('messageModal');
const messageModalContent = document.getElementById('messageModalContent');
const messageText = document.getElementById('messageText');

const CONTACTS_STORAGE_KEY = 'whatsapp_sender_contacts'; // Chave para armazenar no localStorage

// Função para fechar a janela flutuante
document.querySelector('.close').addEventListener('click', function () {
    messageModal.style.display = "none";
});

// Fecha a janela se o usuário clicar fora dela
window.onclick = function (event) {
    if (event.target == messageModal) {
        messageModal.style.display = "none";
    }
}

let contacts = []; // Armazena todos os contatos extraídos do VCF
let selectedContacts = new Map(); // Armazena o estado dos checkboxes (true/false)

// Função para salvar os contatos no localStorage
function saveContactsToLocalStorage(contacts) {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
}

// Função para carregar os contatos do localStorage
function loadContactsFromLocalStorage() {
    const storedContacts = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (storedContacts) {
        return JSON.parse(storedContacts);
    }
    return [];
}

// Carrega os contatos do localStorage ao carregar a página
contacts = loadContactsFromLocalStorage();
renderContactList(contacts); // Renderiza a lista inicial

vcfFile.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const vcfContent = e.target.result;
        contacts = parseVcfContent(vcfContent); // Preenche o array de contatos
        saveContactsToLocalStorage(contacts); // Salva os contatos no localStorage
        renderContactList(contacts); // Renderiza a lista inicial
    };
    reader.readAsText(file);
});

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
            contacts.push({
                fullName,
                phoneNumber
            });
        }
    }
    return contacts;
}

function renderContactList(contactList) {
    contactListDiv.innerHTML = ''; // Limpa a lista existente

    contactList.forEach((contact, index) => {
        const contactId = `contact-${index}`; // ID único para cada contato

        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" id="${contactId}" data-index="${index}">
            ${contact.fullName} (${contact.phoneNumber})
        `;

        contactListDiv.appendChild(label);

        const checkbox = label.querySelector('input[type="checkbox"]');
        const labelText = label.textContent.trim(); // Pega o texto do label

        const isChecked = selectedContacts.has(labelText) ? selectedContacts.get(labelText) : false; //Verifica o map
        checkbox.checked = isChecked;  //seta o valor do checkbox

        // Adiciona um ouvinte de evento para cada checkbox
        checkbox.addEventListener('change', (event) => {
            // Atualiza o Map com o estado do checkbox
            selectedContacts.set(labelText, event.target.checked);

        });
    });
}

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredContacts = contacts.filter(contact =>
        contact.fullName.toLowerCase().includes(searchTerm) ||
        contact.phoneNumber.toLowerCase().includes(searchTerm)
    );
    renderContactList(filteredContacts); // Renderiza a lista filtrada
});

selectAllButton.addEventListener('click', () => {
    contacts.forEach((contact, index) => {
        const contactId = `contact-${index}`;
        const label = document.querySelector(`#${contactId}`).parentElement; // Seleciona o label pai
        const labelText = label.textContent.trim();
        selectedContacts.set(labelText, true); // Define todos como selecionados no Map

    });
    renderContactList(contacts); // Renderiza a lista com todos selecionados
});

deselectAllButton.addEventListener('click', () => {
    contacts.forEach((contact, index) => {
        const contactId = `contact-${index}`;
        const label = document.querySelector(`#${contactId}`).parentElement; // Seleciona o label pai
        const labelText = label.textContent.trim();
        selectedContacts.set(labelText, false); // Define todos como não selecionados no Map
    });
    renderContactList(contacts); // Renderiza a lista com todos desmarcados
});

// Antes do envio do formulário, atualize o campo de contatos selecionados
const form = document.querySelector('form');
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Evita o envio padrão do formulário

    const contactsToSend = [];
    contacts.forEach((contact, index) => {
        const contactId = `contact-${index}`;
        const label = document.querySelector(`#${contactId}`).parentElement; // Seleciona o label pai
        const labelText = label.textContent.trim();

        if (selectedContacts.get(labelText)) {
            contactsToSend.push(contact); // Adiciona o contato ao array se estiver selecionado
        }
    });

    const messageContent = document.getElementById('message').value; // Obtém o conteúdo da mensagem

    // Enviar dados para o servidor (exemplo com fetch)
    fetch('/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contacts: contactsToSend, // Envia apenas os contatos selecionados
            message: messageContent // Envia o conteúdo da mensagem
        })
    })
        .then(response => response.json()) // Espera uma resposta JSON
        .then(data => {
            // Limpa o conteúdo anterior
            messageText.innerHTML = '';

            data.results.forEach(result => {
                const contactName = result.contact;
                const status = result.status;
                const message = result.message;

                // Cria elementos HTML usando DOM
                const resultElement = document.createElement('div');

                const contactDiv = document.createElement('div');
                contactDiv.style.display = 'flex';
                contactDiv.style.flexDirection = 'row';
                contactDiv.style.alignItems = 'center';

                const contactLabel = document.createElement('div');
                contactLabel.style.fontWeight = 'bold';
                contactLabel.textContent = 'Contato:';

                const contactValue = document.createElement('div');
                contactValue.textContent = contactName;

                contactDiv.appendChild(contactLabel);
                contactDiv.appendChild(contactValue);

                const statusDiv = document.createElement('div');
                statusDiv.style.display = 'flex';
                statusDiv.style.flexDirection = 'row';
                statusDiv.style.alignItems = 'center';

                const statusLabel = document.createElement('div');
                statusLabel.style.fontWeight = 'bold';
                statusLabel.textContent = 'Status:';

                const statusImage = document.createElement('img');
                statusImage.alt = status === 'success' ? 'Sucesso' : 'Erro';
                statusImage.src = status === 'success' ? 'https://img.icons8.com/color/32/000000/checked-2--v1.png' : 'https://img.icons8.com/color/32/000000/cancel--v1.png';
                statusImage.classList.add('formattedImage');

                statusDiv.appendChild(statusLabel);
                statusDiv.appendChild(statusImage);

                const messageDiv = document.createElement('div');
                messageDiv.style.display = 'flex';
                messageDiv.style.flexDirection = 'column';

                const messageLabel = document.createElement('div');
                messageLabel.style.fontWeight = 'bold';
                messageLabel.textContent = 'Mensagem Enviada:';

                const messageValue = document.createElement('div');
                messageValue.classList.add('formattedMessage');
                messageValue.textContent = message;

                messageDiv.appendChild(messageLabel);
                messageDiv.appendChild(messageValue);

                resultElement.appendChild(contactDiv);
                resultElement.appendChild(statusDiv);
                resultElement.appendChild(messageDiv);

                // Adiciona o elemento ao container de resultados
                messageText.appendChild(resultElement);
            });

            // Exibe a janela flutuante
            messageModal.style.display = "block";
        })
        .catch(error => {
            console.error('Erro:', error);
            messageText.textContent = 'Ocorreu um erro ao enviar as mensagens.';
            messageModal.style.display = "block";
        });
});