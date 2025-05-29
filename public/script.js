// script.js
const vcfFile = document.getElementById('vcfFile');
const contactListDiv = document.getElementById('contactList');
const searchInput = document.getElementById('search');
const selectAllButton = document.getElementById('selectAll');
const deselectAllButton = document.getElementById('deselectAll');
const messageModal = document.getElementById('messageModal');
const messageModalContent = document.getElementById('messageModalContent');
const messageText = document.getElementById('messageText');
const messageTextarea = document.getElementById('message'); // Get the textarea element
const newContactNameInput = document.getElementById('newContactName');  // Novo
const newContactPhoneInput = document.getElementById('newContactPhone');  // Novo
const addContactBtn = document.getElementById('addContactBtn');  // Novo

const CONTACTS_STORAGE_KEY = 'whatsapp_sender_contacts'; // Chave para armazenar no localStorage
const MESSAGE_STORAGE_KEY = 'whatsapp_sender_message';   // Key to store the message

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

// Function to save message to localStorage
function saveMessageToLocalStorage(message) {
    localStorage.setItem(MESSAGE_STORAGE_KEY, message);
}

// Function to load message from localStorage
function loadMessageFromLocalStorage() {
    return localStorage.getItem(MESSAGE_STORAGE_KEY) || ""; // Return empty string if not found
}


// Carrega os contatos do localStorage ao carregar a página
contacts = loadContactsFromLocalStorage();
renderContactList(contacts); // Renderiza a lista inicial

// Load the message from localStorage and set the textarea value
messageTextarea.value = loadMessageFromLocalStorage();

// Save message when it changes
messageTextarea.addEventListener('input', () => {
    saveMessageToLocalStorage(messageTextarea.value);
});

vcfFile.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const vcfContent = e.target.result;
        const newContacts = parseVcfContent(vcfContent); // Extrai os novos contatos

        // Adiciona os novos contatos, evitando duplicatas
        newContacts.forEach(newContact => {
            const isDuplicate = contacts.some(existingContact => existingContact.phoneNumber === newContact.phoneNumber);
            if (!isDuplicate) {
                contacts.push(newContact);
            }
        });

        saveContactsToLocalStorage(contacts); // Salva os contatos atualizados no localStorage
        renderContactList(contacts); // Renderiza a lista atualizada
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

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = contactId;
        checkbox.dataset.index = index;

        const contactText = document.createTextNode(` ${contact.fullName} (${contact.phoneNumber})`);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn', 'btn-sm', 'deleteContactBtn');
        deleteButton.dataset.index = index;

        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('mdi', 'mdi-delete');

        deleteButton.appendChild(deleteIcon); // Adiciona o ícone ao botão
        deleteButton.addEventListener('click', function() {  //Move o EventListener pra cá para não ficar no loop posterior.
            const indexToDelete = parseInt(this.dataset.index);
            deleteContact(indexToDelete);
        });

        label.appendChild(checkbox);
        label.appendChild(contactText);
        label.appendChild(deleteButton);

        contactListDiv.appendChild(label);

        const labelText = label.textContent.trim(); // Pega o texto do label

        const isChecked = selectedContacts.has(labelText) ? selectedContacts.get(labelText) : false; //Verifica o map
        checkbox.checked = isChecked;  //seta o valor do checkbox

        // Salva o texto do label no objeto do contato
        contact.labelText = labelText;

        // Adiciona um ouvinte de evento para cada checkbox
        checkbox.addEventListener('change', (event) => {
            // Atualiza o Map com o estado do checkbox
            selectedContacts.set(labelText, event.target.checked);

        });
    });
}

function deleteContact(indexToDelete) {
    contacts.splice(indexToDelete, 1); // Remove o contato do array
    saveContactsToLocalStorage(contacts); // Salva a lista atualizada no localStorage
    renderContactList(contacts); // Renderiza a lista atualizada
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
    contacts.forEach((contact) => {
       if (selectedContacts.get(contact.labelText)) {
            contactsToSend.push(contact);
        }
    });

    const testModeCheckbox = document.getElementById('testMode');
    const testMode = testModeCheckbox.checked;

    let messageContent = document.getElementById('message').value; // Obtém o conteúdo da mensagem

    // Função para obter a saudação com base na hora do dia
    function getGreeting() {
        const now = new Date();
        const hour = now.getHours();

        if (hour >= 6 && hour < 12) {
            return "Bom dia";
        } else if (hour >= 12 && hour < 18) {
            return "Boa tarde";
        } else {
            return "Boa noite";
        }
    }

    // Substitui [greeting] (case-insensitive) pela saudação apropriada
    messageContent = messageContent.replace(/\[greeting]/gi, getGreeting());


    // Enviar dados para o servidor (exemplo com fetch)
    fetch('/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contacts: contactsToSend, // Envia apenas os contatos selecionados
            message: messageContent, // Envia o conteúdo da mensagem
            testMode: testMode
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
                contactLabel.textContent = 'Contato: ';

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
                statusLabel.textContent = 'Status: ';

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
                messageLabel.textContent = 'Mensagem Enviada: ';

                const messageValue = document.createElement('div');
                messageValue.classList.add('formattedMessage');
                messageValue.textContent = message;

                if(testMode){
                   messageValue.textContent = "[TESTE] " + messageValue.textContent;
                }

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

// Adicionar contato individualmente
addContactBtn.addEventListener('click', () => {
    const name = newContactNameInput.value.trim();
    let phone = newContactPhoneInput.value.trim();

    // Remove espaços e caracteres não numéricos do número de telefone
    phone = phone.replace(/\D/g, '');

    if (name && phone) {
        const isDuplicate = contacts.some(existingContact => existingContact.phoneNumber === phone);
        if (!isDuplicate) {
            const newContact = {
                fullName: name,
                phoneNumber: phone
            };
            contacts.push(newContact);
            saveContactsToLocalStorage(contacts);
            renderContactList(contacts);
        } else {
            alert('Este número de telefone já está na lista.');
        }

        // Limpa os campos do formulário
        newContactNameInput.value = '';
        newContactPhoneInput.value = '';
    } else {
        alert('Por favor, preencha o nome e o número de telefone.');
    }
});