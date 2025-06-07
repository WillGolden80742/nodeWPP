# nodeWPP - WhatsApp Marketing Automation Tool

A powerful and user-friendly web application crafted with Node.js and WhatsApp Web.js, designed to streamline your marketing efforts through personalized WhatsApp messaging.

## Core Features

*   **Sophisticated Contact Management:**
    *   **Seamless CSV & VCF Import:** Effortlessly import your contact lists from CSV or VCF files.
    *   **Manual Contact Entry:** Add individual contacts with ease directly within the application.
    *   **Intelligent Contact Categorization:** Contacts are dynamically organized into "All," "New," "Sent," and "Answered" categories for optimal workflow.
    *   **Powerful Search & Filtering:** Quickly locate contacts by name or phone number using the built-in search and filtering capabilities.
    *   **Bulk Selection:** Select/Deselect all contacts with a single click for efficient message targeting.
    *   **Contact Removal:** Maintain a clean contact list by removing unwanted contacts.
*   **Advanced Messaging Engine:**
    *   **Personalized Message Templates:** Craft highly engaging messages using placeholders for personalized greetings (`[greeting]`) and contact names (`[name]`).
    *   **Risk-Free Testing:** Refine your message templates using the "Test Mode" to simulate message delivery without actually sending them, ensuring accuracy and preventing errors.
    *   **Delivery Confirmation:** Track the status of each sent message (success/error) with detailed information including contact name and the exact message delivered.
*   **Real-Time Contact Synchronization:**
    *   **Socket.IO Integration:** Leverages Socket.IO for real-time contact status updates and list modifications, keeping your information current.
*   **Persistent Data Storage:**
    *   **JSON Data Storage:** Contacts are reliably stored in a JSON file on the server for safe data persistence.
    *   **Local Message Drafts:** Message content is saved to your browser's local storage, preventing data loss and allowing you to resume editing at any time.
*   **Intuitive User Experience:**
    *   **Modern UI:** Employs a contemporary and easy-to-navigate user interface inspired by WhatsApp's familiar design.

## Technical Stack

*   **Backend:**
    *   **Node.js:** The core runtime environment.
    *   **Express.js:** A lightweight web application framework.
    *   **WhatsApp Web.js:** An API for interacting with WhatsApp Web.
    *   **Socket.IO:** A library for enabling real-time, bidirectional communication.
    *   **express-fileupload:** Middleware for handling file uploads.
    *   **lodash:** Utility library for simplifying common programming tasks.
*   **Frontend:**
    *   **HTML:** The markup language for structuring the web pages.
    *   **CSS:** The stylesheet language for visual styling.
    *   **JavaScript:** The programming language for client-side interactivity.
    *   **Bootstrap:** A CSS framework for responsive design.
    *   **Material Design Icons:** A comprehensive icon set for a polished UI.
*   **Utilities:**
    *   **qrcode-terminal:** Displays QR codes in the terminal for authentication.

## Getting Started

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/WillGolden80742/nodeWPP.git
    cd nodeWPP
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Chrome Executable Path:**

    *   **Crucial Step:** Locate the `executablePath` within `index.js` and modify it to accurately reflect the path to your Chrome installation. This step is critical for the application's functionality.

        ```javascript
        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // <-- **MANDATORY: Update this path!**
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        ```

    *   **Verify Path:** Ensure that the path is 100% correct. An incorrect path will prevent WhatsApp Web.js from functioning properly.

4.  **Start the Application:**

    ```bash
    npm start
    ```

5.  **Access the Web Interface:**

    *   Open your preferred web browser and navigate to `http://localhost:3000`.

6.  **Authenticate with WhatsApp:**

    *   The application will display a QR code in your terminal. Scan this QR code using the WhatsApp application on your mobile device to authenticate your account.

## How to Use

1.  **Importing Contacts:**
    *   Click the "Selecione o arquivo" button to upload a CSV or VCF file containing your contact information.
    *   **CSV Specific:** If you upload a CSV file, you will need to select the appropriate columns corresponding to "Nome" (Name) and "Telefone" (Phone Number).

2.  **Adding Contacts Manually:**
    *   Use the "Adicionar Contato" section to manually add new contacts. Enter the contact's name and phone number and click the "+" button.

3.  **Composing Your Message:**
    *   In the message text area, compose your message. Use the `[greeting]` placeholder to insert a personalized greeting and `[name]` to automatically insert the contact's name.

        *   **Example:** `Olá [name], [greeting]! Esta é uma mensagem personalizada.`

4.  **Selecting Message Recipients:**
    *   Select the contacts you want to send the message to by checking the corresponding checkboxes in the contact list.
    *   Use the "Selecionar Todos" and "Desmarcar Todos" buttons to quickly select or deselect all contacts.

5.  **Sending Your Message:**
    *   Before sending, ensure that the "Modo de Teste" checkbox is checked to simulate sending the messages without actual delivery.
    *   Click the "Enviar Mensagem" button to send the message to the selected contacts.

6.  **Reviewing Results:**
    *   After sending, a modal window will appear, displaying the status of each message (success/error) along with the contact's name and the message that was sent.

## Important Considerations

*   **WhatsApp Web.js Disclaimer:** This project relies on an unofficial WhatsApp API (WhatsApp Web.js). Use it responsibly, as it is subject to potential changes and limitations imposed by WhatsApp. Always adhere to WhatsApp's terms of service.
*   **Chrome Executable Path (Critical):** Double-check that the `executablePath` configuration in `index.js` accurately points to your Chrome installation.
*   **Rate Limiting Awareness:** Avoid sending a high volume of messages in a short period to prevent potential account flagging for spamming. Consider implementing delays or throttling mechanisms.
*   **Prioritize Test Mode:** Always utilize the "Test Mode" before sending live messages to ensure proper formatting and avoid errors.
*   **CSV File Encoding:** Verify that your CSV files are encoded correctly (e.g., UTF-8 or ISO-8859-1) to prevent character encoding problems. The current default in `script.js` is ISO-8859-1, so adjust as needed.
*   **Phone Number Cleaning:** The application automatically removes non-numeric characters from phone numbers. Adjust the phone number cleaning logic if your contact lists use specific formatting conventions.

## Planned Enhancements

*   **Multimedia Support:** Add the capability to send images, videos, and documents.
*   **Message Scheduling:** Implement a scheduling feature to send messages at pre-defined times.
*   **Enhanced Error Handling:** Improve error handling and logging for better diagnostics.
*   **Advanced Contact Segmentation:** Implement features for tagging and grouping contacts for more targeted messaging.
*   **Multi-Platform Support:** Explore support for other messaging platforms.
*   **UI/UX Refinement:** Develop a more advanced UI with improved user feedback and error reporting mechanisms.

## Contribution Guidelines

We welcome contributions to this project! Feel free to submit pull requests or open issues to report bugs or suggest enhancements.

This revised README provides a more comprehensive description of the tool, emphasizing its features and usage, and providing clear guidance for setup and troubleshooting. It also includes a more formal and professional tone.
