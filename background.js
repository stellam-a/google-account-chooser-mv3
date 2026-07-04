// Listen for message from popup
chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    // Get list of Google accounts
    fetch('https://accounts.google.com/ListAccounts?gpsia=1&source=ogb&mo=1&origin=https://accounts.google.com')
        .then(response => response.text())
        .then(rawText => {
            // MV3 Fix: Instead of DOMParser, we use regex to find the contents inside the <script> tags
            const scriptMatch = rawText.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
            if (!scriptMatch || !scriptMatch[1]) {
                throw new Error("Could not find script block in Google response");
            }
            
            const scriptContent = scriptMatch[1];

            // Get the first tokenized string in the JS (Keeping original parsing logic)
            const tokenizedString = scriptContent.split('\'')[1];
            if (!tokenizedString) {
                throw new Error("Could not parse tokenized string from Google script");
            }

            return tokenizedString
                // Replace JS string hex escapes
                .replace(/\\x([0-9a-fA-F]{2})/g, (match, paren) => (
                    String.fromCharCode(parseInt(paren, 16))
                ))
                // Replace JS string slash and newline escapes
                .replace(/\\\//g, '\/')
                .replace(/\\n/g, '');
        })
        .then(text => JSON.parse(text))
        .then(jsonData => sendResponse(jsonData))
        .catch(error => {
            console.error("Error fetching accounts:", error);
            sendResponse({ error: error.message });
        });

    return true; // Indicates async response
});
