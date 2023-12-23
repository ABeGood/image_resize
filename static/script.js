// Ваш JavaScript-код здесь
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

fileUploadContainer.addEventListener('click', () => {
    document.getElementById('file-upload').click();
});

fileUploadContainer.addEventListener('change', (event) => {
    handleFiles(event.target.files);
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

function uploadFiles() {
    // Логика загрузки файлов
    // Теперь у вас есть доступ к файлам и миниатюрам для дальнейшей обработки
}
