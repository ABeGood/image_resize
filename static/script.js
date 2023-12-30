document.addEventListener('DOMContentLoaded', () => {
    const fileUploadContainer = document.getElementById('file-upload-container');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const uploadBox = document.getElementById('upload-box');

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

    const fileUploadInput = document.getElementById('file-upload');
    
    fileUploadInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
    });

    fileUploadContainer.addEventListener('click', () => {
        fileUploadInput.click();
    });

    document.addEventListener('paste', (event) => {
        const items = event.clipboardData.items;
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file') {
                handleFiles([item.getAsFile()]);
                break;
            }
        }
    });

    function handleFiles(files) {
        thumbnailsContainer.innerHTML = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
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
        }
    }

    function uploadFiles(files) {
        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
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
});
