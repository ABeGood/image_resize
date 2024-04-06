from flask import Flask, render_template, request, redirect, send_file, jsonify
from werkzeug.utils import secure_filename
from PIL import Image
import os
import tempfile
import zipfile
import io

app = Flask(__name__)

UPLOAD_FOLDER = 'static/uploads'
COMPRESSED_FOLDER = 'static/compressed'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def compress_image(file_name, output_path, target_size_kb):
    try:
        min_quality = 0 # %
        max_quality = 100 # %
        last_quality = 0
        tolerance = 2 # KB
        img = Image.open(''.join([UPLOAD_FOLDER, '/', file_name]))

        if img.mode == 'RGBA':
            img = img.convert('RGB')

        buffer = io.BytesIO()
        img.save(buffer, 'JPEG', quality=100)
        compressed_size_kb = len(buffer.getvalue()) / 1024
        print(f'With Q={100} Compressed to {compressed_size_kb} KB')
        buffer.close()

        if compressed_size_kb <= target_size_kb:
            img.save(output_path, 'JPEG', quality=100)
            print(f"Image compressed and saved to {output_path} with file size {compressed_size_kb:.2f} KB without quality loss!")
            return

        while True:
            quality = (min_quality + max_quality)//2
            
            buffer = io.BytesIO()
            img.save(buffer, 'JPEG', quality=quality)
            compressed_size_kb = len(buffer.getvalue()) / 1024
            print(f'With Q={quality} Compressed to {compressed_size_kb:.2f} KB')
            buffer.close()

            if compressed_size_kb > target_size_kb:
                # Reduce the quality if the compressed size is too large
                max_quality = quality
            else:
                # Increase the quality if the compressed size is too small
                min_quality = quality

            if last_quality == quality:
                break

            last_quality = quality

        img.save(output_path, 'JPEG', quality=quality)
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
            filename = secure_filename(file.filename)
            filename = filename.replace(' ', '_')
            # path = os.path.join(UPLOAD_FOLDER, filename)
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

        # if args.get('type') == 'single':
        #     filenames = args.get('filenames')
        #     format = args.get('format')
        #     limit = args.get('size')

        #     with zipfile.ZipFile(zip_filename, 'w') as zipf:
        #         for filename in filenames:
        #             filename = filename.lstrip('/')
        #             # output_file = os.path.join(COMPRESSED_FOLDER, f'{os.path.basename(filename).rsplit(".", 1)[0]}.{format}')
        #             output_file = ''.join([COMPRESSED_FOLDER, '/', f'{os.path.basename(filename).rsplit(".", 1)[0]}.{format}'])
        #             print(output_file)
        #             compress_image(filename, output_file, target_size_kb=int(limit))
        #             zipf.write(output_file, arcname=os.path.basename(output_file))
        #             files_to_clean.append(output_file)

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

                    compress_image(filename, output_file, target_size_kb=int(limit))
                    
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

