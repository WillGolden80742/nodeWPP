# WhatsApp Message Sender

This project is a simple web application built with Node.js, Express, and whatsapp-web.js to send personalized WhatsApp messages to a list of contacts. Contacts can be imported from a VCF file or added individually.

## Features

*   **Import Contacts from VCF:** Upload a VCF file to import multiple contacts at once.
*   **Add Contacts Individually:** Add new contacts directly through a simple form, providing name and phone number.
*   **Search Contacts:** Quickly find specific contacts by filtering the list by name or phone number.
*   **Select All/Deselect All:** Easily select or deselect all contacts in the list```markdown
# WhatsApp Message Sender

This project is a simple web application built with Node.js, Express, and whatsapp-web.js to send personalized WhatsApp messages to a list of contacts. Contacts can be imported from a VCF file or added individually.

## Features

*   **Import Contacts from VCF with a single click.**
*   **Personalized Messages:** Create dynamic messages using the `[name]` placeholder for the contact's name and `[greeting]` for a time-based greeting (e.g., "Good morning")
*   **Upload a VCF file to import multiple contacts at once.**
*   **Add Contacts Individually:**  Add new contacts directly through a simple form in multiple languages. The application supports greetings in English, Spanish, French, German, Japanese, Chinese, Portuguese, Russian, Arabic, Italian, Korean, Hindi, Turkish, Dutch, Swedish, Polish, Danish, Norwegian, Finnish and Indonesian.
*   **Multi-Language Support:** The `[greeting]` placeholder, providing name and phone number.
*   **Search Contacts:** Quickly find specific contacts by filtering the list by name or phone number.
*   **Select All/Deselect All:**  Easily select or deselect all contacts in the list with a single click.
*   **Personalized Messages:**  Create dynamic messages using the `[name]` placeholder for the contact's name and `[greeting]` for a time-based greeting (e. is dynamically translated based on the contact's language preference.
*   **Test Mode:** Simulate sending messages without actually sending them, useful for testing message templates and configurations.
*   **Message Status:** Track the status of each message sent in a modal window, showing whether it was successfully sent or if an error occurred.g., "Good morning").  The `[greeting]` placeholder supports greetings in multiple languages (see "Multilingual Greetings" below).
*   **Test Mode:**  Simulate sending messages without actually sending them, useful for testing message templates and configurations.
*   **Message Status:**  Track the status of each message
*   **Local Storage:** Contacts are automatically saved in the browser's local storage for persistence across sessions.
*   **Delete Contacts:** Remove specific contacts from the list individually.

## Technologies Used

*   **Node.js:** JavaScript runtime environment.
*   **Express:** Web application framework for sent in a modal window, showing whether it was successfully sent or if an error occurred.
*   **Local Storage:** Contacts are automatically saved in the browser's local storage for persistence across sessions.
*   **Delete Contacts:** Remove specific contacts from the list individually.

## Technologies Used

*   ** Node.js.
*   **whatsapp-web.js:** WhatsApp client library for Node.js.
*   **qrcode-terminal:** Generate QR codes in the terminal.
*   **express-fileupload:** Middleware for handling file uploads.
*   **HTML/CSS/JavaScript:** For the userNode.js:** JavaScript runtime environment.
*   **Express:** Web application framework for Node.js.
*   **whatsapp-web.js:** WhatsApp client library for Node.js.
*   **qrcode-terminal:** Generate QR codes in the terminal.
*   **express-fileupload:** Middleware interface.
*   **Bootstrap:** CSS framework for styling.
*   **Material Design Icons:** Icons for the user interface.

## Prerequisites

*   Node.js (v16 or higher)
*   npm (Node Package Manager)
*   WhatsApp account

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/WillGolden80742/nodeWPP.git
    cd nodeWPP
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

## Configuration

 for handling file uploads.
*   **HTML/CSS/JavaScript:** For the user interface.
*   **Bootstrap:** CSS framework for styling.
*   **Material Design Icons:** Icons for the user interface.

## Prerequisites

*   Node.js (v16 or higher)
*   1.  **Chrome Executable Path (Optional):**

    *   The `executablePath` in `index.js` might need to be adjusted based on your Chrome installation path. If you encounter issues, update it accordingly:

        ```javascript
        const { Client, LocalAuth } = require('npm (Node Package Manager)
*   WhatsApp account

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/WillGolden80742/nodeWPP.git
    cd nodeWPP
    ```

2.  **whatsapp-web.js');

        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Adjust this path
                args:Install dependencies:**

    ```bash
    npm install
    ```

## Configuration

1.  **Chrome Executable Path (Optional):**

    *   The `executablePath` in `index.js` might need to be adjusted based on your Chrome installation path. If you encounter issues, update it ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        ```

        **Note:** The path provided in the initial code is a Windows path. If you are using macOS or Linux, you will need to find the equivalent path for your system. You can also remove accordingly:

        ```javascript
        const { Client, LocalAuth } = require('whatsapp-web.js');

        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                executablePath: 'C:\\Program Files\\ this line if Chrome is installed in the default location for your operating system. If Chrome is installed in the default location for your OS, whatsapp-web.js will usually be able to find it automatically.

2.  **Important Note about Puppeteer:**

    *   The `whatsapp-web.js`Google\\Chrome\\Application\\chrome.exe', // Adjust this path
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        ```

        **Note:**  The path provided in the initial code is a Windows path. If you are using macOS or Linux, library uses Puppeteer to control a headless Chrome browser. Ensure that Puppeteer is configured correctly. If you are running this in a Docker container or on a cloud server, you might need to adjust the `args` for Puppeteer.
    *   Using the specified `args` (`--no-sandbox`, `-- you will need to find the equivalent path for your system. You can also remove this line if Chrome is installed in the default location for your operating system.  If Chrome is installed in the default location for your OS, whatsapp-web.js will usually be able to find it automatically.

2.  **Importantdisable-setuid-sandbox`) is necessary for some environments (like Docker) to avoid permission issues.

## Usage

1.  **Run the application:**

    ```bash
    node index.js
    ```

2.  **Open in your browser:**

    *   Open your browser and Note about Puppeteer:**

    *   The `whatsapp-web.js` library uses Puppeteer to control a headless Chrome browser. Ensure that Puppeteer is configured correctly. If you are running this in a Docker container or on a cloud server, you might need to adjust the `args` for Puppeteer. go to `http://localhost:3000`.

3.  **Authenticate with WhatsApp:**

    *   Scan the QR code displayed in the terminal using your WhatsApp mobile app (WhatsApp Web -> Linked Devices -> Link a Device).

4.  **Import or add contacts:**

    *   Upload
    *   Using the specified `args` (`--no-sandbox`, `--disable-setuid-sandbox`) is necessary for some environments (like Docker) to avoid permission issues.

## Usage

1.  **Run the application:**

    ```bash
    node index.js
    ```

2.  **Open in your browser:**

    *   Open your browser and go to `http://localhost:3000`.

3.  **Authenticate with WhatsApp:**

    *   Scan the QR code displayed in the terminal using your WhatsApp mobile app (WhatsApp Web -> Linked Devices -> Link a a VCF file containing your contacts.
    *   Alternatively, add contacts individually using the provided form.

5.  **Set Contact Language Preference:**

    *   **Important:** To utilize the multi-language `[greeting]` feature, you must store the preferred language for each contact. This can be implemented Device).

4.  **Import or add contacts:**

    *   Upload a VCF file containing your contacts.
    *   Alternatively, add contacts individually using the provided form.

5.  **Compose your message:**

    *   Write your message in the text area. Use `[name by:
        *   Modifying the contact data structure to include a `languageCode` field (e.g., `contact.languageCode = 'es';` for Spanish).
        *   Updating the UI to allow users to set the language for each contact.
        *   If no language is]` as a placeholder for the contact's name and `[greeting]` for a time-appropriate greeting.

6.  **Multilingual Greetings:**

    *   The application supports greetings in the following languages: English, Spanish, French, German, Japanese, Simplified Chinese, Portuguese, Russian, Arabic, Italian, Korean specified, the application defaults to English.
    *   Supported language codes: `en`, `es`, `fr`, `de`, `ja`, `zh`, `pt`, `ru`, `ar`, `it`, `ko`, `hi`, `tr`, `nl`, `sv`, `pl`, `da`,, Hindi, Turkish, Dutch, Swedish, Polish, Danish, Norwegian, Finnish, and Indonesian.
    *   To use a language-specific greeting, you **must** configure the language for each contact. This involves modifying the contact data structure to include a `languageCode` field (e.g., `contact.language `no`, `fi`, `id`.

6.  **Compose your message:**

    *   Write your message in the text area. Use `[name]` as a placeholder for the contact's name and `[greeting]` for a time-appropriate greeting (Good morning, Good afternoon, Good evening) in the contact's preferred language.

7.  **Send messages:**

    *   Select the contacts you want to send the message to.
    *   Check the "Test Mode" checkbox to simulate sending without actually sending the messages.
    *   Click the "Enviar Mensagens" button.Code = 'es'` for Spanish). See the "Code Customization for Multilingual Support" section for details.
    *   If a language code is not specified for a contact, or if a translation is missing for a particular language, the greeting will default to English.

7.  **Send messages:**


    *   Review the status of each message in the modal window that appears.

## Important Considerations

*   **WhatsApp Usage Policy:** Be mindful of WhatsApp's terms of service. Sending unsolicited messages or spam can lead to your account being banned.
*   **Rate Limiting:** Implement rate limiting to    *   Select the contacts you want to send the message to.
    *   Check the "Test Mode" checkbox to simulate sending without actually sending the messages.
    *   Click the "Enviar Mensagens" button.
    *   Review the status of each message in the modal window that appears. avoid overwhelming WhatsApp's servers. Consider adding a delay between messages.
*   **Error Handling:** Implement robust error handling to catch and handle potential issues during message sending.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
