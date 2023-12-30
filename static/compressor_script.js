// This script can be used to add interactivity to the page
// For example, handling the "Add Panel" button click to clone the settings panel

function addPanel() {
    var settingsContainer = document.querySelector('.settings-container');
    // Assuming the first child of settingsContainer is the settings panel template
    var panelTemplate = settingsContainer.getElementsByClassName('settings-panel')[0];
    var newPanel = panelTemplate.cloneNode(true);
    // Set up the delete button event handler in the cloned panel
    newPanel.querySelector('.delete-panel').onclick = function() { deletePanel(this); };
    settingsContainer.appendChild(newPanel);
}

function deletePanel(button) {
    var settingsContainer = document.querySelector('.settings-container');
    var panelToRemove = button.closest('.settings-panel');
    settingsContainer.removeChild(panelToRemove);
}

async function downloadImage(buttonElement) {
    // Find the nearest parent settings panel
    var settingsPanel = buttonElement.closest('.settings-panel');

    // Extract values for format and size from the specific settings panel
    var format = document.getElementById('format').value;
    var size = document.getElementById('size').value;
    var filename = document.getElementById('filename').value;

    // Prepare the data to be sent in the POST request
    var data = {
        'filename': filename,
        'format': format,
        'size': size
    };

    // Send the POST request to the Flask endpoint
    try {
        const response = await fetch('/compress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if the response is JSON or an image
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
            // Handle image file response
            response.blob().then(blob => {
                // Create a URL for the blob
                const url = window.URL.createObjectURL(blob);
                // Create a link and set the URL as the href
                const a = document.createElement('a');
                a.href = url;
                a.download = 'downloaded-image'; // Set a filename for the download
                document.body.appendChild(a);
                a.click(); // Trigger the download
                window.URL.revokeObjectURL(url); // Clean up
            });
        } else {
            // Handle JSON response
            const data = await response.json();
            console.log('Success:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function downloadAll() {
    // Logic to handle the download of all items
    alert("Downloading all items..."); // Placeholder action
}