// script.js
const fileInput = document.getElementById('fileInput');
const contactListDiv = document.getElementById('contactList');
const searchInput = document.getElementById('search');
const selectAllButton = document.getElementById('selectAll');
const deselectAllButton = document.getElementById('deselectAll');
const messageModal = document.getElementById('messageModal');
const messageModalContent = document.getElementById('messageModalContent');
const messageText = document.getElementById('messageText');
const messageTextarea = document.getElementById('message');
const newContactNameInput = document.getElementById('newContactName');
const newContactPhoneInput = document.getElementById('newContactPhone');
const addContactBtn = document.getElementById('addContactBtn');
const csvColumnSelectDiv = document.getElementById('csvColumnSelect');
const nameColumnSelect = document.getElementById('nameColumn');
const phoneColumnSelect = document.getElementById('phoneColumn');
const loadContactsBtn = document.getElementById('loadContactsBtn');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const mainForm = document.getElementById('mainForm');

const MESSAGE_STORAGE_KEY = 'whatsapp_sender_message';
const NAME_COLUMN_STORAGE_KEY = 'whatsapp_sender_name_column';
const PHONE_COLUMN_STORAGE_KEY = 'whatsapp_sender_phone_column';

let contacts = [];
let selectedContacts = new Map();
let csvHeaders = [];  // Store CSV headers
let fileType = null; // Store the file type (csv or vcf)
let csvContent = null; // Store the CSV file content

// Function to save selected column indexes to localStorage
function saveColumnSelectionsToLocalStorage(nameColumnIndex, phoneColumnIndex) {
    localStorage.setItem(NAME_COLUMN_STORAGE_KEY, nameColumnIndex);
    localStorage.setItem(PHONE_COLUMN_STORAGE_KEY, phoneColumnIndex);
}

// Function to load selected column indexes from localStorage
function loadColumnSelectionsFromLocalStorage() {
    const storedNameColumnIndex = localStorage.getItem(NAME_COLUMN_STORAGE_KEY);
    const storedPhoneColumnIndex = localStorage.getItem(PHONE_COLUMN_STORAGE_KEY);

    return {
        nameColumnIndex: storedNameColumnIndex !== null ? storedNameColumnIndex : null,
        phoneColumnIndex: storedPhoneColumnIndex !== null ? storedPhoneColumnIndex : null
    };
}

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

// Function to save message to localStorage
function saveMessageToLocalStorage(message) {
    localStorage.setItem(MESSAGE_STORAGE_KEY, message);
}

// Function to load message from localStorage
function loadMessageFromLocalStorage() {
    return localStorage.getItem(MESSAGE_STORAGE_KEY) || "";
}

// Load the message from localStorage and set the textarea value
messageTextarea.value = loadMessageFromLocalStorage();

// Save message when it changes
messageTextarea.addEventListener('input', () => {
    saveMessageToLocalStorage(messageTextarea.value);
});

// Initial state of the send button (disabled)
sendMessageBtn.disabled = true;

const storedColumnSelections = loadColumnSelectionsFromLocalStorage();

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();


    if (fileName.endsWith('.csv')) {
        fileType = 'csv';
        csvColumnSelectDiv.style.display = 'block';
    } else if (fileName.endsWith('.vcf')) {
        fileType = 'vcf';
        csvColumnSelectDiv.style.display = 'none';
    } else {
        alert('Tipo de arquivo não suportado. Por favor, selecione um arquivo .csv ou .vcf.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        csvContent = e.target.result;  //Store the content locally.

        if (fileType === 'csv') {
            csvHeaders = await getCsvHeaders(csvContent);
            populateColumnSelects(csvHeaders);
        } else {
            //If is VCF then load contacts.
            await loadContacts();
        }
    };

    if (fileType === 'csv') {
        reader.readAsText(file, 'ISO-8859-1');  // For CSV, specify encoding.  This might need to change.
    } else {
        reader.readAsText(file);
    }
});

// Add event listener for the "Carregar Contatos" button
loadContactsBtn.addEventListener('click', async () => {
    // Save the selected column indexes to localStorage
    saveColumnSelectionsToLocalStorage(nameColumnSelect.value, phoneColumnSelect.value);

    await loadContacts();
    csvColumnSelectDiv.style.display = 'none';
});

async function loadContacts() {
    let newContacts = [];

    if (fileType === 'vcf') {
        newContacts = parseVcfContent(csvContent); //Use locally stored value
    } else if (fileType === 'csv') {
        newContacts = parseCsvContent(csvContent, nameColumnSelect.value, phoneColumnSelect.value);
    }

    // Adiciona os novos contatos, evitando duplicatas
    newContacts.forEach(newContact => {
        const isDuplicate = contacts.some(existingContact => existingContact.phoneNumber === newContact.phoneNumber);
        if (!isDuplicate) {
            contacts.push(newContact);
        }
    });

    await updateContactsOnServer(contacts);  // Save to server
    renderContactList(contacts);
}


