from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from docxtpl import DocxTemplate
import os
import io
import datetime

app = Flask(__name__)
CORS(app)

# Path to the templates folder inside backend/
TEMPLATE_FOLDER = os.path.join(os.path.dirname(__file__), "templates")

@app.route("/generate", methods=["POST"])
def generate_document():
    try:
        data = request.json
        template_name = data.get("template")

        if not template_name:
            return jsonify({"error": "Template name not provided"}), 400

        # Build path to .docx template file
        template_path = os.path.join(TEMPLATE_FOLDER, template_name)

        if not os.path.exists(template_path):
            return jsonify({"error": f"Template {template_name} not found"}), 404

        # Load the template
        doc = DocxTemplate(template_path)

        # Format any date fields from string to datetime.date
        context = {}
        for key, value in data.items():
            if isinstance(value, str) and key.lower().endswith("date"):
                try:
                    context[key] = datetime.datetime.strptime(value, "%Y-%m-%d").date()
                except ValueError:
                    context[key] = value  # leave as-is if parse fails
            else:
                context[key] = value

        # Render the document
        doc.render(context)

        # Save to in-memory file
        output_stream = io.BytesIO()
        doc.save(output_stream)
        output_stream.seek(0)

        # Filename to download
        output_filename = f"generated_{template_name}"

        return send_file(
            output_stream,
            as_attachment=True,
            download_name=output_filename,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)
