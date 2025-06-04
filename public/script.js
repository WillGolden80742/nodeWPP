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


const CONTACTS_STORAGE_KEY = 'whatsapp_sender_contacts';
const MESSAGE_STORAGE_KEY = 'whatsapp_sender_message';

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

let contacts = [];
let selectedContacts = new Map();
let csvHeaders = [];  // Store CSV headers

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
    return localStorage.getItem(MESSAGE_STORAGE_KEY) || "";
}

// Carrega os contatos do localStorage ao carregar a página
contacts = loadContactsFromLocalStorage();
renderContactList(contacts);

// Load the message from localStorage and set the textarea value
messageTextarea.value = loadMessageFromLocalStorage();

// Save message when it changes
messageTextarea.addEventListener('input', () => {
    saveMessageToLocalStorage(messageTextarea.value);
});



fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    let fileType = null;

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
        const fileContent = e.target.result;
        let newContacts = [];

        if (fileType === 'vcf') {
            newContacts = parseVcfContent(fileContent);
        } else if (fileType === 'csv') {
            // Get headers and populate select elements
            csvHeaders = await getCsvHeaders(fileContent);
            populateColumnSelects(csvHeaders);
            newContacts = parseCsvContent(fileContent, nameColumnSelect.value, phoneColumnSelect.value);

        }

        // Adiciona os novos contatos, evitando duplicatas
        newContacts.forEach(newContact => {
            const isDuplicate = contacts.some(existingContact => existingContact.phoneNumber === newContact.phoneNumber);
            if (!isDuplicate) {
                contacts.push(newContact);
            }
        });

        saveContactsToLocalStorage(contacts);
        renderContactList(contacts);
    };

    if (fileType === 'csv') {
        reader.readAsText(file, 'ISO-8859-1');  // For CSV, specify encoding.  This might need to change.
    } else {
        reader.readAsText(file);
    }
});


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
// Function to get greetings based on language and time of day
function getGreetings(languageCode) {
    const now = new Date();
    const hour = now.getHours();

    const greetings = {
        'en': { // English
            morning: 'Good morning',
            afternoon: 'Good afternoon',
            evening: 'Good evening'
        },
        'es': { // Spanish
            morning: 'Buenos días',
            afternoon: 'Buenas tardes',
            evening: 'Buenas noches'
        },
        'fr': { // French
            morning: 'Bonjour',
            afternoon: 'Bon après-midi',
            evening: 'Bonsoir'
        },
        'de': { // German
            morning: 'Guten Morgen',
            afternoon: 'Guten Tag',
            evening: 'Guten Abend'
        },
        'ja': { // Japanese
            morning: 'おはようございます', // Ohayō gozaimasu
            afternoon: 'こんにちは', // Konnichiwa
            evening: 'こんばんは' // Konbanwa
        },
        'zh': { // Chinese (Simplified)
            morning: '早上好', // Zǎoshang hǎo
            afternoon: '下午好', // Xiàwǔ hǎo
            evening: '晚上好' // Wǎnshàng hǎo
        },
        'pt': { // Portuguese
            morning: 'Bom dia',
            afternoon: 'Boa tarde',
            evening: 'Boa noite'
        },
        'ru': { // Russian
            morning: 'Доброе утро', // Dobroye utro
            afternoon: 'Добрый день', // Dobryy den'
            evening: 'Добрый вечер' // Dobryy vecher
        },
        'ar': { // Arabic
            morning: 'صباح الخير', // Sabah al-khair
            afternoon: 'مساء الخير', // Masa' al-khair
            evening: 'مساء الخير' // Masa' al-khair (same as afternoon)
        },
        'it': { // Italian
            morning: 'Buongiorno',
            afternoon: 'Buon pomeriggio',
            evening: 'Buonasera'
        },
        'ko': { // Korean
            morning: '좋은 아침', // Joeun achim
            afternoon: '좋은 오후', // Joeun ohu
            evening: '좋은 저녁' // Joeun jeonyeok
        },
        'hi': { // Hindi
            morning: 'शुभ प्रभात', // Shubh Prabhat
            afternoon: 'शुभ दोपहर', // Shubh Dopahar
            evening: 'शुभ संध्या' // Shubh Sandhya
        },
        'tr': { // Turkish
            morning: 'Günaydın',
            afternoon: 'İyi öğleden sonra',
            evening: 'İyi akşamlar'
        },
        'nl': { // Dutch
            morning: 'Goedemorgen',
            afternoon: 'Goedemiddag',
            evening: 'Goedenavond'
        },
        'sv': { // Swedish
            morning: 'God morgon',
            afternoon: 'God eftermiddag',
            evening: 'God kväll'
        },
        'pl': { // Polish
            morning: 'Dzień dobry',
            afternoon: 'Dzień dobry (afternoon)',
            evening: 'Dobry wieczór'
        },
        'da': { // Danish
            morning: 'God morgen',
            afternoon: 'God eftermiddag',
            evening: 'God aften'
        },
        'no': { // Norwegian
            morning: 'God morgen',
            afternoon: 'God ettermiddag',
            evening: 'God kveld'
        },
        'fi': { // Finnish
            morning: 'Hyvää huomenta',
            afternoon: 'Hyvää iltapäivää',
            evening: 'Hyvää iltaa'
        },
        'id': { // Indonesian
            morning: 'Selamat pagi',
            afternoon: 'Selamat siang',
            evening: 'Selamat malam'
        }
    };

    const language = languageCode || 'en'; // Default to English if no language code provided. You'll need a way to detect this from contact or user settings

    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 18) {
        timeOfDay = 'afternoon';
    } else if (hour >= 18) {
        timeOfDay = 'evening';
    }

    if (greetings[language] && greetings[language][timeOfDay]) {
        return greetings[language][timeOfDay];
    } else {
        return greetings['en']; // Fallback to English if translation is missing
    }
}

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const contactsToSend = [];
    contacts.forEach((contact) => {
        if (selectedContacts.get(contact.labelText)) {
            contactsToSend.push(contact);
        }
    });

    const testModeCheckbox = document.getElementById('testMode');
    const testMode = testModeCheckbox.checked;

    let messageContent = document.getElementById('message').value;

    // **Crucially, you need to determine the languageCode for each contact.**  This is a placeholder.
    // In a real app, you might store the preferred language for each contact in your `contacts` array,
    // get it from browser settings, or use a language detection library.
    // Example:  contact.languageCode.  If you don't have this info, remove the languageCode parameter.
    const languageCode = 'pt';  // Replace with dynamic language detection.  IMPORTANT!

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
        testModeCheckbox.checked = true;
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