// Function to get CSV headers
async function getCsvHeaders(csvContent) {
    const lines = csvContent.split(/\r?\n/).filter(Boolean);
    if (lines.length > 0) {
        return lines[0].split(';'); // Using semicolon as delimiter

    }
    return [];
}

// Function to populate the select elements with column names
function populateColumnSelects(headers) {
    nameColumnSelect.innerHTML = '';
    phoneColumnSelect.innerHTML = '';

    headers.forEach((header, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = header;
        nameColumnSelect.appendChild(option.cloneNode(true)); // Clone to avoid moving the option
        phoneColumnSelect.appendChild(option);
    });

    // Select stored column indexes if available
    if (storedColumnSelections.nameColumnIndex !== null) {
        nameColumnSelect.value = storedColumnSelections.nameColumnIndex;
    }
    if (storedColumnSelections.phoneColumnIndex !== null) {
        phoneColumnSelect.value = storedColumnSelections.phoneColumnIndex;
    }
}


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

function parseCsvContent(csvContent, nameColumnIndex, phoneColumnIndex) {
    const contacts = [];
    const lines = csvContent.split(/\r?\n/).filter(Boolean);

    if (lines.length <= 1) return [];  //Need headers *and* data

    for (let i = 1; i < lines.length; i++) {  // Skip the header line
        const values = lines[i].split(';'); // Using semicolon as delimiter
        const fullName = values[nameColumnIndex] ? values[nameColumnIndex].trim() : 'Contato';
        let phoneNumber = values[phoneColumnIndex] ? values[phoneColumnIndex].trim() : null;

        if (phoneNumber) {
            phoneNumber = phoneNumber.replace(/\D/g, '');  // Remove non-digit characters

            //Check if phonenumber is a number.
            if (!/^\d+$/.test(phoneNumber)) {
                console.warn(`Número de telefone inválido encontrado: ${phoneNumber}. Ignorando.`);
                continue; // Skip this contact if phone number is invalid
            }
            contacts.push({
                fullName,
                phoneNumber
            });
        }
    }
    return contacts;
}

async function updateContactsOnServer(contacts) {
    try {
        const response = await fetch('/update-contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contacts: contacts })
        });

        if (!response.ok) {
            console.error('Failed to update contacts on the server:', response.status, response.statusText);
            alert('Failed to update contacts on the server.');
        } else {
            console.log('Contacts updated on the server.');
        }
    } catch (error) {
        console.error('Error updating contacts on the server:', error);
        alert('Error updating contacts on the server.');
    }
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
        deleteButton.addEventListener('click', function () {  //Move o EventListener pra cá para não ficar no loop posterior.
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
            updateSendButtonState();  // Update button state on change
        });
    });

    updateSendButtonState(); // Update button state after rendering
}

async function deleteContact(indexToDelete) {
    contacts.splice(indexToDelete, 1); // Remove o contato do array
    await updateContactsOnServer(contacts);  // Save to server
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
    contacts.forEach((contact) => {
        selectedContacts.set(contact.labelText, true); // Define todos como selecionados no Map
    });
    renderContactList(contacts); // Renderiza a lista com todos selecionados
});

deselectAllButton.addEventListener('click', () => {
    contacts.forEach((contact) => {
        selectedContacts.set(contact.labelText, false); // Define todos como não selecionados no Map
    });
    renderContactList(contacts); // Renderiza a lista com todos desmarcados
});

