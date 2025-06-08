// script.js
const fileInput = document.getElementById('fileInput');
const contactListDiv = document.getElementById('contactList');
const contactListNewDiv = document.getElementById('contactListNew');
const contactListSentDiv = document.getElementById('contactListSent');
const contactListAnsweredDiv = document.getElementById('contactListAnswered');
const navButton = document.querySelector('.nav-tabs');
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
// Get loading spinners
const loadingAll = document.getElementById('loadingAll');
const loadingNew = document.getElementById('loadingNew');
const loadingSent = document.getElementById('loadingSent');
const loadingAnswered = document.getElementById('loadingAnswered');

const MESSAGE_STORAGE_KEY = 'whatsapp_sender_message';
const NAME_COLUMN_STORAGE_KEY = 'whatsapp_sender_name_column';
const PHONE_COLUMN_STORAGE_KEY = 'whatsapp_sender_phone_column';

let currentTab = 'all';
let latitude;
let longitude;
let contacts = [];
let selectedContacts = new Map();
let csvHeaders = [];  // Store CSV headers
let fileType = null; // Store the file type (csv or vcf)
let csvContent = null; // Store the CSV file content

// Load settings from localStorage
const loadSettings = () => {
    const countryCode = localStorage.getItem('countryCode') || '';
    const ddd = localStorage.getItem('ddd') || '';
    document.getElementById('countryCode').value = countryCode;
    document.getElementById('ddd').value = ddd;
};

// Save settings to localStorage
const saveSettings = () => {
    const countryCode = document.getElementById('countryCode').value;
    const ddd = document.getElementById('ddd').value;
    localStorage.setItem('countryCode', countryCode);
    localStorage.setItem('ddd', ddd);
    alert('Configurações salvas com sucesso!');
};

// Event listener for save settings button
document.getElementById('saveSettings').addEventListener('click', saveSettings);

// Load settings on page load
loadSettings();
// Update synchronization loading spinner
updateSynchronizationLoadingSpinner();

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


navButton.addEventListener('click', function (event) {
    const targetTabPaneId = event.target.id.split('-')[0]; 
    // Show loading spinner for the active tab
    showLoadingSpinner(targetTabPaneId);

    isCheckedAllContacts(false);
    renderContactLists(contacts, targetTabPaneId); //Use the master list of contacts.
});

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);
        });
    } else {
        alert("Aceite Geocalização para continuar.");
        location.href.reload();
        return;
    }

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
        newContact.status = "new";  // Set initial status
        newContact.timestamp = new Date().toISOString();  // Initialize timestamp
        contacts.push(newContact);
    });

    await updateContactsOnServer(contacts);  // Save to server
    renderContactLists(contacts,currentTab);
}

// Function to generate contact key
function generateContactKey(contact) {
    return `${contact.fullName}-${contact.phoneNumber}`;
}

// Function to add key to contact
function addKeyToContact(contact) {
    contact.key = generateContactKey(contact);
    return contact;
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
            let contact = {
                fullName,
                phoneNumber,
                status: 'new', // Initialize status
                timestamp: new Date().toISOString() // Initialize timestamp
            };
            contact = addKeyToContact(contact);
            contacts.push(contact);
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
            let contact = {
                fullName,
                phoneNumber,
                status: 'new', // Initialize status
                timestamp: new Date().toISOString() // Initialize timestamp
            };
            contact = addKeyToContact(contact);
            contacts.push(contact);
        }
    }
    return contacts;
}

