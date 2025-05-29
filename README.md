# WhatsApp Message Sender

This project is a simple web application built with Node.js, Express, and whatsapp-web.js to send personalized WhatsApp messages to a list of contacts. Contacts can be imported from a VCF file or added individually.

## Features

*   **Import Contacts from VCF:**  Upload a VCF file to import multiple contacts at once.
*   **Add Contacts Individually:**  Add new contacts directly through a simple form, providing name and phone number.
*   **Search Contacts:** Quickly find specific contacts by filtering the list by name or phone number.
*   **Select All/Deselect All:**  Easily select or deselect all contacts in the list with a single click.
*   **Personalized Messages:**  Create dynamic messages using the `[name]` placeholder for the contact's name and `[greeting]` for a time-based greeting (e.g., "Good morning").
*   **Test Mode:**  Simulate sending messages without actually sending them, useful for testing message templates and configurations.
*   **Message Status:**  Track the status of each message sent in a modal window, showing whether it was successfully sent or if an error occurred.
*   **Local Storage:** Contacts are automatically saved in the browser's local storage for persistence across sessions.
*   **Delete Contacts:** Remove specific contacts from the list individually.

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
        const { Client, LocalAuth } = require('whatsapp-web.js');

        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Adjust this path
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        ```

        **Note:**  The path provided in the initial code is a Windows path. If you are using macOS or Linux, you will need to find the equivalent path for your system. You can also remove this line if Chrome is installed in the default location for your operating system.  If Chrome is installed in the default location for your OS, whatsapp-web.js will usually be able to find it automatically.

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

    *   Scan the QR code displayed in the terminal using your WhatsApp mobile app (WhatsApp Web -> Linked Devices -> Link a Device).

4.  **Import or add contacts:**

    *   Upload a VCF file containing your contacts.
    *   Alternatively, add contacts individually using the provided form.

5.  **Compose your message:**

    *   Write your message in the text area. Use `[name]` as a placeholder for the contact's name and `[greeting]` for a time-appropriate greeting (Good morning, Good afternoon, Good evening).

6.  **Send messages:**

    *   Select the contacts you want to send the message to.
    *   Check the "Test Mode" checkbox to simulate sending without actually sending the messages.
    *   Click the "Enviar Mensagens" button.
    *   Review the status of each message in the modal window that appears.

## Important Considerations

*   **WhatsApp Usage Policy:** Be mindful of WhatsApp's terms of service. Sending unsolicited messages or spam can lead to your account being banned.
*   **Rate Limiting:** Implement rate limiting to avoid overwhelming WhatsApp's servers. Consider adding a delay between messages.
*   **Error Handling:** Implement robust error handling to catch and handle potential issues during message sending.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
