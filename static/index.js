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
                    const newWindow = window.open();
                    newWindow.document.open();
                    newWindow.document.write(html);
                    newWindow.document.close();
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

    // // Event listener for form submission
    // document.querySelector('form').addEventListener('submit', function(event) {
    //     event.preventDefault(); // Prevent form submission
    //     if (filesToUpload.length === 0) {
    //         alert('Please select files to upload.');
    //         return false;
    //     }
    //     uploadFiles(filesToUpload);
    //     uploadButton.disabled = true;
    // });
});

let filesToUpload = [];

function addPanel() {
    var panels = document.getElementById('panels');
    var newPanel = panels.firstElementChild.cloneNode(true);
    panels.appendChild(newPanel);
  }