async function updateContactsOnServer(contacts) {
    const defaultCountryCode = '55';
    const defaultDdd = '11';
    const countryCode = localStorage.getItem('countryCode') || defaultCountryCode;
    const ddd = localStorage.getItem('ddd') || defaultDdd;
    try {
        const response = await fetch('/update-contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contacts: contacts,
                countryCode: countryCode,
                ddd: ddd
            })
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

function renderContactList(contactList, container) {
    container.innerHTML = '';
    const filteredContactList = contactList.filter(contact => contact.phoneNumber && contact.phoneNumber.length >= 9);

    filteredContactList.forEach((contact, index) => {
        const contactId = `contact-${index}`;

        const label = document.createElement('label');
        label.classList.add('contact-list-item');

        // Top Row Div
        const topRowDiv = document.createElement('div');
        topRowDiv.classList.add('top-row');

        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input');
        checkbox.type = 'checkbox';
        checkbox.id = contactId;
        topRowDiv.appendChild(checkbox);

        const contactName = document.createElement('span');
        contactName.classList.add('contact-name');
        contactName.textContent = contact.fullName;
        topRowDiv.appendChild(contactName);

        const whatsappLink = document.createElement('a');
        whatsappLink.classList.add('contact-number');
        whatsappLink.href = `http://wa.me/${contact.phoneNumber}`;
        whatsappLink.textContent = contact.phoneNumber;
        whatsappLink.target = '_blank';
        whatsappLink.rel = 'noopener noreferrer';
        topRowDiv.appendChild(whatsappLink);

        const statusIcon = document.createElement('i');
        statusIcon.classList.add('mdi');
        switch (contact.status) {
            case 'new':
                statusIcon.classList.add('mdi-new-box');
                break;
            case 'sent':
                statusIcon.classList.add('mdi-send');
                break;
            case 'answered':
                statusIcon.classList.add('mdi-check-circle');
                break;
            default:
                statusIcon.classList.add('mdi-help-circle');
        }
        topRowDiv.appendChild(statusIcon);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn', 'btn-sm', 'deleteContactBtn');
        deleteButton.dataset.key = contact.key;
        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('mdi', 'mdi-delete');
        deleteButton.appendChild(deleteIcon);
        deleteButton.addEventListener('click', function () {
            const keyToDelete = this.dataset.key;
            deleteContact(keyToDelete);
        });
        topRowDiv.appendChild(deleteButton);

        // Bottom Row Div
        const bottomRowDiv = document.createElement('div');
        bottomRowDiv.classList.add('bottom-row');

        let lastMessageContent = contact.lastMessage;

        const lastMessageDiv = document.createElement('div');
        lastMessageDiv.classList.add('last-message');

        const lastMessageText = document.createElement('span');
        lastMessageText.textContent = lastMessageContent;
        lastMessageDiv.appendChild(lastMessageText);

        bottomRowDiv.appendChild(lastMessageDiv);

        // Format Timestamp
        const timestamp = new Date(contact.timestamp);
        const today = new Date();

        const isToday = (
            timestamp.getFullYear() === today.getFullYear() &&
            timestamp.getMonth() === today.getMonth() &&
            timestamp.getDate() === today.getDate()
        );

        let formattedTimestamp = '';
        if (isToday) {
            formattedTimestamp = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
        } else {
            const day = timestamp.getDate().toString().padStart(2, '0');
            const month = (timestamp.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
            const year = timestamp.getFullYear();
            formattedTimestamp = `${day}/${month}/${year}`;
        }

        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('timestamp');
        timestampSpan.textContent = formattedTimestamp;
        bottomRowDiv.appendChild(timestampSpan);

        label.appendChild(topRowDiv);
        label.appendChild(bottomRowDiv);

        container.appendChild(label);

        const labelText = label.textContent.trim();
        const isChecked = selectedContacts.has(labelText) ? selectedContacts.get(labelText) : false;
        checkbox.checked = isChecked;
        contact.labelText = labelText;

        checkbox.addEventListener('change', (event) => {
            selectedContacts.set(labelText, event.target.checked);
            updateSendButtonState();
        });
    });

    updateSendButtonState();
}

// Helper function to get the correct container for a given tab
function getContactListContainer(tabId) {
    switch (tabId) {
        case 'all':
            return contactListDiv;
        case 'new':
            return contactListNewDiv;
        case 'sent':
            return contactListSentDiv;
        case 'answered':
            return contactListAnsweredDiv;
        default:
            console.warn('Unknown tab ID:', tabId);
            return contactListDiv; // Default to 'all'
    }
}

// Helper function to get the correct loading element for a given tab
function getLoadingElement(tabId) {
    switch (tabId) {
        case 'all':
            return loadingAll;
        case 'new':
            return loadingNew;
        case 'sent':
            return loadingSent;
        case 'answered':
            return loadingAnswered;
        default:
            console.warn('Unknown tab ID:', tabId);
            return loadingAll; // Default to 'all'
    }
}

function renderContactLists(contactList, tabId = 'all') {
    currentTab = tabId;
    const searchTerm = searchInput.value.toLowerCase();
    const filteredContacts = contactList.filter(contact =>
        contact.fullName.toLowerCase().includes(searchTerm) ||
        contact.phoneNumber.toLowerCase().includes(searchTerm)
    );
    let contactsToRender;
    switch (tabId) {
        case 'new':
            contactsToRender = filteredContacts.filter(contact => contact.status === 'new');
            break;
        case 'sent':
            contactsToRender = filteredContacts.filter(contact => contact.status === 'sent');
            break;
        case 'answered':
            contactsToRender = filteredContacts.filter(contact => contact.status === 'answered');
            break;
        case 'all':
        default:
            contactsToRender = filteredContacts;
            break;
    }
    // Separate answered/sent contacts and new contacts
    const answeredSentContacts = contactsToRender.filter(contact => contact.status === 'answered' || contact.status === 'sent');
    const newContacts = contactsToRender.filter(contact => contact.status === 'new');
    // Sort answered/sent contacts by timestamp (most recent first)
    answeredSentContacts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    // Sort new contacts alphabetically
    newContacts.sort((a, b) => a.fullName.localeCompare(b.fullName));
    // Concatenate the sorted lists: answered/sent followed by new
    contactsToRender = answeredSentContacts.concat(newContacts);
    renderContactList(contactsToRender, getContactListContainer(tabId));
    hideLoadingSpinner(tabId);
}

async function deleteContact(keyToDelete) {
    contacts = contacts.filter(contact => contact.key !== keyToDelete); // Filter by key
    await updateContactsOnServer(contacts);  // Save to server
    renderContactLists(contacts,currentTab); // Renderiza a lista atualizada
}

searchInput.addEventListener('input', () => {
    renderContactLists(contacts,currentTab); // Renderiza a lista filtrada
});


selectAllButton.addEventListener('click', () => {
    isCheckedAllContacts(true); // Marca todos os contatos
});

deselectAllButton.addEventListener('click', () => {
    isCheckedAllContacts(false); // Desmarca todos os contatos
});

function isCheckedAllContacts(b) {
    const searchTerm = searchInput.value.toLowerCase();
    const currentTab = this.currentTab || 'all'; // Use 'this' to access currentTab if available, otherwise default to 'all'
    if (b) {
        selectedContacts = new Map();
        contacts.filter(contact => {
            const matchesSearch = contact.fullName.toLowerCase().includes(searchTerm) ||
                contact.phoneNumber.toLowerCase().includes(searchTerm);

            let matchesTab = true; // Default to true for 'all' tab
            if (currentTab === 'new') {
                matchesTab = contact.status === 'new';
            } else if (currentTab === 'sent') {
                matchesTab = contact.status === 'sent';
            } else if (currentTab === 'answered') {
                matchesTab = contact.status === 'answered';
            }

            return matchesSearch && matchesTab;
        }).forEach((contact) => {
            selectedContacts.set(contact.labelText, b);
        });
    } else {
        selectedContacts = new Map();
    }

    renderContactLists(contacts, currentTab); // Re-render the list with updated selections
}
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
            messageText.innerHTML = ''; // Clear existing results

            data.results.forEach(result => {
                const contactName = result.contact;
                const status = result.status;
                const message = result.message;

                // Create the container for the contact bubble
                const bubbleContainer = document.createElement('div');
                bubbleContainer.classList.add('contact-bubble-container');

                // Add 'outgoing' class if the message was successfully sent
                if (status === 'success') {
                    bubbleContainer.classList.add('outgoing');
                }

                // Create the contact bubble
                const contactBubble = document.createElement('div');
                contactBubble.classList.add('contact-bubble');
                contactBubble.classList.add(status === 'success' ? 'outgoing' : 'incoming');

                // Create the contact name element
                const contactNameElement = document.createElement('div');
                contactNameElement.classList.add('contact-name');
                contactNameElement.textContent = contactName;

                // Create the message element
                const messageElement = document.createElement('div');
                messageElement.classList.add('contact-message');
                messageElement.textContent = message;

                // If in test mode, prepend "[TESTE]" to the message
                if (testMode) {
                    messageElement.textContent = "[TESTE] " + message;
                }

                // Append the contact name and message to the contact bubble
                contactBubble.appendChild(contactNameElement);
                contactBubble.appendChild(messageElement);

                // Append the contact bubble to the bubble container
                bubbleContainer.appendChild(contactBubble);

                // Append the bubble container to the message text area
                messageText.appendChild(bubbleContainer);
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

// Function to add contact
function addContact(name, phone) {
    const newContact = {
        fullName: name,
        phoneNumber: phone,
        status: 'new',  // Initialize status
        timestamp: new Date().toISOString() // Initialize timestamp
    };

    return addKeyToContact(newContact);
}

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
            const newContact = addContact(name, phone);

            contacts.push(newContact);
            await updateContactsOnServer(contacts);  // Save to server
            renderContactLists(contacts,currentTab);
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

// Add Socket.IO client-side library (you can use a CDN or install locally)
const socket = io();

// Function to save scroll positions
function saveScrollPositions() {
    const scrollPositions = {
        contactList: document.getElementById('contactList').scrollTop,
        contactListNew: document.getElementById('contactListNew').scrollTop,
        contactListSent: document.getElementById('contactListSent').scrollTop,
        contactListAnswered: document.getElementById('contactListAnswered').scrollTop
    };
    return scrollPositions;
}

// Function to restore scroll positions
function restoreScrollPositions(scrollPositions) {
    if (scrollPositions) {
        document.getElementById('contactList').scrollTop = scrollPositions.contactList || 0;
        document.getElementById('contactListNew').scrollTop = scrollPositions.contactListNew || 0;
        document.getElementById('contactListSent').scrollTop = scrollPositions.contactListSent || 0;
        document.getElementById('contactListAnswered').scrollTop = scrollPositions.contactListAnswered || 0;
    }
}

socket.on('contacts_updated', (updatedContacts) => {
    // Save scroll positions *before* updating the DOM
    const scrollPositions = saveScrollPositions();

    console.log('Received updated contacts from server:', updatedContacts);
    contacts = updatedContacts; // Update the local contacts array
    contacts = contacts.map(contact => addKeyToContact(contact));
    const searchTerm = searchInput.value.toLowerCase();
    const filteredContacts = contacts.filter(contact =>
        contact.fullName.toLowerCase().includes(searchTerm) ||
        contact.phoneNumber.toLowerCase().includes(searchTerm)
    );
    renderContactLists(filteredContacts, currentTab); // Re-render the contact lists

    // Restore scroll positions *after* updating the DOM
    restoreScrollPositions(scrollPositions);
});


socket.on('synchronization_finished', () => {
    finishLoading();
});

async function checkSynchronizationStatus() {
  try {
    const response = await fetch('/synchronization-status'); // Replace with your actual URL if different
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.synchronizationFinished;
  } catch (error) {
    console.error('Error checking synchronization status:', error);
    return false; // Return false in case of an error to avoid unexpected behavior
  }
}

function updateSynchronizationLoadingSpinner() {
   checkSynchronizationStatus().then(status => { 
    synchronizationFinished = status;
    if (synchronizationFinished) {
        finishLoading();
    }
  });
}

function finishLoading () {
    document.querySelector(".synchronization-loading-spinner").remove();
    document.querySelector(".synchronization-label").textContent = "Todos";
    document.querySelector("#new-tab").style.display = "block";
    document.querySelector("#sent-tab").style.display = "block";
    document.querySelector("#answered-tab").style.display = "block";
}

// Function to show loading spinner
function showLoadingSpinner(tabId) {
    const loadingElement = getLoadingElement(tabId);
    const contactListContainer = getContactListContainer(tabId);
    if (loadingElement && contactListContainer) {
        loadingElement.style.display = 'block';
        contactListContainer.innerHTML = '';
    }
}

// Function to hide loading spinner
function hideLoadingSpinner(tabId) {
    const loadingElement = getLoadingElement(tabId);
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Load contacts from the server on page load
async function loadContactsFromServer() {
    // Get the currently active tab
    const activeTab = document.querySelector('.nav-link.active');
    let activeTabId = 'all'; // Default value
    if (activeTab) {
        activeTabId = activeTab.getAttribute('data-bs-target').substring(1); // Remove the '#'
    }

    // Show loading spinner for the active tab
    showLoadingSpinner(activeTabId);

    try {
        const response = await fetch('/update-contacts'); // Adjust the URL if needed
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        contacts = await response.json();
        contacts = contacts.map(contact => addKeyToContact(contact));
        // Initialize selectedContacts Map
        contacts.forEach(contact => {
            selectedContacts.set(contact.labelText, false);  // Initially, no contact is selected
        });
        renderContactLists(contacts, activeTabId);
    } catch (error) {
        console.error('Failed to load contacts from server:', error);
        alert('Failed to load contacts from server. Check the console for details.');
        contacts = [];  // Ensure contacts is an empty array if loading fails
    } finally {
        renderContactLists(contacts, activeTabId);  // Render even if loading fails (shows an empty list)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadContactsFromServer(); // Call the function from script.js
});