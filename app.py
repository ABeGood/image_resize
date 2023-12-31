from flask import Flask, render_template, request, send_file
from PIL import Image
import os
import shutil
import zipfile

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def compress_image(input_path, output_path, quality=85, max_size=None):
    img = Image.open(input_path)

    # Конвертировать изображение в режим RGB, если оно содержит альфа-канал
    if img.mode == 'RGBA':
        img = img.convert('RGB')

    img.save(output_path, 'JPEG', quality=quality, optimize=True)

    if max_size:
        # Проверить размер файла и уменьшить его, если необходимо
        while os.path.getsize(output_path) > (max_size * 1000):
            print(f'Compress iteration: {os.path.getsize(output_path)} with Q = {quality}')
            quality = int(quality * 0.9)
            # width, height = img.size
            # new_size = (width//2, height//2)
            # img = img.resize(new_size)
            img.save(output_path, 'JPEG', quality=quality, optimize=True)

def create_archive(files, archive_name):
    with zipfile.ZipFile(archive_name, 'w') as zipf:
        for file in files:
            zipf.write(file, os.path.basename(file))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    if file and allowed_file(file.filename):
        filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filename)
        return render_template('compress.html', filename=filename)
    else:
        return "Invalid file format."

@app.route('/compress', methods=['POST'])
def compress():
    filename = request.form.get('filename')
    formats = request.form.getlist('formats')
    limits = {format: int(request.form.get(f'{format}_limit')) for format in formats}

    compressed_files = []

    for format in formats:
        output_folder = os.path.join(app.config['UPLOAD_FOLDER'], format)
        os.makedirs(output_folder, exist_ok=True)

        output_file = os.path.join(output_folder, f'{os.path.basename(filename).rsplit(".", 1)[0]}.{format}')

        compress_image(filename, output_file, max_size=limits[format])

        compressed_files.append(output_file)


    archive_name = os.path.join(app.config['UPLOAD_FOLDER'], 'compressed_files.zip')
    create_archive(compressed_files, archive_name)

    return send_file(archive_name, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
