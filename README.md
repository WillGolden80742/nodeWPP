# nodeWPP - WhatsApp Sender

A web application built with Node.js and WhatsApp Web.js to send personalized messages to a list of contacts imported from CSV or VCF files.

## Features

-   **Contact Management:**
    -   Import contacts from CSV or VCF files.
    -   Add contacts individually.
    -   Categorize contacts into "All," "New," "Sent," and "Answered."
    -   Search and filter contacts by name or phone number.
    -   Select/Deselect all contacts for sending messages.
    -   Delete individual contacts from the list.
-   **Message Sending:**
    -   Compose personalized messages using placeholders for greetings and contact names.
    -   Test mode to simulate message sending without actually sending them.
    -   Displays the status of sent messages (success/error) with the name of the contact and the actual message sent.
-   **Real-time Updates:**
    -   Uses Socket.IO for real-time updates on contact status and list changes.
-   **Data Persistence:**
    -   Stores contact data in a JSON file on the server.
    -   Saves message content to local storage for persistent editing.
-   **User Interface:**
    -   Modern and intuitive WhatsApp-inspired user interface.

## Technologies

-   **Backend:**
    -   Node.js
    -   Express.js
    -   WhatsApp Web.js
    -   Socket.IO
    -   express-fileupload
-   **Frontend:**
    -   HTML
    -   CSS
    -   JavaScript
    -   Bootstrap
    -   Material Design Icons
-   **Other:**
    -   qrcode-terminal (for QR code display in the console)

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/WillGolden80742/nodeWPP.git
    cd nodeWPP
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Chrome Executable Path:**

    -   Modify the `executablePath` in `index.js` to point to your Chrome installation.
        ```javascript
        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // <-- Change this!
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        ```
    -   **Important:**  Make sure the path is correct, or the WhatsApp Web.js client might not work.

4.  **Start the server:**

    ```bash
    npm start
    ```

5.  **Access the application:**

    -   Open your web browser and navigate to `http://localhost:3000`.

6.  **WhatsApp Authentication:**

    -   Scan the QR code displayed in the console with your WhatsApp mobile app to authenticate.

## Usage

1.  **Import Contacts:**
    -   Upload a CSV or VCF file containing your contacts using the "Selecione o arquivo" button.
    -   For CSV files, select the appropriate columns for "Nome" (Name) and "Telefone" (Phone Number).

2.  **Add Contacts Manually:**
    -   Enter the name and phone number in the "Adicionar Contato" section and click the "+" button.

3.  **Compose Message:**
    -   Enter your message in the text area, using `[greeting]` for a personalized greeting and `[name]` for the contact's name.
    -   Example: "Olá [name], [greeting]! Esta é uma mensagem personalizada."

4.  **Select Contacts:**
    -   Select the contacts you want to send the message to using the checkboxes in the contact list.
    -   Use the "Selecionar Todos" or "Desmarcar Todos" buttons to quickly select/deselect all contacts.

5.  **Send Message:**
    -   Make sure the "Modo de Teste" checkbox is selected to simulate sending without actual delivery.
    -   Click the "Enviar Mensagem" button to send the message to the selected contacts.

6.  **View Results:**
    -   A modal window will appear displaying the status (success/error) of each message sent.

## Important Notes

-   **WhatsApp Web.js Limitations:**  This project relies on WhatsApp Web.js, which is an unofficial WhatsApp API.  It's subject to changes and limitations imposed by WhatsApp.  Use at your own risk and be mindful of WhatsApp's terms of service.
-   **Chrome Executable Path:**  Ensure the `executablePath` in `index.js` is correctly configured to point to your Chrome installation.
-   **Rate Limiting:**  Be cautious about sending too many messages in a short period to avoid being flagged for spam. Implement delays or throttling mechanisms if needed.
-   **Test Mode:**  Always use test mode before sending messages to actual contacts.
-   **File Encoding:**  For CSV files, ensure proper encoding (e.g., UTF-8, ISO-8859-1) to avoid character encoding issues. The default in `script.js` is ISO-8859-1, so adapt as needed.
-   **Phone Number Formatting:** The code removes non-digit characters from phone numbers, but you may need to adapt the phone number cleaning logic if your contact lists use specific formatting.

## Future Enhancements

-   Add media sending capabilities (images, videos, documents).
-   Implement a scheduling feature for sending messages at specific times.
-   Provide more robust error handling and logging.
-   Offer more granular contact management options (tagging, grouping).
-   Add support for other messaging platforms.
-   Implement a more sophisticated UI with better error reporting and user feedback.

## Contributing

Contributions are welcome! Feel free to submit pull requests or open issues to suggest improvements or report bugs.
