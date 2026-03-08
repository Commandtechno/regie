# server
from secrets import token_hex
from flask import Flask, request
from util import resolve_courses


from parse_audit.audit_to_markdown import parse_audit_json_to_markdown
from parse_audit.parse_degree_audit import parse_audit_pdf_to_json
from pathlib import Path
import os

import util


from get_recommended_courses import create_recommended_class_list

# from schedule_builder import build_schedule

app = Flask(__name__)


def generate_id():
    return token_hex(16)


@app.route("/ai/uploadPdf", methods=["POST"])
def upload_pdf():
    pdf = request.files.get("pdf")

    file_id = generate_id()

    pdf_file_name = f"./documents/{file_id}.pdf"
    pdf.save(pdf_file_name)

    pdf_file_path = Path(pdf_file_name)
    json_file_path = Path(
        parse_audit_pdf_to_json(pdf_file_path, f"./documents/{file_id}.json")
    )
    markdown_file_path = Path(
        parse_audit_json_to_markdown(json_file_path, f"./documents/{file_id}.md")
    )

    os.remove(pdf_file_name)
    os.remove(json_file_path)

    return {"id": file_id}


@app.route("/ai/getRecommendedCourses", methods=["POST"])
def getRecommendedCourses():
    req_data = request.get_json()
    file_id = req_data["file_id"]

    json = create_recommended_class_list(file_id)

    normalized_codes: dict[str, str] = {}
    for c in json["classes"]:
        normalized_codes[c["code"]] = util.normalize_code(c["code"])

    print("course ids: ", normalized_codes.values())

    resolved_courses = util.resolve_courses(list(normalized_codes.values()))
    new_classes = []
    for c in json["classes"]:
        key = normalized_codes[c["code"]]
        if key in resolved_courses:
            c["courses"] = resolved_courses[key]
            new_classes.append(
                {
                    "code": c["code"],
                    "priority": c["priority"],
                    "prerequisites": c["prerequisites"],
                    "courses": resolved_courses[key],
                }
            )

    json["classes"] = new_classes
    return json


# @app.route("/ai/buildSchedule", methods=["GET"])
# def getRecommendedSchedule():
#    req_data = request.get_json()
#    file_id = req_data["file_id"]
#
#    json = build_schedule(file_id)
#    return json
#
#
app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
