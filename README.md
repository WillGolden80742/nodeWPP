# WhatsApp Message Sender

This project is a simple web application built with Node.js, Express, and whatsapp-web.js to send personalized WhatsApp messages to a list of contacts. Contacts can be imported from a VCF file or added individually.

## Features

*   **Import Contacts from VCF:** Import contacts from a VCF file.
*   **Add Contacts Individually:** Add contacts one by one via a form.
*   **Search Contacts:** Filter contacts by name or phone number.
*   **Select All/Deselect All:** Quickly select or deselect all contacts.
*   **Personalized Messages:** Use `[name]` placeholder in the message to personalize messages.
*   **Test Mode:** Simulate message sending without actually sending them.
*   **Message Status:** Displays the status of each message sent in a modal window.
*   **Local Storage:** Contacts are saved in the browser's local storage.
*   **Delete Contacts:** Delete specific contact from the app.

## Technologies Used

*   **Node.js:** JavaScript runtime environment.
*   **Express:** Web application framework for Node.js.
*   **whatsapp-web.js:** WhatsApp client library for Node.js.
*   **qrcode-terminal:** Generate QR codes in the terminal.
*   **express-fileupload:** Middleware for handling file uploads.
*   **HTML/CSS/JavaScript:** For the user interface.
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

1.  **Chrome Executable Path (Optional):**

    *   The `executablePath` in `index.js` might need to be adjusted based on your Chrome installation path. If you encounter issues, update it accordingly:

        ```javascript
        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Adjust this path
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        ```

        **Note:**  The path provided in the initial code is a Windows path. If you are using macOS or Linux, you will need to find the equivalent path for your system. You can also remove this line if Chrome is installed in the default location for your operating system.

2.  **Important Note about Puppeteer:**

    *   The `whatsapp-web.js` library uses Puppeteer to control a headless Chrome browser. Ensure that Puppeteer is configured correctly. If you are running this in a Docker container or on a cloud server, you might need to adjust the `args` for Puppeteer.
    *   Using the specified `args` (`--no-sandbox`, `--disable-setuid-sandbox`) is necessary for some environments (like Docker) to avoid permission issues.

## Usage

1.  **Run the application:**

    ```bash
    node index.js
    ```

2.  **Open in your browser:**

    *   Open your browser and go to `http://localhost:3000`.

3.  **Authenticate with WhatsApp:**

    *   Scan the QR code displayed in the terminal using your WhatsApp mobile app (WhatsApp Web -> Link a Device).

4.  **Import or add contacts:**

    *   Upload a VCF file containing your contacts.
    *   Alternatively, add contacts individually using the provided form.

5.  **Compose your message:**

    *   Write your message in the text area. Use `[name]` as a placeholder for the contact's name.

6.  **Send messages:**

    *   Click the "Enviar Mensagens" button.
    *   Review the status of each message in the modal window that appears.

## Important Considerations

*   **WhatsApp Usage Policy:** Be mindful of WhatsApp's terms of service. Sending unsolicited messages or spam can lead to your account being banned.
*   **Rate Limiting:** Implement rate limiting to avoid overwhelming WhatsApp's servers. Consider adding a delay between messages.
*   **Error Handling:** Implement robust error handling to catch and handle potential issues during message sending.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://opensource.org/licenses/MIT)
