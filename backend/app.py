from flask import Flask, request, send_file, send_from_directory, jsonify
from flask_cors import CORS
from docx import Document
import os
import tempfile


# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Define paths
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")

# Look for React build folder (created during deployment)
build_folder = None
current_dir = os.path.dirname(__file__)

# Possible build folder locations based on your structure
possible_build_paths = [
    os.path.join(current_dir, '..', 'frontend', 'build'),  # Most likely location
    os.path.join(current_dir, '..', 'frontend', 'dist'),   # Alternative build folder name
    os.path.join(current_dir, 'frontend', 'build'),
    os.path.join(current_dir, 'frontend', 'dist')
]

print(f"Current directory: {current_dir}")
print(f"Looking for build folder...")

for path in possible_build_paths:
    abs_path = os.path.abspath(path)
    print(f"Checking: {abs_path}")
    if os.path.exists(abs_path):
        build_folder = abs_path
        print(f"✅ Found React build folder at: {build_folder}")
        break
    else:
        print(f"❌ Not found: {abs_path}")

if build_folder is None:
    print("⚠️  No React build folder found!")
    print("Current working directory contents:")
    try:
        for item in os.listdir('.'):
            print(f"  - {item}")
    except:
        pass

# Configure Flask static folder if build exists
if build_folder and os.path.exists(os.path.join(build_folder, 'index.html')):
    app.static_folder = build_folder
    app.static_url_path = '/'
    print(f"✅ Flask configured to serve static files from: {build_folder}")
else:
    print("⚠️  Flask running in API-only mode (no static files)")

# Routes
# Replace with your own strong password
CORRECT_PASSWORD = "BillerReinhart"

@app.route("/auth", methods=["POST"])
def auth():
    data = request.get_json()
    if data and data.get("password") == CORRECT_PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False})

@app.route('/health')
def health():
    return {
        "status": "Backend is running",
        "build_folder": build_folder,
        "build_folder_exists": build_folder is not None and os.path.exists(build_folder) if build_folder else False,
        "current_dir": os.getcwd(),
        "templates_dir": TEMPLATE_DIR,
        "templates_exist": os.path.exists(TEMPLATE_DIR)
    }

@app.route('/')
def serve_react():
    if build_folder and os.path.exists(os.path.join(build_folder, 'index.html')):
        return send_from_directory(build_folder, 'index.html')
    else:
        return """
        <h1>React App Not Built Yet</h1>
        <p>The React build folder was not found. This usually means:</p>
        <ul>
            <li>The React build process failed during deployment</li>
            <li>The build command in Render settings is incorrect</li>
        </ul>
        <p><a href="/health">Check health status</a></p>
        <p>Your API is working though! Try <a href="/health">/health</a></p>
        """

@app.route('/<path:path>')
def serve_static_files(path):
    if build_folder and os.path.exists(build_folder):
        file_path = os.path.join(build_folder, path)
        if os.path.exists(file_path):
            return send_from_directory(build_folder, path)
        else:
            # Fall back to index.html for React routing
            if os.path.exists(os.path.join(build_folder, 'index.html')):
                return send_from_directory(build_folder, 'index.html')
    
    return f"File not found: {path}", 404

# Document generation helper functions
def has_placeholders(text, replacements):
    """Check if text contains any placeholder tags that need replacement"""
    for key in replacements.keys():
        if f"{{{{{key}}}}}" in text:
            return True
    return False

def replace_text_in_paragraph(paragraph, replacements):
    """Only replace text if placeholders are found"""
    full_text = ''.join(run.text for run in paragraph.runs)
    
    if not has_placeholders(full_text, replacements):
        return
    
    for key, value in replacements.items():
        full_text = full_text.replace(f"{{{{{key}}}}}", value)
    
    for run in paragraph.runs:
        run.text = ''
    if paragraph.runs:
        paragraph.runs[0].text = full_text
    else:
        paragraph.add_run(full_text)

def replace_text_in_table(table, replacements):
    """Only replace text in table cells if placeholders are found"""
    for row in table.rows:
        for cell in row.cells:
            for paragraph in cell.paragraphs:
                replace_text_in_paragraph(paragraph, replacements)

def replace_text_in_header_footer(section, replacements):
    """Preserve header/footer formatting by only replacing when necessary"""
    for paragraph in section.header.paragraphs:
        replace_text_in_paragraph(paragraph, replacements)
    
    for table in section.header.tables:
        replace_text_in_table(table, replacements)

    for paragraph in section.footer.paragraphs:
        replace_text_in_paragraph(paragraph, replacements)
    
    for table in section.footer.tables:
        replace_text_in_table(table, replacements)

@app.route("/generate", methods=["POST"])
def generate_doc():
    try:
        template_name = request.form.get("template_name")
        if not template_name:
            return {"error": "No template name provided"}, 400
            
        template_path = os.path.join(TEMPLATE_DIR, template_name)
        print(f"Looking for template: {template_path}")

        if not os.path.exists(template_path):
            print(f"Template not found: {template_path}")
            print(f"Templates directory contents: {os.listdir(TEMPLATE_DIR) if os.path.exists(TEMPLATE_DIR) else 'Directory not found'}")
            return {"error": f"Template not found: {template_name}"}, 404

        doc = Document(template_path)
        replacements = {key: value for key, value in request.form.items() if key != "template_name"}
        print(f"Replacements: {list(replacements.keys())}")

        # Replace text in document
        for paragraph in doc.paragraphs:
            replace_text_in_paragraph(paragraph, replacements)
        
        for table in doc.tables:
            replace_text_in_table(table, replacements)

        for section in doc.sections:
            replace_text_in_header_footer(section, replacements)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
            doc.save(tmp.name)
            tmp_path = tmp.name

        return send_file(tmp_path, as_attachment=True, download_name="customized.docx")
    
    except Exception as e:
        print(f"Error in generate_doc: {str(e)}")
        return {"error": str(e)}, 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"🚀 Starting Flask app on port {port}")
    print(f"📁 Templates directory: {TEMPLATE_DIR}")
    print(f"🌐 Build folder: {build_folder or 'Not found'}")
    app.run(debug=False, host="0.0.0.0", port=port)
