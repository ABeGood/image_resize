// This script can be used to add interactivity to the page
// For example, handling the "Add Panel" button click to clone the settings panel

function addPanel() {
    var settingsContainer = document.querySelector('.settings-container');
    var addButton = document.querySelector('.add-panel');
    // Assuming the first child of settingsContainer is the settings panel template
    var panelTemplate = settingsContainer.getElementsByClassName('settings-panel')[0];
    var newPanel = panelTemplate.cloneNode(true);
    newPanel.className = 'settings-panel';
    // Set up the delete button event handler in the cloned panel
    newPanel.querySelector('.delete-panel').onclick = function() { deletePanel(this); };
    settingsContainer.insertBefore(newPanel, addButton);
}


function deletePanel(button) {
    var settingsContainer = document.querySelector('.settings-container');
    var panelToRemove = button.closest('.settings-panel');
    settingsContainer.removeChild(panelToRemove);
}

document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to all size input fields
    document.querySelectorAll('.size').forEach(function(sizeInput) {
        sizeInput.addEventListener('input', function(event) {
            // Replace any non-digit characters with an empty string
            event.target.value = event.target.value.replace(/\D/g, '');
        });
    });
});

async function downloadImage(buttonElement) {
    // Find the nearest parent settings panel
    var settingsPanel = buttonElement.closest('.settings-panel');

    // Extract values for format, size, and filename from the specific settings panel
    var format = settingsPanel.querySelector('.format').value;
    var size = settingsPanel.querySelector('.size').value;
    var filename = settingsPanel.querySelector('.filename').value;

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

async function downloadAll() {
    // Find all settings panels
    const settingsPanels = document.querySelectorAll('.settings-panel');

    settingsPanels.forEach(async (panel) => {
        // Extract values for format, size, and filename from each settings panel
        const format = panel.querySelector('.format').value;
        const size = panel.querySelector('.size').value;
        const filename = panel.querySelector('.filename').value;

        // Prepare the data to be sent in the POST request
        const data = {
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

            // Handle the response
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
                // If the response is a file, handle the file download
                const blob = await response.blob();
                downloadBlob(blob, `downloaded-${size}.${format}`);
            } else {
                // If the response is JSON, handle accordingly
                const responseData = await response.json();
                console.log('Success:', responseData);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}