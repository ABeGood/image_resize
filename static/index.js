let filesToUpload = [];

document.addEventListener('DOMContentLoaded', () => {
    const fileUploadContainer   = document.getElementById('file-upload-container');
    const thumbnailsContainer   = document.getElementById('thumbnails-container');
    const uploadBox             = document.getElementById('upload-box');
    const fileUploadInput       = document.getElementById('file-upload');
    const imagePreview          = document.getElementById('main-image'); // Get the image preview element
    

 
        // uploadFiles(filesToUpload); // Send the filesToUpload list to the backend
        // receiveFiles(fileUploadInput.files);
        // refresh_preview()


    fileUploadInput.addEventListener('change', () => {
        receiveFiles(fileUploadInput.files);
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
        receiveFiles(event.dataTransfer.files);
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
        receiveFiles(validFiles);
        refresh_preview()
    });


    function receiveFiles(files)
    {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            filesToUpload.push(file);
        }

        uploadFiles(filesToUpload);
    }

    function changeImagePreview(file) {
        const imageUrl = URL.createObjectURL(file);
        imagePreview.src = imageUrl;
        imagePreview.alt = "Uploaded Image Preview";
    }

    function refresh_preview() {
        thumbnailsContainer.innerHTML = '';

        for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            addThumbnail(file);
        }

        // AG: can do a lot of stuf here
        if (filesToUpload.length > 0) {
            console.log('Files selected, button enabled');
            
            // Update the image preview with the first uploaded image
            console.log('Frst file is present: ' + filesToUpload[0]);
            const imageUrl = URL.createObjectURL(filesToUpload[0]);
            imagePreview.src = imageUrl;
            imagePreview.alt = "Uploaded Image Preview";

        } else {
            console.log('No files selected, button disabled');

            console.log('Clear preview');
                imagePreview.src = '';
                imagePreview.alt = '';
        }
    }

    function removeFile(fileToRemove) {
        filesToUpload = filesToUpload.filter(file => file !== fileToRemove);
    }

    function addThumbnail(file) {
        const container = document.createElement('div');
        container.classList.add('thumbnails-container');
    
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
            removeThumbnail(container, file);
        });
    
        container.appendChild(thumbnail);
        container.appendChild(closeButton);
    
        thumbnailsContainer.appendChild(container);
    }

    function removeThumbnail(container, file) {
        container.remove(); // Remove the thumbnail container
        removeFile(file);
        refresh_preview();
    }

    function uploadFiles(files) {
        console.log('Upload files')

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
            })
            .catch(error => {
                // Handle errors
                console.error('Error during upload', error);
            });
    }
});


async function downloadOutput(buttonElement) {
    // Find the nearest parent settings panel
    var settingsPanel = buttonElement.closest('.settings-panel');

    // Extract values for format, size, and filename from the specific settings panel
    var format = settingsPanel.querySelector('.format').value;
    var size = settingsPanel.querySelector('.size').value;

    console.log('Files to upload: ' + filesToUpload.length)

    // Prepare the data to be sent in the POST request
    var data = {
        'type': 'single',
        'filenames': filesToUpload.map(file => file.name),
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
        'filenames': filesToUpload.map(file => file.name),
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
function deletePanel(element) {
    var panel = element.closest('.format-panel');
    panel.remove();
}
