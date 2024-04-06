let thumbnailsContainer;
let leftContent;
let panelFileLists = {};

document.addEventListener('DOMContentLoaded', () => {
    thumbnailsContainer   = document.getElementById('thumbnails-container');
    leftContent           = document.getElementById('left-content');
    uploadContainer       = document.getElementById('upload-container');
    
    const uploadBox             = document.getElementById('upload-box-main');
    const fileUploadContainer   = document.getElementById('file-upload-container');
    const fileUploadInput       = document.getElementById('file-upload');

    addPanel();

    fileUploadInput.addEventListener('change', () => {
        receiveFiles(fileUploadInput.files, -1);
        refresh_preview()
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
        receiveFiles(event.dataTransfer.files, -1);
        refresh_preview()
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
        receiveFiles(validFiles, -1);
        refresh_preview()
    });
});

function receiveFiles(files, panelIndex)
{
    console.log('PANEL INDEX:' + panelIndex)
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        filenames.push(file);

        if (!panelFileLists[panelIndex]) {
            panelFileLists[panelIndex] = []; // Initialize list if needed
        }
        panelFileLists[panelIndex].push(file);
    }
    uploadFiles(filenames);
}

function removeFile(fileToRemove) {
    filenames = filenames.filter(file => file !== fileToRemove);


    
    for (panelIndex of Object.keys(panelFileLists))
    {
        panelFileLists[panelIndex] = panelFileLists[panelIndex].filter(file => file !== fileToRemove);
    }
    refresh_preview();
}

function uploadFiles(files) {
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
    }

    fetch('/upload', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            // Handle the response from the server
            console.log('Upload successful', data);
        })
        .catch(error => {
            // Handle errors
            console.error('Error during upload', error);
        });
}

function refresh_preview() {
    thumbnailsContainer.innerHTML = '';

    // AG: can do a lot of stuf here
    if (filenames.length > 0) {    
        thumbnailsContainer.style.display = 'flex';
        for (let i = 0; i < filenames.length; i++) {
            const file = filenames[i];
            addThumbnail(file, thumbnailsContainer);
        }

        if (leftContent && uploadContainer) {
            leftContent.appendChild(uploadContainer);
        }

    } else {
        if (leftContent && uploadContainer && leftContent.firstChild) {
            leftContent.insertBefore(uploadContainer, leftContent.firstChild);
        } else if (leftContent && uploadContainer) {
            leftContent.appendChild(uploadContainer);
        }

        thumbnailsContainer.style.display = 'none';
    }

    // const fileUploadContainers = document.querySelectorAll('.file-upload-container-small');
    // fileUploadContainers.forEach(container => {
    //     container.innerHTML = ''; // Clear thumbnails
    // });

    // Iterate through each settings panel
    if(Object.keys(panelFileLists).length > 0)
    {
        const settingsPanels = document.querySelectorAll('.settings-panel');
        settingsPanels.forEach((panel) => {
            const fileUploadContainer = panel.querySelector('.thumbnails-container-small');
            fileUploadContainer.innerHTML = '';
            console.log('PANEL INDEX: '+ panel.index)
            // Display thumbnails for the panel's file list
            if (panelFileLists[panel.index]) { // Check if file list exists
                panelFileLists[panel.index].forEach(file => {
                    addThumbnail(file, fileUploadContainer); // Pass container for specific panel
                });
            }
        });
    }
}

function addThumbnail(file, container) {
    const thumbnail = document.createElement('img');

    thumbnail.classList.add('thumbnail');
    thumbnail.src = URL.createObjectURL(file); // Setting the source of the image
    thumbnail.addEventListener('click', () => {
        changeImagePreview(file);
    });

    // Add red cross icon
    const closeButton = document.createElement('i');
    closeButton.classList.add('fas', 'fa-times', 'close-icon');
    closeButton.addEventListener('click', () => {
        removeFile(file);
    });

    container.appendChild(thumbnail);
    container.appendChild(closeButton);
}

async function downloadOutput(buttonElement) {
    // Find the nearest parent settings panel
    var settingsPanel = buttonElement.closest('.settings-panel');

    // Extract values for format, size, and filename from the specific settings panel
    var format = settingsPanel.querySelector('.format').value;
    var size = settingsPanel.querySelector('.size').value;

    // Prepare the data to be sent in the POST request
    var data = {
        'type': 'single',
        'filenames': filenames.map(file => file.name),
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
    const data = {
        'type': 'all',
        'filenames': filenames.map(file => file.name),
        // 'formats': formats,
        // 'sizes': sizes
        'outputs': outputs
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

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}

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
    newPanel.index = findMinimalFreeKey()

    panelFileLists[newPanel.index] = [];
    // Set up the delete button event handler in the cloned panel
    newPanel.querySelector('.delete-panel').onclick = function() { deletePanel(this); };

    console.log(newPanel)

    // Add event listener for file upload input in the new panel
    var fileUploadInputSmall = newPanel.querySelector('.file-upload-input-small');
    var uploadBoxSmall = newPanel.querySelector('.upload-box-small');
    var fileUploadContainerSmall = newPanel.querySelector('.file-upload-container-small');

    fileUploadInputSmall.addEventListener('change', () => {
        receiveFiles(fileUploadInputSmall.files, newPanel.index);
        refresh_preview();
    });
    
    uploadBoxSmall.addEventListener('dragover', (event) => {
        event.preventDefault();
        fileUploadContainerSmall.classList.add('dragover');
    });

    uploadBoxSmall.addEventListener('dragleave', () => {
        fileUploadContainerSmall.classList.remove('dragover');
    });

    uploadBoxSmall.addEventListener('drop', (event) => {
        event.preventDefault();
        fileUploadContainerSmall.classList.remove('dragover');
        receiveFiles(event.dataTransfer.files, newPanel.index);
        refresh_preview();
    });

    fileUploadContainerSmall.addEventListener('click', (event) => {
        // Only trigger click on file input if the clicked element is not the file input itself
        if (event.target !== fileUploadInputSmall) {
            fileUploadInputSmall.click();
        }
    });
    

    settingsContainer.insertBefore(newPanel, addButton);
}

function deletePanel(button) {
    var settingsContainer = document.querySelector('.settings-container');
    var panelToRemove = button.closest('.settings-panel');
    settingsContainer.removeChild(panelToRemove);
    delete panelFileLists[panelToRemove.panelIndex];
}

function findMinimalFreeKey() {
    if(Object.keys(panelFileLists).length < 1){
        return 0
    }

    let minFreeKey = 1; // Start checking from 1

    while (panelFileLists.hasOwnProperty(minFreeKey)) {
        minFreeKey++; // Increment until a free key is found
    }

    return minFreeKey;
}
