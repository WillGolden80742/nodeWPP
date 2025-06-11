// C:\Users\willi\OneDrive\Desktop\nodeWPP\public\script.js

// Constants
const MESSAGE_STORAGE_KEY_PREFIX = 'whatsapp_sender_message';
const NAME_COLUMN_STORAGE_KEY = 'whatsapp_sender_name_column';
const PHONE_COLUMN_STORAGE_KEY = 'whatsapp_sender_phone_column';
const DEFAULT_TIME_STAMP = "2000-01-01T00:00:00.000Z";

// DOM Elements
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
const scriptSelect = document.getElementById('scriptSelect');
const deleteScriptBtn = document.getElementById('deleteScriptBtn');
const newScriptInputContainer = document.getElementById('newScriptInputContainer');
const newScriptNameInput = document.getElementById('newScriptName');
const saveNewScriptBtn = document.getElementById('saveNewScriptBtn');
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
const deleteSelectionContacts = document.getElementById('delete-select-contacts');

// Get loading spinners
const loadingAll = document.getElementById('loadingAll');
const loadingNew = document.getElementById('loadingNew');
const loadingSent = document.getElementById('loadingSent');
const loadingAnswered = document.getElementById('loadingAnswered');

// State Variables
let currentTab = 'all';
let contacts = [];
let selectedContacts = new Map();
let csvHeaders = [];
let fileType = null;
let csvContent = null;
let currentScriptKey = '';

// ========================= Utility Functions =========================

/**
 * Generates a timestamp hash for script keys.
 * @returns {string} A unique hash based on the current timestamp.
 */
function generateTimestampHash() {
    return btoa(Date.now().toString()).substring(0, 12);
}

/**
 * Generates a unique contact key based on the contact's full name and phone number.
 * @param {object} contact - The contact object.
 * @returns {string} A unique key for the contact.
 */
function generateContactKey(contact) {
    return `${contact.fullName}-${contact.phoneNumber}`;
}

/**
 * Adds a unique key to the contact object.
 * @param {object} contact - The contact object.
 * @returns {object} The contact object with the added key.
 */
function addKeyToContact(contact) {
    contact.key = generateContactKey(contact);
    return contact;
}

/**
 * Displays an alert message.
 * @param {string} message - The message to display.
 */
function showAlert(message) {
    alert(message);
}

/**
 * Displays a confirmation dialog.
 * @param {string} message - The message to display in the confirmation dialog.
 * @returns {boolean} True if the user confirms, false otherwise.
 */
function showConfirmation(message) {
    return confirm(message);
}

// ========================= Local Storage Management =========================

/**
 * Saves settings (country code and DDD) to localStorage.
 */
function saveSettingsToLocalStorage() {
    const countryCode = document.getElementById('countryCode').value;
    const ddd = document.getElementById('ddd').value;
    localStorage.setItem('countryCode', countryCode);
    localStorage.setItem('ddd', ddd);
    showAlert('Configurações salvas com sucesso!');
}

/**
 * Loads settings (country code and DDD) from localStorage.
 */
function loadSettingsFromLocalStorage() {
    const countryCode = localStorage.getItem('countryCode') || '';
    const ddd = localStorage.getItem('ddd') || '';
    document.getElementById('countryCode').value = countryCode;
    document.getElementById('ddd').value = ddd;
}

/**
 * Saves selected column indexes (name and phone) to localStorage.
 * @param {number} nameColumnIndex - The index of the name column.
 * @param {number} phoneColumnIndex - The index of the phone column.
 */
function saveColumnSelectionsToLocalStorage(nameColumnIndex, phoneColumnIndex) {
    localStorage.setItem(NAME_COLUMN_STORAGE_KEY, nameColumnIndex);
    localStorage.setItem(PHONE_COLUMN_STORAGE_KEY, phoneColumnIndex);
}

/**
 * Loads selected column indexes (name and phone) from localStorage.
 * @returns {object} An object containing the nameColumnIndex and phoneColumnIndex, or null if not found.
 */
function loadColumnSelectionsFromLocalStorage() {
    const storedNameColumnIndex = localStorage.getItem(NAME_COLUMN_STORAGE_KEY);
    const storedPhoneColumnIndex = localStorage.getItem(PHONE_COLUMN_STORAGE_KEY);

    return {
        nameColumnIndex: storedNameColumnIndex !== null ? storedNameColumnIndex : null,
        phoneColumnIndex: storedPhoneColumnIndex !== null ? storedPhoneColumnIndex : null
    };
}

