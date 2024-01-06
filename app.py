from flask import Flask, render_template, request, redirect, send_file, jsonify
from werkzeug.utils import secure_filename
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

def compress_image(file_name, output_path, quality=85, max_size=None):
    img = Image.open(file_name)

    if img.mode == 'RGBA':
        img = img.convert('RGB')

    img.save(output_path, 'JPEG', quality=quality, optimize=True)

    if max_size:
        while os.path.getsize(output_path) > (max_size * 1000):
            quality = int(quality * 0.9)
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
        return

def create_archive(files, archive_name):
    with zipfile.ZipFile(archive_name, 'w') as zipf:
        for file in files:
            zipf.write(file, os.path.basename(file))
            

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    print(request.files)  # Debug statement
    print(request.files.keys())   # Additional debug for form data
    uploaded_files = request.files.getlist('file')
    filenames = []
    for file in uploaded_files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            filenames.append(filename)
        else:
            return "Invalid file format."
    return render_template('compress.html', filenames=filenames)

@app.route('/compress', methods=['POST'])
def compress():

    if request.is_json:
        args = request.get_json()
        filename = args.get('filename')
        format = args.get('format')
        limit = args.get('size')


        output_folder = os.path.join(app.config['UPLOAD_FOLDER'], format)
        os.makedirs(output_folder, exist_ok=True)

        output_file = os.path.join(output_folder, f'{os.path.basename(filename).rsplit(".", 1)[0]}.{format}')


        filename = filename[1:].replace('/', '\\')
        compress_image(filename, output_file, max_size=int(limit))
        # extension = filename.split('.')[-1]

        return send_file(output_file, as_attachment=True, mimetype=f'image/{format}')
    else:
        return jsonify({'status': 'error', 'message': 'Invalid content type'}), 400

if __name__ == '__main__':
    app.run(debug=True)
