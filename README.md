# WhatsApp Marketing Automation Tool - Empower Your Outreach

A user-friendly web application engineered with Node.js and WhatsApp Web.js, designed to elevate your marketing efforts through personalized WhatsApp messaging campaigns.

## Core Features

*   **Advanced Contact Management:**
    *   **Seamless CSV & VCF Import:** Integrate contact lists from CSV and VCF files effortlessly, ensuring organized data.
    *   **Direct Contact Addition:** Add individual contacts directly within the application.
    *   **Intelligent Contact Categorization:** Contacts are automatically categorized into "All," "New," "Sent," and "Answered" based on their interaction status.
    *   **Enhanced Search & Filtering:** Easily locate contacts using name or phone number search.
    *   **Efficient Bulk Selection:** Select or deselect all contacts with a single click.
    *   **Simplified Contact Deletion:** Remove contacts to maintain a current contact list.
*   **Powerful Messaging Capabilities:**
    *   **Personalized Message Templates:** Craft custom messages using placeholders like `[greeting]` and `[name]`.
    *   **Secure Test Mode:** Simulate message sending with "Test Mode" without sending real messages, ensuring accuracy.
    *   **Real-Time Delivery Tracking:** Monitor the status of each message delivery (success/error), including contact and message information.
*   **Live Contact Synchronization:**
    *   **Socket.IO Integration:** Benefit from real-time updates to contact status and modifications using Socket.IO.
*   **Robust Data Storage:**
    *   **JSON Data Storage:** Securely store contacts in a JSON file for persistence.
    *   **Local Message Drafts:** Automatically save message drafts to local storage for easy editing.
*   **Intuitive User Interface:**
    *   **WhatsApp-Inspired UI:** Leverage a modern, easy-to-use interface reminiscent of WhatsApp.

## Tech Stack

*   **Backend:**
    *   **Node.js:**  The runtime environment for server-side JavaScript.
    *   **Express.js:** A fast and minimalist web application framework for Node.js.
    *   **WhatsApp Web.js:** An API for interacting with WhatsApp Web.
    *   **Socket.IO:** A library for real-time, bidirectional communication.
    *   **express-fileupload:** Middleware for handling file uploads.
    *   **lodash:** A utility library for common programming tasks.
*   **Frontend:**
    *   **HTML:** The structure of the web application.
    *   **CSS:** Stylesheet language to define the presentation and visual layout.
    *   **JavaScript:** The programming language for implementing client-side interactivity.
    *   **Bootstrap:** A front-end framework to create responsive interfaces.
    *   **Material Design Icons:** Icons to enhance the user interface.
*   **Utilities:**
    *   **qrcode-terminal:**  Displays QR codes in the terminal for easy WhatsApp Web authentication.

## Get Started

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

    *   **Important:**  Update the `executablePath` in `index.js` to point to your Chrome executable.

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

    *   **Path Verification:**  Verify the path is correct; otherwise, the application will not function.

4.  **Run the Application:**

    ```bash
    npm start
    ```

5.  **Access the Web Interface:**

    *   Open your web browser and navigate to `http://localhost:3000`.

6.  **Authenticate with WhatsApp:**

    *   Scan the QR code displayed in your terminal using the WhatsApp application.

## Instructions for Use

1.  **Importing Contacts:**
    *   Upload a CSV or VCF file using the "Selecione o arquivo" button.
    *   **For CSV:**  Select the appropriate "Nome" (Name) and "Telefone" (Phone Number) columns.

2.  **Adding Contacts Manually:**
    *   Use the "Adicionar Contato" section to input contact details.

3.  **Composing Messages:**
    *   Craft your message in the text area, utilizing `[greeting]` and `[name]` placeholders.

        *   **Example:** `Olá [name], [greeting]!  We have an exclusive offer for you.`

4.  **Selecting Recipients:**
    *   Check the checkboxes in the contact list to choose recipients.
    *   Use "Selecionar Todos" and "Desmarcar Todos" for quick selections.

5.  **Sending Messages:**
    *   Enable "Modo de Teste" for simulated sending.
    *   Click "Enviar Mensagem."

6.  **Reviewing Results:**
    *   The modal window will display the status, contact, and message for each contact.

## Important Notes and Guidelines

*   **Unofficial API:**  Use this application responsibly and within WhatsApp's terms of service, as it relies on an unofficial API.
*   **Accurate Chrome Path:** Ensure the `executablePath` in `index.js` is correctly configured.
*   **Avoid Spam:** Do not send messages in bulk rapidly. Implement delays to prevent your account from being flagged.
*   **Test Mode:** Always test messages using "Modo de Teste."
*   **CSV Encoding:** Use proper CSV encoding (UTF-8 or ISO-8859-1). The app defaults to ISO-8859-1.
*   **Phone Number Sanitization:** The application removes non-numeric characters from phone numbers.

## Planned Enhancements

*   Multimedia Messaging (Images, Videos, Documents).
*   Scheduled Message Delivery.
*   Improved Error Handling and Logging.
*   Advanced Contact Segmentation.
*   Multi-Platform Support.
*   Enhanced User Interface and Feedback Mechanisms.