/**
 * Loads a message for a given script key from localStorage.
 * @param {string} scriptKey - The key of the script.
 * @returns {string} The message associated with the script key, or an empty string if not found.
 */
function loadMessageForScript(scriptKey) {
    return localStorage.getItem(scriptKey) || "";
}

/**
 * Saves a message for a given script key to localStorage.
 * @param {string} scriptKey - The key of the script.
 * @param {string} message - The message to save.
 */
function saveMessageForScript(scriptKey, message) {
    localStorage.setItem(scriptKey, message);
}

// ========================= Modal Management =========================

/**
 * Closes the message modal.
 */
function closeMessageModal() {
    messageModal.style.display = "none";
}

/**
 * Handles clicks outside the message modal to close it.
 * @param {Event} event - The click event.
 */
function handleOutsideClick(event) {
    if (event.target === messageModal) {
        closeMessageModal();
    }
}

// ========================= Script Management =========================

/**
 * Loads scripts from localStorage and populates the script select element.
 */
function loadScripts() {
    // Clear existing options
    scriptSelect.innerHTML = '';

    // Add "New Script" option
    const newScriptOption = document.createElement('option');
    newScriptOption.value = 'newScript';
    newScriptOption.textContent = 'Novo Script';
    scriptSelect.appendChild(newScriptOption);

    // Add existing scripts from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(MESSAGE_STORAGE_KEY_PREFIX)) {
            const scriptName = key.substring(MESSAGE_STORAGE_KEY_PREFIX.length + 1); // Extract script name
            const option = document.createElement('option');
            option.value = key;
            option.textContent = scriptName;
            scriptSelect.appendChild(option);
        }
    }
}

/**
 * Handles script selection changes in the script select element.
 */
function handleScriptSelectionChange() {
    const selectedValue = scriptSelect.value;

    if (selectedValue === 'newScript') {
        currentScriptKey = '';
        newScriptInputContainer.style.display = 'block';
        deleteScriptBtn.disabled = true;
        messageTextarea.value = "";
    } else {
        currentScriptKey = selectedValue;
        newScriptInputContainer.style.display = 'none';
        deleteScriptBtn.disabled = false;
        messageTextarea.value = loadMessageForScript(selectedValue);
    }
}

/**
 * Saves a new script with the given name and message.
 */
function saveNewScript() {
    const scriptName = newScriptNameInput.value.trim();
    if (scriptName) {
        const timestamp = generateTimestampHash();
        const newScriptKey = `${MESSAGE_STORAGE_KEY_PREFIX}-${scriptName}-${timestamp}`;
        saveMessageForScript(newScriptKey, messageTextarea.value);
        loadScripts();
        scriptSelect.value = newScriptKey;
        scriptSelect.dispatchEvent(new Event('change'));
        newScriptNameInput.value = '';
        newScriptInputContainer.style.display = 'none';
        showAlert(`Script "${scriptName}" criado com sucesso!`);
    } else {
        showAlert('Por favor, insira um nome para o script.');
    }
}

/**
 * Deletes the currently selected script from localStorage.
 */
function deleteScript() {
    if (showConfirmation('Tem certeza que deseja excluir este script?')) {
        localStorage.removeItem(currentScriptKey);
        loadScripts();
        scriptSelect.value = 'newScript';
        scriptSelect.dispatchEvent(new Event('change'));
        showAlert("Script deletado com sucesso!");
    }
}

// ========================= File Processing =========================

/**
 * Handles file input changes, processing CSV or VCF files.
 * @param {Event} event - The file input change event.
 */
async function handleFileInputChange(event) {
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
        showAlert('Tipo de arquivo não suportado. Por favor, selecione um arquivo .csv ou .vcf.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        csvContent = e.target.result;

        if (fileType === 'csv') {
            csvHeaders = await getCsvHeaders(csvContent);
            populateColumnSelects(csvHeaders);
        } else {
            await loadContacts();
        }
    };

    if (fileType === 'csv') {
        reader.readAsText(file, 'ISO-8859-1');
    } else {
        reader.readAsText(file);
    }
}

/**
 * Loads contacts from the selected file (CSV or VCF).
 */
