from flask import Flask, render_template, request, redirect, send_file
from PIL import Image
import os
import shutil
import zipfile

app = Flask(__name__)

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def compress_image(input_path, output_path, quality=85, max_size=None):
    img = Image.open(input_path)

    if img.mode == 'RGBA':
        img = img.convert('RGB')

    img.save(output_path, 'JPEG', quality=quality, optimize=True)

    if max_size:
        while os.path.getsize(output_path) > (max_size * 1000):
            quality = int(quality * 0.9)
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
        # return redirect(request.url)
        file.filename = 'file_1.png'
    if file and allowed_file(file.filename):
        filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)

        file.save(filename)
        return render_template('compress.html', filename=file.filename)
    else:
        return "Invalid file format."

@app.route('/compress', methods=['POST', 'GET'])
def compress():
    filename = request.form.get('filename')
    formats = request.form.getlist('formats')
    limits = {format: int(request.form.get(f'{format}_limit')) for format in formats}

    compressed_files = []

    for format in formats:
        output_folder = os.path.join(app.config['UPLOAD_FOLDER'], format)
        os.makedirs(output_folder, exist_ok=True)

        output_file = os.path.join(output_folder, f'{os.path.basename(filename).rsplit(".", 1)[0]}.{format}')

        compress_image(filename, output_file, max_size=limits.get(format))

        compressed_files.append(output_file)

    archive_name = os.path.join(app.config['UPLOAD_FOLDER'], 'compressed_files.zip')
    create_archive(compressed_files, archive_name)

    return send_file(archive_name, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
