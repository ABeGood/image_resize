from flask import Flask, render_template, request, redirect, send_file, jsonify
from werkzeug.utils import secure_filename
from PIL import Image
import os
import tempfile
import zipfile
import io
import copy

app = Flask(__name__)

UPLOAD_FOLDER = 'static/uploads'
COMPRESSED_FOLDER = 'static/compressed'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def convert_image(img, format, n_of_colors):
    img = copy.copy(img)
    if format in ['JPEG', 'JPG']:
        img = img.convert('RGB')

    img = img.convert("P", palette=Image.ADAPTIVE, colors=n_of_colors)

    if format in ['JPEG', 'JPG']:
        img = img.convert('RGB')

    buffer = io.BytesIO()
    img.save(buffer, format)
    compressed_size_kb = len(buffer.getvalue()) / 1024
    print(f'With {n_of_colors} colors compressed to {compressed_size_kb} KB')
    buffer.close()

    return img, compressed_size_kb

def compress_image(file_name, output_path, format, target_size_kb):
    format = format.upper()
    n_of_colors_min = 0
    n_of_colors_max = 256
    n_of_colors = 256
    n_of_colors_last = 0


    try:
        img_orig = Image.open(''.join([UPLOAD_FOLDER, '/', file_name]))

        img, compressed_size_kb = convert_image(img_orig, format, n_of_colors)

        while n_of_colors > 1:
            n_of_colors = (n_of_colors_min + n_of_colors_max)//2

            img, compressed_size_kb = convert_image(img_orig, format, n_of_colors)

            if compressed_size_kb <= target_size_kb:
                n_of_colors_min = n_of_colors

            elif compressed_size_kb > target_size_kb:
                n_of_colors_max = n_of_colors

            if n_of_colors == n_of_colors_last:
                break

            n_of_colors_last = n_of_colors


        img.save(output_path, format=format)
        print(f"Image compressed and saved to {output_path} with file size {compressed_size_kb:.2f} KB")
        return
    except Exception as e:
        print(f"Error: {str(e)}")

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
    print
    filenames = []
    for file in uploaded_files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename).replace(' ', '_')
            path = ''.join([UPLOAD_FOLDER, '/', filename])
            print(path)
            file.save(path)
            filenames.append(filename)
        else:
            return jsonify({'status': 'error', 'message': 'Invalid file format.'}), 400
    return jsonify({'status': 'success', 'filenames': filenames})

@app.route('/compress', methods=['POST'])
def compress():
    if request.is_json:
        args = request.get_json()
        # files_to_clean = []

        zip_filename = os.path.join(tempfile.gettempdir(), "compressed_images.zip")
        outputs = args.get('outputs')

        with zipfile.ZipFile(zip_filename, 'w') as zipf:            
            for output in outputs:
                format = output[1]
                limit = int(output[2])

                for filename in output[0]:
                    filename = filename.lstrip('/')

                    # The folder name in the ZIP will be based on the format
                    folder_name = format +'-'+str(limit)+'Kb'

                    # output_file = os.path.join(COMPRESSED_FOLDER, f'{os.path.basename(filename).rsplit(".", 1)[0]}.{format}')
                    output_file = ''.join([COMPRESSED_FOLDER, '/', f'{os.path.basename(filename).rsplit(".", 1)[0]}.{format}'])

                    compress_image(filename, output_file, format, target_size_kb=int(limit))
                    
                    # The path inside the ZIP includes the folder name
                    inside_zip_path = ''.join([folder_name, '/', os.path.basename(output_file)])
                    zipf.write(output_file, arcname=inside_zip_path)
                    # files_to_clean.append(output_file)

        return send_file(zip_filename, as_attachment=True, mimetype=f'application/zip')

        # TODO: Cleenup
        # for file_path in files_to_clean:
        #     if os.path.exists(file_path):
        #         os.remove(file_path)
        # return send_file(output_file, as_attachment=True, mimetype=f'image/{format}')
        # return jsonify({'status': 'success', 'message': 'Compress page rendered.'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'Invalid content type.'}), 400

if __name__ == '__main__':
    app.run(debug=True)