async function loadContacts() {
    let newContacts = [];

    if (fileType === 'vcf') {
        newContacts = parseVcfContent(csvContent);
    } else if (fileType === 'csv') {
        newContacts = parseCsvContent(csvContent, nameColumnSelect.value, phoneColumnSelect.value);
    }

    newContacts.forEach(newContact => {
        newContact.status = "new";
        newContact.timestamp = DEFAULT_TIME_STAMP;
        newContact.isDeleted = false;
        contacts.push(newContact);
    });

    await updateContactsOnServer(contacts);
    renderContactLists(contacts, currentTab);
}

/**
 * Parses VCF content and extracts contact information.
 * @param {string} vcfContent - The VCF file content.
 * @returns {array} An array of contact objects.
 */
function parseVcfContent(vcfContent) {
    const contacts = [];
    const vcards = vcfContent.split(/BEGIN:VCARD\r?\n/).filter(Boolean);

    for (const vcard of vcards) {
        let fullName = 'Contact';
        let phoneNumber = null;

        const lines = vcard.split(/\r?\n/);

        for (const line of lines) {
            if (line.startsWith('FN:')) {
                fullName = line.substring(3).trim();
            } else if (line.startsWith('N:') && fullName === 'Contact') {
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
                status: 'new',
                timestamp: DEFAULT_TIME_STAMP
            };
            contact = addKeyToContact(contact);
            contacts.push(contact);
        }
    }
    return contacts;
}

/**
 * Parses CSV content and extracts contact information based on the selected column indexes.
 * @param {string} csvContent - The CSV file content.
 * @param {number} nameColumnIndex - The index of the name column.
 * @param {number} phoneColumnIndex - The index of the phone column.
 * @returns {array} An array of contact objects.
 */
function parseCsvContent(csvContent, nameColumnIndex, phoneColumnIndex) {
    const contacts = [];
    const lines = csvContent.split(/\r?\n/).filter(Boolean);

    if (lines.length <= 1) return [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        const fullName = values[nameColumnIndex] ? values[nameColumnIndex].trim() : 'Contact';
        let phoneNumber = values[phoneColumnIndex] ? values[phoneColumnIndex].trim() : null;

        if (phoneNumber) {
            phoneNumber = phoneNumber.replace(/\D/g, '');

            if (!/^\d+$/.test(phoneNumber)) {
                console.warn(`Número de telefone inválido encontrado: ${phoneNumber}. Ignorando.`);
                continue;
            }
            let contact = {
                fullName,
                phoneNumber,
                status: 'new',
                timestamp: DEFAULT_TIME_STAMP
            };
            contact = addKeyToContact(contact);
            contacts.push(contact);
        }
    }
    return contacts;
}

/**
 * Retrieves CSV headers from the CSV content.
 * @param {string} csvContent - The CSV file content.
 * @returns {array} An array of CSV headers.
 */
async function getCsvHeaders(csvContent) {
    const lines = csvContent.split(/\r?\n/).filter(Boolean);
    if (lines.length > 0) {
        return lines[0].split(';'); // Using semicolon as delimiter
    }
    return [];
}

/**
 * Populates the name and phone column select elements with the given headers.
 * @param {array} headers - An array of column headers.
 */
function populateColumnSelects(headers) {
    nameColumnSelect.innerHTML = '';
    phoneColumnSelect.innerHTML = '';

    headers.forEach((header, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = header;
        nameColumnSelect.appendChild(option.cloneNode(true));
        phoneColumnSelect.appendChild(option);
    });

    const storedColumnSelections = loadColumnSelectionsFromLocalStorage();
    if (storedColumnSelections.nameColumnIndex !== null) {
        nameColumnSelect.value = storedColumnSelections.nameColumnIndex;
    }
    if (storedColumnSelections.phoneColumnIndex !== null) {
        phoneColumnSelect.value = storedColumnSelections.phoneColumnIndex;
    }
}

// ========================= Server Communication =========================

/**
 * Updates contacts on the server.
 * @param {array} contacts - An array of contact objects to update on the server.
 */
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
            showAlert('Failed to update contacts on the server.');
        } else {
            console.log('Contacts updated on the server.');
        }
    } catch (error) {
        console.error('Error updating contacts on the server:', error);
        showAlert('Error updating contacts on the server.');
    }
}

/**
 * Checks the synchronization status on the server.
 * @returns {Promise<boolean>} A promise that resolves to true if synchronization is finished, false otherwise.
 */
async function checkSynchronizationStatus() {
    try {
        const response = await fetch('/synchronization-status');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.synchronizationFinished;
    } catch (error) {
        console.error('Error checking synchronization status:', error);
        return false;
    }
}

/**
 * Loads contacts from the server.
 * @returns {Promise<Array>} A promise that resolves to an array of contacts fetched from the server.
 */
