# WhatsApp Marketing Automation Tool - Streamline Your Outreach

A powerful and user-centric web application, built using Node.js and WhatsApp Web.js, designed to enhance your marketing capabilities through personalized WhatsApp messaging.

## Key Features

*   **Comprehensive Contact Management System:**
    *   **Effortless CSV & VCF Import:** Seamlessly integrate your contact lists from CSV or VCF files, maintaining data integrity and organization.
    *   **Manual Contact Addition:** Quickly add individual contacts directly within the application, ensuring flexibility and ease of use.
    *   **Dynamic Contact Categorization:** Contacts are intelligently sorted into "All," "New," "Sent," and "Answered" categories, optimizing your workflow and message targeting.
    *   **Advanced Search and Filtering:** Easily find contacts by name or phone number using the integrated search and filtering functionalities.
    *   **Streamlined Bulk Selection:** Select or deselect all contacts with a single click for efficient message targeting and management.
    *   **Simplified Contact Removal:** Maintain a clean and up-to-date contact list by effortlessly removing unwanted contacts.
*   **Robust Messaging Platform:**
    *   **Personalized Message Templating:** Create highly engaging and customized messages using placeholders for greetings (`[greeting]`) and contact names (`[name]`).
    *   **Safe Testing Environment:** Refine your message templates using the "Test Mode" to simulate message delivery without sending actual messages, guaranteeing accuracy and preventing errors.
    *   **Real-time Delivery Confirmation:** Monitor the status of each sent message (success/error) with detailed information, including contact name and the specific message delivered.
*   **Real-Time Contact Synchronization:**
    *   **Socket.IO Integration:** Utilize Socket.IO for instant contact status updates and list modifications, ensuring your information is always current and accurate.
*   **Reliable Data Storage:**
    *   **JSON Data Storage:** Contacts are securely stored in a JSON file on the server for persistent and reliable data retention.
    *   **Local Message Drafts:** Message content is automatically saved to your browser's local storage, preventing data loss and allowing you to resume editing at any time.
*   **Intuitive User Experience:**
    *   **Modern and User-Friendly UI:** Employs a contemporary and intuitive user interface, inspired by WhatsApp's familiar design, ensuring ease of navigation and efficient use.

## Technologies Used

*   **Backend:**
    *   **Node.js:**  The runtime environment for server-side JavaScript execution.
    *   **Express.js:** A fast and minimalist web application framework for Node.js.
    *   **WhatsApp Web.js:** An API that allows interaction with WhatsApp Web, providing messaging functionalities.
    *   **Socket.IO:** A library for enabling real-time, bidirectional, and event-based communication between web clients and servers.
    *   **express-fileupload:** Middleware to facilitate the handling of file uploads.
    *   **lodash:** A utility library providing helpful functions for common programming tasks, enhancing code efficiency.
*   **Frontend:**
    *   **HTML:** The foundation of the web application structure.
    *   **CSS:** Stylesheet language used to define the presentation and visual layout of the web pages.
    *   **JavaScript:** The programming language for implementing client-side interactivity and dynamic behavior.
    *   **Bootstrap:** A front-end framework to create responsive and visually appealing interfaces.
    *   **Material Design Icons:** A comprehensive set of icons to enhance the user interface with a polished design.
*   **Utilities:**
    *   **qrcode-terminal:**  Displays QR codes in the terminal for easy WhatsApp Web authentication.

## Quick Start Guide

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

    *   **Important:**  You need to specify the path to the Chrome executable. Open `index.js` and update the `executablePath` configuration in the `puppeteer` settings.  **This step is mandatory** for the application to function correctly.

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

    *   **Path Verification:**  Ensure the path points to the Chrome executable on your system.  An incorrect path will prevent the application from working.

4.  **Start the Application:**

    ```bash
    npm start
    ```

5.  **Access the Web Interface:**

    *   Open your web browser and go to `http://localhost:3000`.

6.  **Authenticate with WhatsApp:**

    *   A QR code will be displayed in your terminal. Scan this code using the WhatsApp application on your mobile phone to authenticate.

## Usage Instructions

1.  **Importing Contacts:**
    *   Click the "Selecione o arquivo" button to upload a CSV or VCF file.
    *   **For CSV Files:**  Select the columns corresponding to "Nome" (Name) and "Telefone" (Phone Number) from the dropdown menus.

2.  **Adding Contacts Manually:**
    *   Use the "Adicionar Contato" section. Enter the contact's name and phone number, then click the "+" button.

3.  **Composing Messages:**
    *   Use the message text area to write your message. Use the `[greeting]` placeholder for personalized greetings and `[name]` for the contact's name.

        *   **Example:** `Olá [name], [greeting]!  We have an exclusive offer for you.`

4.  **Selecting Recipients:**
    *   Select contacts to send the message to by checking the checkboxes in the contact list.
    *   Use "Selecionar Todos" and "Desmarcar Todos" to quickly select or deselect all contacts.

5.  **Sending Messages:**
    *   Ensure "Modo de Teste" is checked for simulated sending.
    *   Click the "Enviar Mensagem" button.

6.  **Reviewing Results:**
    *   A modal window will display the status (success/error), contact name, and sent message for each contact.

## Important Considerations and Best Practices

*   **WhatsApp Web.js is Unofficial:** This project uses an unofficial API. Use it responsibly and in compliance with WhatsApp's terms of service. WhatsApp may change its policies or API structure, potentially affecting the functionality of this application.
*   **Correct Chrome Executable Path:** The `executablePath` setting in `index.js` must accurately point to your Chrome installation.
*   **Avoid Spamming:** Do not send mass messages in a short period. This could lead to your account being flagged or banned. Implement delays or throttling mechanisms.
*   **Use Test Mode:** Always test messages in "Modo de Teste" to avoid errors.
*   **CSV Encoding:** Ensure CSV files are properly encoded (UTF-8 or ISO-8859-1) to prevent character encoding issues. The application uses ISO-8859-1 by default.
*   **Phone Number Cleaning:**  The application removes non-numeric characters from phone numbers. Adjust the cleaning logic if needed.

## Future Development

*   Multimedia Messaging (Images, Videos, Documents).
*   Scheduled Message Delivery.
*   Enhanced Error Logging and Handling.
*   Advanced Contact Segmentation (Tagging, Grouping).
*   Support for Multiple Messaging Platforms.
*   UI/UX Improvements and Enhanced User Feedback.
