
document.addEventListener('DOMContentLoaded', () => {
    const uploadButton = document.getElementById('upload-button');
    const fileUploadContainer = document.getElementById('file-upload-container');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const uploadBox = document.getElementById('upload-box');
    const fileUploadInput = document.getElementById('file-upload');


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
            const thumbnail = document.createElement('img');
                thumbnail.classList.add('thumbnail');
                thumbnail.file = file;

                const reader = new FileReader();
                reader.onload = (function(thumbnail) {
                    return function(e) {
                        thumbnail.src = e.target.result;
                    };
                })(thumbnail);

                reader.readAsDataURL(file);

                thumbnailsContainer.appendChild(thumbnail);
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

    function uploadFiles(files) {
        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            const file = filesToUpload[i];
            formData.append('files[]', file, file.name);
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

    // Event listener for form submission
    document.querySelector('form').addEventListener('submit', function(event) {
        if (filesToUpload.files.length === 0) {
            event.preventDefault(); // Prevent form submission
            alert('Please select files to upload.');
            return false;
        }
        // Proceed with form submission (files are present)
        // Optionally, you could disable the button again here
        uploadButton.disabled = true;
    });
});

let filesToUpload = [];

function addPanel() {
    var panels = document.getElementById('panels');
    var newPanel = panels.firstElementChild.cloneNode(true);
    panels.appendChild(newPanel);
  }
  
  // Add event listeners to handle changes in form controls
  document.addEventListener('input', function (event) {
    if (event.target.type === 'range') {
      // TODO: Update size value based on compression level
      // This value should also be sent to the backend
    }
  });
  
  document.addEventListener('click', function (event) {
    if (event.target.id === 'download') {
      // TODO: Trigger backend Python function
    }
  });