async function loadContactsFromServer() {
    const activeTab = document.querySelector('.nav-link.active');
    let activeTabId = 'all';
    if (activeTab) {
        activeTabId = activeTab.getAttribute('data-bs-target').substring(1);
    }

    showLoadingSpinner(activeTabId);

    try {
        const response = await fetch('/update-contacts');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        contacts = await response.json();
        contacts = contacts.map(contact => addKeyToContact(contact));

        contacts.forEach(contact => {
            selectedContacts.set(contact.key, false);
        });

        return contacts;
    } catch (error) {
        console.error('Failed to load contacts from server:', error);
        showAlert('Failed to load contacts from server. Check the console for details.');
        return [];
    } finally {
       renderContactLists(contacts, activeTabId);
    }
}

// ========================= Contact List Rendering =========================

/**
 * Creates a contact list item element.
 * @param {object} contact - The contact object to render.
 * @param {number} index - The index of the contact in the list.
 * @returns {HTMLLabelElement} The contact list item element.
 */
function createContactListItem(contact, index) {
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

    // Contact Name Span/Input (Initially Span)
    let contactNameElement = document.createElement('span');
    contactNameElement.classList.add('contact-name');
    contactNameElement.textContent = contact.fullName;
    topRowDiv.appendChild(contactNameElement);


    // Function to switch to input mode
    function switchToInputMode() {
        // Create input element
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.classList.add('form-control', 'contact-name-input');
        inputElement.value = contact.fullName;  // Set initial value

        // Create save button
        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.classList.add('btn', 'btn-sm', 'btn-success');
        saveButton.innerHTML = '<i class="mdi mdi-check"></i>';

        // Create cancel button
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.classList.add('btn', 'btn-sm', 'btn-secondary');
        cancelButton.innerHTML = '<i class="mdi mdi-close"></i>';

        // Replace the span with the input
        contactNameElement.replaceWith(inputElement);

        //Add Buttons
        topRowDiv.appendChild(saveButton);
        topRowDiv.appendChild(cancelButton);

        // Focus the input
        inputElement.focus();

        // Save action
        saveButton.addEventListener('click', async () => {
            const newName = inputElement.value.trim();
            if (newName && newName !== contact.fullName) {
                contact.fullName = newName;
                contact.key = generateContactKey(contact); // Update key
                await updateContactsOnServer(contacts); // Update server
                renderContactLists(contacts, currentTab); // Re-render
            } else {
                switchToSpanMode(); // Revert if no change
            }
        });

        // Cancel action
        cancelButton.addEventListener('click', () => {
            switchToSpanMode(); // Revert to span
        });

        //Handle Enter to update
        inputElement.addEventListener("keyup", function(event) {
            if (event.key === "Enter") {
                saveButton.click();
            }
        });
    }

    // Function to switch back to span mode
    function switchToSpanMode() {
        const newContactNameElement = document.createElement('span');
        newContactNameElement.classList.add('contact-name');
        newContactNameElement.textContent = contact.fullName;
        //Replace with Span
        let el = topRowDiv.querySelector('.contact-name-input');
        el.replaceWith(newContactNameElement);

        //Remove buttons
        let sb = topRowDiv.querySelector('.btn-success');
        if (sb){
            sb.remove();
        }
        let cb = topRowDiv.querySelector('.btn-secondary');
        if (cb){
            cb.remove();
        }

        contactNameElement = newContactNameElement; // Update the outer variable

        contactNameElement.addEventListener('mouseover', () => {
            contactNameElement.style.cursor = 'pointer';
        });
        contactNameElement.addEventListener('mouseout', () => {
            contactNameElement.style.cursor = 'default';
        });
        contactNameElement.addEventListener('click', switchToInputMode);
    }


    // Event listener to switch to input mode on hover
    contactNameElement.addEventListener('mouseover', () => {
        contactNameElement.style.cursor = 'pointer';
    });

    // Event listener to remove pointer on mouseout
    contactNameElement.addEventListener('mouseout', () => {
        contactNameElement.style.cursor = 'default';
    });

    //Add click to span
    contactNameElement.addEventListener('click', switchToInputMode);


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

    if (contact.timestamp !== DEFAULT_TIME_STAMP) {
        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('timestamp');
        timestampSpan.textContent = formattedTimestamp;
        bottomRowDiv.appendChild(timestampSpan);
    }

    label.appendChild(topRowDiv);
    label.appendChild(bottomRowDiv);

    const contactKey = generateContactKey(contact);
    const isChecked = selectedContacts.has(contactKey) ? selectedContacts.get(contactKey) : false;
    checkbox.checked = isChecked;
    contact.key = contactKey;

    checkbox.addEventListener('change', (event) => {
        selectedContacts.set(contactKey, event.target.checked);
        updateSendButtonState();
    });

    return label;
}

