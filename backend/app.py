from flask import Flask, request, send_file
from flask_cors import CORS
from docx import Document
import os
import tempfile

app = Flask(__name__)
CORS(app, origins="http://localhost:5173")

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")

@app.route("/generate", methods=["POST"])
def generate_doc():
    template_name = request.form.get("template_name")
    template_path = os.path.join(TEMPLATE_DIR, template_name)

    if not os.path.exists(template_path):
        return {"error": "Template not found"}, 404

    doc = Document(template_path)

    for paragraph in doc.paragraphs:
        for key, value in request.form.items():
            if key == "template_name":
                continue
            if f"{{{{{key}}}}}" in paragraph.text:
                inline = paragraph.runs
                for i in range(len(inline)):
                    if f"{{{{{key}}}}}" in inline[i].text:
                        inline[i].text = inline[i].text.replace(f"{{{{{key}}}}}", value)

    # Handle tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for key, value in request.form.items():
                    if key == "template_name":
                        continue
                    if f"{{{{{key}}}}}" in cell.text:
                        cell.text = cell.text.replace(f"{{{{{key}}}}}", value)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        doc.save(tmp.name)
        tmp_path = tmp.name

    return send_file(tmp_path, as_attachment=True, download_name="customized.docx")

if __name__ == "__main__":
    app.run(debug=False, port=5050)