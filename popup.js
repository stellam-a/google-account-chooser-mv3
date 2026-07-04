// MV3 Fix: Change chrome.browserAction to chrome.action
const actionAPI = chrome.action || (window.browser && browser.action);

// If the browser is in dark mode, use the light icons. Otherwise, use the dark icons.
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    actionAPI.setIcon({
        path : {
            "16": "lightlogo16.png",
            "24": "lightlogo24.png",
            "32": "lightlogo32.png",
            "48": "lightlogo48.png",
            "64": "lightlogo64.png",
            "128": "lightlogo128.png"
        }
    });
} else {
    actionAPI.setIcon({
        path : {
            "16": "logo16.png",
            "24": "logo24.png",
            "32": "logo32.png",
            "48": "logo48.png",
            "64": "logo64.png",
            "128": "logo128.png"
        }
    });
}

function signIn(email) { 
    return (responses) => {
        let response = responses[0], url;
        if (response && response.url && response.url.includes('google')) { 
            url = new URL(response.url);
        } else {
            url = new URL('https://www.google.com/webhp');
        }
        let params = new URLSearchParams(url.search);

        params.delete('authuser'); 
        params.set('authuser', '');

        url.search = params.toString();
        let newURL = 'https://accounts.google.com/AccountChooser?source=ogb&continue='+encodeURIComponent(url.toString())+'&Email='+email;
        
        window.open(newURL);
        window.close(); 
    }
}

function setURL(index) { 
    function navigate(responses) { 
        let response = responses[0];
        if (!response || !response.url) return;
        
        let url = new URL(response.url)
          , params = new URLSearchParams(url.search);
        params.set('authuser', index);
        url.search = params.toString();
        
        // MV3 clean promise handling
        chrome.tabs.update(response.id, { url: url.toString() })
            .then(() => window.close())
            .catch(() => window.close());
    }
    
    return () => {
        chrome.tabs.query({ active: true, currentWindow: true })
            .then(navigate);
    }
}

function populate(response) { 
    // Handle potential errors from the background script parser
    if (!response || response.error || !response[1]) {
        console.error('Failed to fetch accounts:', response ? response.error : 'No response');
        let errorDiv = document.createElement('div');
        errorDiv.style.padding = '10px';
        errorDiv.style.color = 'red';
        errorDiv.textContent = 'Failed to load Google Accounts. Make sure you are logged into at least one account.';
        document.body.appendChild(errorDiv);
        return;
    }

    response[1].forEach(info => { 
        console.log('Account: ', info);
        
        let a = document.createElement('a');
        a.classList.add('topA')
        
        let img = document.createElement('img');
        img.classList.add('img')
        img.src = info[4]; 
        a.appendChild(img);
        
        let topDiv = document.createElement('div');
        topDiv.classList.add('top')
        
        let nameDiv = document.createElement('div');
        nameDiv.classList.add('name')
        nameDiv.appendChild(document.createTextNode(info[2])); 
        topDiv.appendChild(nameDiv);
        
        let emailDiv = document.createElement('div');
        emailDiv.classList.add('email')
        emailDiv.appendChild(document.createTextNode(info[3])); 
        topDiv.appendChild(emailDiv);
        
        a.appendChild(topDiv);
        
        if (info.length < 16) { 
            let cornerDiv = document.createElement('div');
            cornerDiv.classList.add('corner')
            cornerDiv.appendChild(document.createTextNode('Signed out'));
            a.appendChild(cornerDiv);
            a.addEventListener('click', () => {
                chrome.tabs.query({ active: true, currentWindow: true })
                    .then(signIn(info[3]));
            });
        } else {
            if (info[7] == 0) { 
                let cornerDiv = document.createElement('div');
                cornerDiv.classList.add('corner')
                cornerDiv.appendChild(document.createTextNode('Default'));
                a.appendChild(cornerDiv);
            }
            a.addEventListener('click', setURL(info[7])); 
        }
        
        document.body.appendChild(a);
    });
}

// MV3 clean message passing with Promises
chrome.runtime.sendMessage(null)
    .then(populate)
    .catch(err => console.error("Error communicating with background script:", err));
