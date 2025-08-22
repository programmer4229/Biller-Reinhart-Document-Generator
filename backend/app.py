from flask import Flask, request, send_file
from flask_cors import CORS
from docx import Document
import os
import tempfile

app = Flask(__name__)
CORS(app)

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")

def replace_text_in_paragraph(paragraph, replacements):
    full_text = ''.join(run.text for run in paragraph.runs)
    for key, value in replacements.items():
        full_text = full_text.replace(f"{{{{{key}}}}}", value)
    for run in paragraph.runs:
        run.text = ''
    if paragraph.runs:
        paragraph.runs[0].text = full_text
    else:
        paragraph.add_run(full_text)

def replace_text_in_table(table, replacements):
    for row in table.rows:
        for cell in row.cells:
            for paragraph in cell.paragraphs:
                replace_text_in_paragraph(paragraph, replacements)

def replace_text_in_header_footer(section, replacements):
    # Header
    for paragraph in section.header.paragraphs:
        replace_text_in_paragraph(paragraph, replacements)
    for table in section.header.tables:
        replace_text_in_table(table, replacements)

    # Footer (optional, if needed)
    for paragraph in section.footer.paragraphs:
        replace_text_in_paragraph(paragraph, replacements)
    for table in section.footer.tables:
        replace_text_in_table(table, replacements)

@app.route("/generate", methods=["POST"])
def generate_doc():
    template_name = request.form.get("template_name")
    template_path = os.path.join(TEMPLATE_DIR, template_name)

    if not os.path.exists(template_path):
        return {"error": "Template not found"}, 404

    doc = Document(template_path)
    replacements = {key: value for key, value in request.form.items() if key != "template_name"}

    # Main body
    for paragraph in doc.paragraphs:
        replace_text_in_paragraph(paragraph, replacements)
    for table in doc.tables:
        replace_text_in_table(table, replacements)

    # Headers/footers
    for section in doc.sections:
        replace_text_in_header_footer(section, replacements)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        doc.save(tmp.name)
        tmp_path = tmp.name

    return send_file(tmp_path, as_attachment=True, download_name="customized.docx")

if __name__ == "__main__":
    app.run(debug=True, port=5050)
