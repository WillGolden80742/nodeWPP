# nodeWPP - WhatsApp Message Sender

A simple application built with Node.js and WhatsApp Web.js to send bulk messages to a list of contacts. You can import contacts from CSV or VCF files, personalize messages using templates, and track the status of sent messages.

## Features

*   **Bulk Message Sending:** Send personalized messages to a list of contacts.
*   **Contact Import:** Import contacts from CSV or VCF files.
*   **Message Personalization:** Use templates to personalize messages with contact names and greetings.
*   **Contact Management:** Add, update, and delete contacts directly within the application.
*   **Contact Status Tracking:** Track the status of sent messages (new, sent, answered).
*   **Script Management:** Save and reuse message templates as scripts.
*   **Test Mode:** Test message sending without actually sending the messages.
*   **Settings:** Configure default country code and area code (DDD).
*   **Duplicate Contact Handling:** Automatically removes duplicate contacts, prioritizing those not marked as deleted.
*   **Contact Name Verification:**  Fetches and updates contact names from the WhatsApp API if the name is generic or missing.

## Technologies Used

*   Node.js
*   Express.js
*   WhatsApp Web.js
*   Socket.IO
*   Express-Fileupload
*   qrcode-terminal
*   Lodash

## Prerequisites

*   Node.js (v16 or higher recommended)
*   npm (Node Package Manager)
*   Google Chrome (installed in the default location for executablePath)

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

*   **Executable Path:** Ensure the `executablePath` in `index.js` points to your Chrome installation.  The default is:

    ```javascript
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    ```

    You may need to adjust this path based on your operating system and Chrome installation location.  If you are deploying on a system where Chrome isn't directly installed (e.g., a server), you may need to explore alternative browser configurations using Puppeteer.

*   **Country Code and DDD:** Configure the default country code and DDD in the application settings (accessed via the cog icon in the UI).  These settings are used to normalize phone numbers.

## Usage

1.  **Start the application:**

    ```bash
    npm start
    ```

2.  **Open the application in your browser:**

    ```
    http://localhost:3000
    ```

3.  **Authenticate with WhatsApp:** A QR code will be displayed in the console. Scan the QR code using your WhatsApp mobile app to authenticate.

4.  **Import Contacts:** Import your contacts from a CSV or VCF file.  For CSV files, you'll need to select the columns containing the name and phone number.

5.  **Compose Message:** Write your message in the text area.  You can use the following placeholders:

    *   `[name]`:  Replaced with the contact's full name.
    *   `[greeting]`: Replaced with a personalized greeting based on the time of day.

6.  **Select Contacts:** Choose the contacts you want to send the message to.

7.  **Send Message:** Click the "Send Message" button to send the message to the selected contacts.

## CSV File Format

The CSV file should be a semicolon-separated file. The first line should contain headers for the columns.

Example:

```csv
nome;telefone
John Doe;5511999999999
Jane Smith;5521888888888
```

## Important Considerations

*   **WhatsApp Usage Policy:** Be aware of WhatsApp's usage policies regarding automated messaging. Sending unsolicited messages or spam can lead to your account being banned.
*   **Rate Limiting:**  Consider implementing rate limiting to avoid overwhelming the WhatsApp API and potentially triggering anti-spam measures.
*   **Error Handling:**  The current implementation includes basic error handling, but you should enhance it to handle potential issues like invalid phone numbers, network errors, and WhatsApp API errors.
*   **Scalability:** This application is designed for small to medium-scale message sending.  For larger volumes, you might need to explore more robust solutions using official WhatsApp Business API.
*   **Security:**  Storing sensitive information like API keys or credentials directly in the code is not recommended.  Use environment variables or a secure configuration management solution instead.

