# nodeWPP - WhatsApp Bulk Message Sender

A simple yet powerful application built with Node.js and WhatsApp Web.js, designed to streamline your communication by sending bulk messages to a list of contacts. Import contacts from CSV or VCF files, personalize messages using templates, track the delivery status, and manage your contact list with ease.

## Features

*   **Bulk Messaging:** Send personalized WhatsApp messages to multiple contacts sequentially.
*   **CSV & VCF Contact Import:** Easily import contacts from CSV or VCF files.
*   **Segmented Messages with `[send]` Tag:** Break up long messages into multiple parts using the `[send]` tag. The application will send each part as a separate message, allowing you to bypass message length limitations or create engaging conversational flows.
*   **Dynamic Message Personalization:** Craft personalized messages with placeholders like `[name]` for the contact's name and `[greeting]` for a time-of-day-based greeting.
*   **Contact Management:** Seamlessly add new contacts individually or through file import, update existing contact information (like names), and **mark contacts as deleted directly from the UI**.  Deleted contacts are hidden from view but not physically removed, allowing for easy re-inclusion if needed.
*   **Contact Deletion:** Easily mark contacts as deleted through the UI. Deleted contacts won't receive messages and can be restored if necessary.
*   **Delete Multiple Contacts:** Mark multiple contacts as deleted by selecting them and using the "Apagar todos contatos selecionados" button.
*   **Message Status Tracking:** Monitor the status of each message: `new` (not yet sent), `sent`, or `answered` (if the contact replied).
*   **Script Saving and Reusing:** Save your most frequently used messages as "scripts" for quick access and reuse. Manage and delete scripts within the application.
*   **Test Mode (Sandbox):** Safely test your message sending setup without sending actual WhatsApp messages.
*   **Configurable Settings:** Tailor the application to your region by setting the default country code and area code (DDD).
*   **Duplicate Prevention:** Automatically handles duplicate contacts based on phone number, prioritizing the contact *not* marked as deleted.
*   **Automatic Contact Name Enrichment:** When the application encounters contacts with generic names ("Contact") or missing names, it automatically attempts to fetch the name from the WhatsApp API to improve contact recognition.
*   **Smart Tab System:** Efficiently organizes contacts by status (all, new, sent, answered), making it easy to manage your contacts and target your messaging. Remembers the last used script for each tab.
*   **QR Code Display:**  Displays the WhatsApp Web QR code in a modal window, making the authentication process clearer and more user-friendly.

## Technologies Used

*   **Node.js:** The runtime environment for executing JavaScript server-side.
*   **Express.js:** A minimalist web application framework for Node.js.
*   **WhatsApp Web.js:** A library for interacting with the WhatsApp Web client.
*   **Socket.IO:** Enables real-time, bidirectional communication between web clients and servers.
*   **Express-Fileupload:** Middleware for handling file uploads in Express.
*   **qrcode-terminal:** Generates QR codes in the terminal for WhatsApp Web authentication.  (Used for initial terminal display, but modal uses base64).
*   **Lodash:** A utility library providing functions for common programming tasks.

## Prerequisites

*   **Node.js:** (v16 or higher recommended) - Download from [https://nodejs.org/](https://nodejs.org/)
*   **npm (Node Package Manager):** Installed automatically with Node.js.
*   **Google Chrome:** Required for WhatsApp Web.js to function. Must be installed in a standard location for the default `executablePath`.

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

1.  **Locate Chrome Executable:** Find the correct path to your Chrome executable. This is *critical* for the application to work.

2.  **Update `index.js`:** Edit the `index.js` file and update the `executablePath` within the `puppeteer` options of the `Client` constructor:

    ```javascript
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',  // <-- ADJUST THIS PATH
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });
    ```

    **Important:**
    *   **Windows:** The default path is often correct.
    *   **macOS:** The path might be `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
    *   **Linux:** The path depends on how you installed Chrome (e.g., `/usr/bin/google-chrome`). If Chrome is *not* directly installed on a server, consider using a headless Chrome solution like [Puppeteer's Chromium](https://pptr.dev/).

3.  **Regional Settings:** Configure your default country code and area code (DDD) within the application settings. This will improve phone number handling. Click on the cog icon in the UI to access the settings.

## Usage

1.  **Start the application:**

    ```bash
    npm start
    ```

2.  **Access the application:** Open your web browser and go to:

    ```
    http://localhost:3000
    ```

3.  **Authenticate with WhatsApp Web:** The application will automatically display a QR code in a modal window. Open WhatsApp on your phone, go to "Linked Devices," and scan the QR code to authenticate. The modal will close automatically upon successful authentication.

4.  **Import Contacts:**
    *   **CSV:** Select a CSV file, then choose the correct columns for "Name" and "Phone Number."
    *   **VCF:** Select a VCF file. Contacts will be loaded automatically.

5.  **Compose Your Message:** Write your message in the text area. Use these placeholders for dynamic content:
    *   `[name]`: Replaced with the contact's full name.
    *   `[greeting]`: Replaced with a greeting appropriate for the time of day (e.g., "Good morning," "Good afternoon," "Good evening").
    *   `[send]`: **Crucial for segmenting long messages.** Insert this tag at points where you want to divide your message into separate parts. Each section separated by `[send]` will be sent as an individual message.

    **Example:**

    ```
    Hi [name], [greeting]! This is the first part of my message. [send] Here is the second part of my message, providing more details. [send] Finally, a call to action!
    ```

    This example will result in *three* separate WhatsApp messages being sent to the contact.

6.  **Contact Selection:** In the contact list, check the boxes next to the contacts you want to message. Use the "Select All" and "Deselect All" buttons to make selection easier. The smart tab system helps segment your contacts for efficient targeting.

7.  **Delete Contacts (Optional):** Select contacts in the list and click the "Apagar todos contatos selecionados" (Delete selected contacts) button to mark them as deleted. This removes them from the active contact list, preventing them from receiving messages. To restore a contact, you will need to manually update the contact list and re-import, or modify the data files directly.

8.  **Send Messages!** Click the "Send Message" button to start sending your personalized messages. View the results in the modal window that pops up. The modal will display *each message part* that was sent.

## CSV File Format

CSV files must be semicolon-separated. The first row must be a header row.

Example:

```csv
nome;telefone
John Doe;5511999999999
Jane Smith;5521888888888
```

## Important Considerations

*   **Abide by WhatsApp's Terms:** Use this tool responsibly and ethically. Sending unsolicited messages or spam can result in your WhatsApp account being banned.
*   **Implement Rate Limiting:** Consider adding a delay between messages to avoid triggering anti-spam measures. *The code already includes a 500ms delay between message parts, but you can adjust this.*
*   **Robust Error Handling:** Expand the error handling to gracefully manage issues such as invalid phone numbers, network disruptions, and WhatsApp API errors.
*   **Scalability Planning:** This application is best suited for small to medium-sized contact lists. For sending to thousands of contacts, explore official WhatsApp Business API solutions.
*   **Secure Credentials:** Never hardcode sensitive information directly into the source code. Use environment variables or a secure configuration management system for API keys and other sensitive data.

Enjoy streamlining your WhatsApp communication!