/**
 * Renders a list of contacts into the specified container.
 * @param {array} contactList - The array of contacts to render.
 * @param {HTMLElement} container - The container to render the contacts into.
 */
function renderContactList(contactList, container) {
    container.innerHTML = '';
    const filteredContactList = contactList.filter(contact => contact.phoneNumber && contact.phoneNumber.length >= 9);

    filteredContactList.forEach((contact, index) => {
        const contactListItem = createContactListItem(contact, index);
        container.appendChild(contactListItem);
    });

    updateSendButtonState();
}

/**
 * Gets the appropriate container element for the contact list based on the tab ID.
 * @param {string} tabId - The ID of the tab.
 * @returns {HTMLElement} The container element for the contact list.
 */
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
            return contactListDiv;
    }
}

/**
 * Gets the appropriate loading element based on the tab ID.
 * @param {string} tabId - The ID of the tab.
 * @returns {HTMLElement} The loading element.
 */
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
            return loadingAll;
    }
}

/**
 * Renders contact lists based on the specified tab and search term.
 * @param {array} contactList - The array of contacts to render.
 * @param {string} tabId - The ID of the active tab ('all', 'new', 'sent', 'answered').
 */
function renderContactLists(contactList, tabId = 'all') {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredContacts = contactList.filter(contact =>
        (contact.fullName.toLowerCase().includes(searchTerm) ||
        contact.phoneNumber.toLowerCase().includes(searchTerm)) &&
        !contact.isDeleted
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

    const answeredSentContacts = contactsToRender.filter(contact => contact.status === 'answered' || contact.status === 'sent');
    const newContacts = contactsToRender.filter(contact => contact.status === 'new');

    answeredSentContacts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    newContacts.sort((a, b) => a.fullName.localeCompare(b.fullName));

    contactsToRender = answeredSentContacts.concat(newContacts);
    renderContactList(contactsToRender, getContactListContainer(tabId));
    hideLoadingSpinner(tabId);
}

/**
 * Deletes a contact from the contact list.
 * @param {string} keyToDelete - The key of the contact to delete.
 */
async function deleteContact(keyToDelete) {
    const contactToUpdateIndex = contacts.findIndex(contact => contact.key === keyToDelete);

    if (contactToUpdateIndex !== -1) {
        contacts[contactToUpdateIndex] = {
            ...contacts[contactToUpdateIndex],
            isDeleted: true
        };

        await updateContactsOnServer(contacts);
        renderContactLists(contacts, currentTab);
    }
}

/**
 * Toggles the selection of all contacts based on the specified boolean value.
 * @param {boolean} shouldCheck - True to select all contacts, false to deselect all.
 */
function toggleAllContacts(shouldCheck) {
    const searchTerm = searchInput.value.toLowerCase();
    const activeTab = document.querySelector('.nav-link.active');
    const currentTab = activeTab ? activeTab.getAttribute('data-bs-target').substring(1) : 'all';
    
    selectedContacts = new Map();

    if (shouldCheck) {
        contacts.filter(contact => {
            const matchesSearch = contact.fullName.toLowerCase().includes(searchTerm) ||
                contact.phoneNumber.toLowerCase().includes(searchTerm);

            let matchesTab = true;
            if (currentTab === 'new') {
                matchesTab = contact.status === 'new';
            } else if (currentTab === 'sent') {
                matchesTab = contact.status === 'sent';
            } else if (currentTab === 'answered') {
                matchesTab = contact.status === 'answered';
            }

            return matchesSearch && matchesTab;
        }).forEach((contact) => {
            selectedContacts.set(contact.key, shouldCheck);
            document.querySelectorAll(".contact-list-item .form-check-input").forEach(checkbox => {
                checkbox.checked = shouldCheck;
            });
            sendMessageBtn.disabled = !shouldCheck;
        });
    } else {
        document.querySelectorAll(".contact-list-item .form-check-input").forEach(checkbox => {
            checkbox.checked = shouldCheck;
        });
        sendMessageBtn.disabled = !shouldCheck;
    }
}

// ========================= Greetings and Message Formatting =========================

/**
 * Gets a greeting based on the current time and specified language code.
 * @param {string} languageCode - The language code for the greeting.
 * @returns {string} A greeting appropriate for the current time and language.
 */
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

// ========================= UI Updates =========================

/**
 * Updates the state of the send button based on whether at least one contact is selected.
 */
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

/**
 * Shows the loading spinner for the specified tab.
 * @param {string} tabId - The ID of the tab.
 */
function showLoadingSpinner(tabId) {
    const loadingElement = getLoadingElement(tabId);
    const contactListContainer = getContactListContainer(tabId);
    if (loadingElement && contactListContainer) {
        loadingElement.style.display = 'block';
        contactListContainer.innerHTML = '';
    }
}

/**
 * Hides the loading spinner for the specified tab.
 * @param {string} tabId - The ID of the tab.
 */
function hideLoadingSpinner(tabId) {
    const loadingElement = getLoadingElement(tabId);
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Finishes the loading process by removing the synchronization loading spinner, updating the label, and displaying relevant elements.
 */
function finishLoading() {
    const spinner = document.querySelector(".synchronization-loading-spinner");
    const label = document.querySelector(".synchronization-label");
    const newTab = document.querySelector("#new-tab");
    const sentTab = document.querySelector("#sent-tab");
    const answeredTab = document.querySelector("#answered-tab");
    const allTab = document.querySelector("#all-tab");
    const messageArea = document.querySelector(".whatsapp-message-area-main");
    const logoContainer = document.querySelector(".whatsapp-logo-container");
    const sidebar = document.querySelector(".whatsapp-sidebar");

    if (spinner) spinner.remove();
    if (label) label.textContent = "Todos";

    if (newTab) newTab.style.display = "block";
    if (sentTab) sentTab.style.display = "block";
    if (answeredTab) answeredTab.style.display = "block";

    if (allTab) allTab.click();
    if (messageArea) messageArea.style.display = "block";
    if (logoContainer) logoContainer.style.display = "none";
    if (sidebar) sidebar.style.pointerEvents = "auto";
    if (sidebar) sidebar.style.display = "block";
}

/**
 * Updates the synchronization loading spinner based on the synchronization status.
 */
function updateSynchronizationLoadingSpinner() {
   checkSynchronizationStatus().then(status => {
    synchronizationFinished = status;
    if (synchronizationFinished) {
        finishLoading();
    }
  });
}

// ========================= Event Handlers =========================

/**
 * Handles the event when the delete selected contacts button is clicked.
 * Marks the selected contacts as deleted and updates the contact lists on the server.
 * @param {Event} event - The click event.
 */
async function handleDeleteSelectedContactsClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const selectedContactKeys = Array.from(selectedContacts.entries())
        .filter(([key, value]) => value === true)
        .map(([key, value]) => key);

    if (selectedContactKeys.length === 0) {
        showAlert('Nenhum contato selecionado.');
        return;
    }

    if (showConfirmation('Tem certeza que deseja marcar os contatos selecionados como apagados?')) {
        contacts.forEach(contact => {
            if (selectedContactKeys.includes(contact.key)) {
                contact.isDeleted = true;
            }
        });
        await updateContactsOnServer(contacts);
        renderContactLists(contacts,currentTab);
    }
}

/**
 * Handles the event when the navigation button is clicked.
 * Sets the active tab, renders the contact lists, and loads the last used script for the new tab.
 * @param {Event} event - The click event.
 */
function handleNavButtonClick(event) {
    const targetTabPaneId = (event.target.getAttribute('data-bs-target')  || '#all').replace("#", "");
    showLoadingSpinner(targetTabPaneId);
    toggleAllContacts(false);
    currentTab = targetTabPaneId;
    renderContactLists(contacts, currentTab);

    const lastScriptKey = localStorage.getItem(`lastScript-${targetTabPaneId}`);
    if (lastScriptKey) {
        scriptSelect.value = lastScriptKey;
    } else{
        scriptSelect.value = 'newScript';
    }
    scriptSelect.dispatchEvent(new Event('change'));
}

/**
 * Handles the event when the send message button is clicked.
 * Saves the script name to local storage.
 */
function handleSendMessageButtonClick() {
    if (currentTab && currentScriptKey){
        localStorage.setItem(`lastScript-${currentTab}`, currentScriptKey);
    }
}

/**
 * Handles the event when the load contacts button is clicked.
 * Saves the selected column indexes to local storage and loads the contacts.
 */
async function handleLoadContactsButtonClick() {
    saveColumnSelectionsToLocalStorage(nameColumnSelect.value, phoneColumnSelect.value);

    await loadContacts();
    csvColumnSelectDiv.style.display = 'none';
}

/**
 * Handles the event when a search input is entered.
 * Renders the contact lists based on the search term.
 */
function handleSearchInputChange() {
    renderContactLists(contacts,currentTab);
}

/**
 * Handles the event when the select all button is clicked.
 * Selects all contacts in the current view.
 */
function handleSelectAllButtonClick() {
    toggleAllContacts(true);
}

/**
 * Handles the event when the deselect all button is clicked.
 * Deselects all contacts in the current view.
 */
function handleDeselectAllButtonClick() {
    toggleAllContacts(false);
}

/**
 * Handles the event when the add contact button is clicked.
 * Adds a new contact to the contact list.
 */
async function handleAddContactButtonClick() {
    const name = newContactNameInput.value.trim();
    let phone = newContactPhoneInput.value.trim();

    phone = phone.replace(/\D/g, '');

    if (name && phone) {
        if (!/^\d+$/.test(phone)) {
            showAlert("Por favor, insira um número de telefone válido (apenas dígitos).");
            return;
        }

        const newContact = addContact(name, phone);
        contacts.push(newContact);
        await updateContactsOnServer(contacts);
        renderContactLists(contacts,currentTab);

        newContactNameInput.value = '';
        newContactPhoneInput.value = '';
    } else {
        showAlert('Por favor, preencha o nome e o número de telefone.');
    }
}

function addContact(name, phone) {
    const newContact = {
        fullName: name,
        phoneNumber: phone,
        status: 'new',
        timestamp: DEFAULT_TIME_STAMP,
        isDeleted: false // Novo atributo
    };
    return addKeyToContact(newContact);
}


/**
 * Handles the form submission event.
 * Sends the selected contacts and message to the server.
 * @param {Event} event - The submit event.
 */
function handleMainFormSubmit(event) {
    event.preventDefault();

    if (sendMessageBtn.disabled) {
        showAlert('Por favor, selecione ao menos um contato antes de enviar as mensagens.');
        return;
    }

    const contactsToSend = [];
    contacts.forEach((contact) => {
        if (selectedContacts.get(contact.key)) {
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

            const messageParts = message.split(/\[send\]/gi);

            messageParts.forEach(messagePart => {
                const bubbleContainer = document.createElement('div');
                bubbleContainer.classList.add('contact-bubble-container');

                if (status === 'success') {
                    bubbleContainer.classList.add('outgoing');
                }

                const contactBubble = document.createElement('div');
                contactBubble.classList.add('contact-bubble');
                contactBubble.classList.add(status === 'success' ? 'outgoing' : 'incoming');

                const contactNameElement = document.createElement('div');
                contactNameElement.classList.add('contact-name');
                contactNameElement.textContent = contactName;

                const messageElement = document.createElement('div');
                messageElement.classList.add('contact-message');
                if (testMode) {
                    messageElement.textContent = "[TESTE] " + messagePart;
                } else {
                    messageElement.textContent = messagePart.replace(/^\n+/, '');
                }

                contactBubble.appendChild(contactNameElement);
                contactBubble.appendChild(messageElement);

                bubbleContainer.appendChild(contactBubble);
                messageText.appendChild(bubbleContainer);
            });
        });
        messageModal.style.display = "block";
    })
    .catch(error => {
        console.error('Erro:', error);
        messageText.textContent = 'Ocorreu um erro ao enviar as mensagens.';
        messageModal.style.display = "block";
    });
    testModeCheckbox.checked = true;
}

