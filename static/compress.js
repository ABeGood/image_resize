// This script can be used to add interactivity to the page
// For example, handling the "Add Panel" button click to clone the settings panel
document.addEventListener('DOMContentLoaded', () => {
    const uploadButton = document.getElementById('upload-button');
    const fileUploadContainer = document.getElementById('file-upload-container');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const uploadBox = document.getElementById('upload-box');
    const fileUploadInput = document.getElementById('file-upload');

    uploadButton.addEventListener('click', () => {
        if (filesToUpload.length === 0) {
            alert('Please select files to upload.');
            return;
        }
        uploadFiles(filesToUpload); // Send the filesToUpload list to the backend
        uploadButton.disabled = true;
    });

    fileUploadInput.addEventListener('change', () => {
        handleFiles(fileUploadInput.files);
    });

    uploadBox.addEventListener('dragover', (event) => {
        event.preventDefault();
        fileUploadContainer.classList.add('dragover');
    });

    uploadBox.addEventListener('dragleave', () => {
        fileUploadContainer.classList.remove('dragover');
    });

    uploadBox.addEventListener('drop', (event) => {
        event.preventDefault();
        fileUploadContainer.classList.remove('dragover');
        handleFiles(event.dataTransfer.files);
    });

    fileUploadContainer.addEventListener('click', (event) => {
        // Only trigger click on file input if the clicked element is not the file input itself
        if (event.target !== fileUploadInput) {
            fileUploadInput.click();
        }
    });

    document.addEventListener('paste', (event) => {
        const items = event.clipboardData.items;
        let validFiles = [];
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file && file.type.startsWith('image/')) {
                    validFiles.push(file)
                }
            }
        }
        handleFiles(validFiles);
    });

    function handleFiles(files) {
        thumbnailsContainer.innerHTML = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            filesToUpload.push(file);
        }

        for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            addThumbnail(file);
        }

        // AG: can do a lot of stuf here
        if (filesToUpload.length > 0) {
            uploadButton.disabled = false;
            console.log('Files selected, button enabled');
        } else {
            uploadButton.disabled = true;
            console.log('No files selected, button disabled');
        }
    }

    function removeFile(fileToRemove) {
        filesToUpload = filesToUpload.filter(file => file !== fileToRemove);
        if (filesToUpload.length > 0) {
            uploadButton.disabled = false;
            console.log('Files selected, button enabled');
        } else {
            uploadButton.disabled = true;
            console.log('No files selected, button disabled');
        }
    }

    function addThumbnail(file) {
        const container = document.createElement('div');
        container.classList.add('thumbnail-container');
    
        const thumbnail = document.createElement('img');
        thumbnail.classList.add('thumbnail');
        thumbnail.src = URL.createObjectURL(file); // Setting the source of the image
    
        container.appendChild(thumbnail);
    
        container.addEventListener('click', () => {
            removeFile(file);
            container.remove(); // Remove the thumbnail container
        });
    
        thumbnailsContainer.appendChild(container);
    }

    function uploadFiles(files) {
        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }

        // alert('FormData: {formData}')

        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                // Handle the response from the server
                console.log('Upload successful', data);

                const uploadedFiles = data.filenames;
                fetch('/compress', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({'filenames': uploadedFiles, 'type':'render'}),
                })
                .then(response => response.text())  // Parse response as text
                .then(html => {
                    // Insert the HTML content into the DOM
                    document.open();
                    document.write(html);
                    document.close();
                })
                .catch(error => {
                    // Handle errors for the `/compress` request
                    console.error('Error during rendering compress page.', error);
                });
            })
            .catch(error => {
                // Handle errors
                console.error('Error during upload', error);
            });
    }
});






function addPanel() {
    var settingsContainer = document.querySelector('.settings-container');
    var addButton = document.querySelector('.add-panel');
    
    // Use the hidden settings panel template for cloning
    var panelTemplate = document.getElementById('settings-panel-template');
    var newPanel = panelTemplate.cloneNode(true);

    // Remove the ID and make the panel visible
    newPanel.id = '';
    newPanel.style.display = '';
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

async function downloadOutput(buttonElement) {
    // Find the nearest parent settings panel
    var settingsPanel = buttonElement.closest('.settings-panel');

    // Extract values for format, size, and filename from the specific settings panel
    var format = settingsPanel.querySelector('.format').value;
    var size = settingsPanel.querySelector('.size').value;

    // Prepare the data to be sent in the POST request
    // var data = {
    //     'type': 'single',
    //     'filenames': filenames,
    //     'format': format,
    //     'size': size
    // };

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

    if (settingsPanels.length === 0) {
        alert('No outputs to process.');
        return;
    }

    const outputs = []

    settingsPanels.forEach(async (panel) => {
        // Extract values for format, size, and filename from each settings panel
        outputs.push([panel.querySelector('.format').value, panel.querySelector('.size').value]);
    });

    // Prepare the data to be sent in the POST request
    // const data = {
    //     'type': 'all',
    //     'filenames': filenames,
    //     // 'formats': formats,
    //     // 'sizes': sizes
    //     'outputs': outputs
    // };

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
            // downloadBlob(blob, `downloaded-${size}.${format}`);
            downloadBlob(blob, `downloaded-archive.zip`);
        } else {
            // If the response is JSON, handle accordingly
            const responseData = await response.json();
            console.log('Success:', responseData);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function selectImage(imagePath) {
    // Update the 'src' of the main image to the clicked thumbnail's image
    const mainImage = document.getElementById('main-image');
    mainImage.src = imagePath;
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