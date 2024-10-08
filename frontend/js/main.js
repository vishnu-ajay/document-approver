import config from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlId = getUrlParameter('urlId');
    if (!urlId) {
        document.getElementById('responseMessage').innerText = 'Invalid or missing URL ID.';
        return;
    }

    const deviceId = getDeviceId(); // Get the unique device identifier

    console.log('Submitting request with URL ID:', urlId);
    console.log('Device Identifier (acting as MAC Address):', deviceId);

    try {
        const response = await fetch(`${config.backendUrl}/access-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlId, macAddress: deviceId })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Response from server:', data.message);

            // Redirect if a URL is provided
            if (data.redirectUrl) {
                console.log('Redirecting to:', data.redirectUrl);
                window.location.href = data.redirectUrl;
            } else {
                document.getElementById('responseMessage').innerText = data.message;
            }
        } else {
            const errorText = await response.text();
            console.error('Error:', errorText);
            document.getElementById('responseMessage').innerText = errorText;
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Helper functions remain the same...
// Function to get or create a unique device identifier
function getDeviceId() {
    // Check if a device ID already exists in localStorage
    let deviceId = localStorage.getItem('device-id');
    
    if (!deviceId) {
        // If not, generate a new UUID
        deviceId = generateUUID();
        localStorage.setItem('device-id', deviceId);
        console.log('Generated new Device ID:', deviceId);
    } else {
        console.log('Existing Device ID found:', deviceId);
    }

    return deviceId;
}

// Function to generate a UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
              v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