// ========================= Socket.IO Handling =========================

/**
 * Saves scroll positions for all contact lists.
 * @returns {object} An object containing the scroll positions for each contact list.
 */
function saveScrollPositions() {
    const scrollPositions = {
        contactList: document.getElementById('contactList').scrollTop,
        contactListNew: document.getElementById('contactListNew').scrollTop,
        contactListSent: document.getElementById('contactListSent').scrollTop,
        contactListAnswered: document.getElementById('contactListAnswered').scrollTop
    };
    return scrollPositions;
}

/**
 * Restores scroll positions for all contact lists.
 * @param {object} scrollPositions - An object containing the scroll positions for each contact list.
 */
function restoreScrollPositions(scrollPositions) {
    if (scrollPositions) {
        document.getElementById('contactList').scrollTop = scrollPositions.contactList || 0;
        document.getElementById('contactListNew').scrollTop = scrollPositions.contactListNew || 0;
        document.getElementById('contactListSent').scrollTop = scrollPositions.contactListSent || 0;
        document.getElementById('contactListAnswered').scrollTop = scrollPositions.contactListAnswered || 0;
    }
}

// ========================= Initialization =========================
//Altere o inicializeQrCodeModal para receber socket.
function initializeQrCodeModal(socket){
    const qrCodeModal = document.getElementById('qrCodeModal');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const qrCodeClose = document.getElementById('qrCodeClose');

    // Function to open the QR code modal
    function openQrCodeModal(qrCodeData) {
        qrCodeImage.src = qrCodeData;  // Set the image source
        qrCodeModal.style.display = 'block';
    }

    // Function to close the QR code modal
    function closeQrCodeModal() {
        qrCodeModal.style.display = 'none';
    }

    // Event listener to close the modal
    qrCodeClose.addEventListener('click', closeQrCodeModal);

    // Close the modal if the user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === qrCodeModal) {
            closeQrCodeModal();
        }
    });

    // Listen for the 'qr' event from the server
    socket.on('qr', (qrCodeData) => {
        console.log('Received QR code data from server.');
        openQrCodeModal(qrCodeData); // Display the QR code in the modal
    });

    socket.on('authenticated', () => {
        console.log('Authenticated successfully!');
        closeQrCodeModal(); // Close the QR code modal
    });

    // Add this section to update the synchronization label
    socket.on('synchronization_progress', (data) => {
        const progressLabel = document.querySelector('.synchronization-status .synchronization-label');
        progressLabel.textContent = `Sincronizando ${data.current}/${data.total}`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Load settings from localStorage
    loadSettingsFromLocalStorage();
    // Initialize synchronization loading spinner
    updateSynchronizationLoadingSpinner();
    // Load scripts
    loadScripts();
    // Initialize with "New Script" selected
    scriptSelect.value = 'newScript';
    scriptSelect.dispatchEvent(new Event('change'));
    const storedColumnSelections = loadColumnSelectionsFromLocalStorage();
    loadContactsFromServer().then(contacts => {
        renderContactLists(contacts, currentTab);
    }).catch(error => {
        console.error("Error on Load Contacts:", error);
    });

    const socket = io(); //  No need to specify the URL if serving from the same origin
    initializeQrCodeModal(socket); //  No need to specify the URL if serving from the same origin

    // Event listeners
    deleteSelectionContacts.addEventListener('click', handleDeleteSelectedContactsClick);
    navButton.addEventListener('click', handleNavButtonClick);
    sendMessageBtn.addEventListener('click', handleSendMessageButtonClick);
    fileInput.addEventListener('change', handleFileInputChange);
    loadContactsBtn.addEventListener('click', handleLoadContactsButtonClick);
    searchInput.addEventListener('input', handleSearchInputChange);
    selectAllButton.addEventListener('click', handleSelectAllButtonClick);
    deselectAllButton.addEventListener('click', handleDeselectAllButtonClick);
    addContactBtn.addEventListener('click', handleAddContactButtonClick);
    mainForm.addEventListener('submit', handleMainFormSubmit);

    // Script Management
    scriptSelect.addEventListener('change', handleScriptSelectionChange);
    saveNewScriptBtn.addEventListener('click', saveNewScript);
    deleteScriptBtn.addEventListener('click', deleteScript);
    messageTextarea.addEventListener('input', () => {
        if (currentScriptKey) {
            saveMessageForScript(currentScriptKey, messageTextarea.value);
        }
    });

    window.addEventListener('click', handleOutsideClick);
    document.querySelector('.close').addEventListener('click', closeMessageModal);

    socket.on('contacts_updated', (updatedContacts) => {
        const scrollPositions = saveScrollPositions();

        console.log('Received updated contacts from server:', updatedContacts);
        contacts = updatedContacts;
        contacts = contacts.map(contact => addKeyToContact(contact));
        const searchTerm = searchInput.value.toLowerCase();
        const filteredContacts = contacts.filter(contact =>
            contact.fullName.toLowerCase().includes(searchTerm) ||
            contact.phoneNumber.toLowerCase().includes(searchTerm)
        );
        renderContactLists(filteredContacts, currentTab);

        restoreScrollPositions(scrollPositions);
    });

    socket.on('synchronization_finished', () => {
        finishLoading();
    });
});