function getGreetings(languageCode) {
    const now = new Date();
    const hour = now.getHours();

    let period;
    if (hour >= 6 && hour < 12) {
        period = "morning";
    } else if (hour >= 12 && hour < 18) {
        period = "afternoon";
    } else {
        period = "evening";
    }

    const greetings = {
        pt: { morning: "Bom dia", afternoon: "Boa tarde", evening: "Boa noite" },
        en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
        es: { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches" },
        fr: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir" },
        de: { morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend" },
        it: { morning: "Buongiorno", afternoon: "Buon pomeriggio", evening: "Buonasera" },
        ru: { morning: "Доброе утро", afternoon: "Добрый день", evening: "Добрый вечер" },
        zh: { morning: "早上好", afternoon: "下午好", evening: "晚上好" },
        ja: { morning: "おはようございます", afternoon: "こんにちは", evening: "こんばんは" },
        ko: { morning: "좋은 아침입니다", afternoon: "안녕하세요", evening: "안녕하세요" },
        ar: { morning: "صباح الخير", afternoon: "مساء الخير", evening: "مساء الخير" },
        hi: { morning: "सुप्रभात", afternoon: "नमस्कार", evening: "शुभ संध्या" },
        nl: { morning: "Goedemorgen", afternoon: "Goedemiddag", evening: "Goedenavond" },
        sv: { morning: "God morgon", afternoon: "God eftermiddag", evening: "God kväll" },
        tr: { morning: "Günaydın", afternoon: "Tünaydın", evening: "İyi akşamlar" },
        pl: { morning: "Dzień dobry", afternoon: "Dzień dobry", evening: "Dobry wieczór" },
        ro: { morning: "Bună dimineața", afternoon: "Bună ziua", evening: "Bună seara" },
        el: { morning: "Καλημέρα", afternoon: "Καλό απόγευμα", evening: "Καλησπέρα" },
        fi: { morning: "Hyvää huomenta", afternoon: "Hyvää iltapäivää", evening: "Hyvää iltaa" },
        he: { morning: "בוקר טוב", afternoon: "צהריים טובים", evening: "ערב טוב" }
    };

    const selectedLanguage = greetings[languageCode] || greetings["en"];
    return selectedLanguage[period];
}

function updateSendButtonState() {
    let atLeastOneSelected = false;
    for (const value of selectedContacts.values()) {
        if (value === true) {
            atLeastOneSelected = true;
            break;
        }
    }
    sendMessageBtn.disabled = !atLeastOneSelected;
}

// Intercept the form submission
mainForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    if (sendMessageBtn.disabled) {
        alert('Por favor, selecione ao menos um contato antes de enviar as mensagens.');
        return;
    }

    const contactsToSend = [];
    contacts.forEach((contact) => {
        if (selectedContacts.get(contact.labelText)) {
            contactsToSend.push(contact);
        }
    });

    const testModeCheckbox = document.getElementById('testMode');
    const testMode = testModeCheckbox.checked;

    let messageContent = document.getElementById('message').value;

    const languageCode = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0];

    messageContent = messageContent.replace(/\[greeting]/gi, getGreetings(languageCode));


    fetch('/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contacts: contactsToSend,
            message: messageContent,
            testMode: testMode
        })
    })
        .then(response => response.json())
        .then(data => {
            messageText.innerHTML = '';

            data.results.forEach(result => {
                const contactName = result.contact;
                const status = result.status;
                const message = result.message;

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

                if (testMode) {
                    messageValue.textContent = "[TESTE] " + messageValue.textContent;
                }

                messageDiv.appendChild(messageLabel);
                messageDiv.appendChild(messageValue);

                resultElement.appendChild(contactDiv);
                resultElement.appendChild(statusDiv);
                resultElement.appendChild(messageDiv);

                messageText.appendChild(resultElement);
            });

            messageModal.style.display = "block";
        })
        .catch(error => {
            console.error('Erro:', error);
            messageText.textContent = 'Ocorreu um erro ao enviar as mensagens.';
            messageModal.style.display = "block";
        });
});

// Adicionar contato individualmente
addContactBtn.addEventListener('click', async () => {
    const name = newContactNameInput.value.trim();
    let phone = newContactPhoneInput.value.trim();

    // Remove espaços e caracteres não numéricos do número de telefone
    phone = phone.replace(/\D/g, '');

    if (name && phone) {
        //Check if phonenumber is a number.
        if (!/^\d+$/.test(phone)) {
            alert("Por favor, insira um número de telefone válido (apenas dígitos).");
            return;
        }

        const isDuplicate = contacts.some(existingContact => existingContact.phoneNumber === phone);
        if (!isDuplicate) {
            const newContact = {
                fullName: name,
                phoneNumber: phone
            };
            contacts.push(newContact);
            await updateContactsOnServer(contacts);  // Save to server
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

// Load contacts from the server on page load
async function loadContactsFromServer() {
    try {
        const response = await fetch('/update-contacts'); // Adjust the URL if needed
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        contacts = await response.json();
        // Initialize selectedContacts Map
        contacts.forEach(contact => {
            selectedContacts.set(contact.labelText, false);  // Initially, no contact is selected
        });
        renderContactList(contacts);
    } catch (error) {
        console.error('Failed to load contacts from server:', error);
        alert('Failed to load contacts from server. Check the console for details.');
        contacts = [];  // Ensure contacts is an empty array if loading fails
    } finally {
        renderContactList(contacts);  // Render even if loading fails (shows an empty list)
    }
}