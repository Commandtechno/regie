from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional
import pathlib
import datetime
import json

from parse_audit.audit_to_markdown import parse_audit_json_to_markdown
from parse_audit.parse_degree_audit import parse_audit_pdf_to_json


class Class(BaseModel):
    code: str = Field(description="Name code of class. (Ex: MATH2001)")
    # name: str = Field(description="Name of class. (Ex: Introduction to Discrete Mathematics)")
    prerequisites: List[str] = Field(
        description="A list of classes that are prerequisites for this class."
    )
    priority: int = Field(
        description="Number 1-5 corresponding to how important the class is for the degree."
    )


class ClassList(BaseModel):
    class_list_name: str = Field(description="The name of the degree or program.")
    classes: List[Class] = Field(description="A list of classes to reccomend.")
    thoughts: str = Field(
        description="Comments describing the reasons for how the list was ordered."
    )


client = genai.Client()

# pdf_file_path = pathlib.Path(
#    "./audits/audit_2026-03-07_17_07_58.0_Sat_Mar_07_17_08_04_MST_2026.pdf"
# )

# json_file_path = pathlib.Path(parse_audit_pdf_to_json(pdf_file_path))

# markdown_file_path = pathlib.Path(parse_audit_json_to_markdown(json_file_path))

# credit_hours = 17


prompt = f"""
Please parse the markdown and return a list of classes that the user may be interested in taking.
The user would like to attend classes which advances their major.
They will do this by taking courses on their degree audit that they have not completed yet.
Return a list of the classes that fulfill the following:
- The user has fulfilled the prerequisites
- Has not been completed
- Is not 'in progress'
- On the degree audit for the major
For electives with multiple choices, prioritize courses based on their history and interests.
Prioritize classes that are prerequisites or directly required.
Make sure to return 5 core courses and 5 electives that fulfill alternate degree requirements.
"""


def create_recommended_class_list(file_id):
    st = datetime.datetime.now()
    print("start time: ", st)

    markdown_file_path = pathlib.Path(f"./documents/{file_id}.md")

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            types.Part.from_bytes(
                data=markdown_file_path.read_bytes(),
                mime_type="text/plain",
            ),
            prompt,
        ],
        config={
            "response_mime_type": "application/json",
            "response_json_schema": ClassList.model_json_schema(),
        },
    )

    class_list = ClassList.model_validate_json(response.text)

    json_data = class_list.model_dump()
    print(json.dumps(json_data, indent=4))

    et = datetime.datetime.now()
    print("end time: ", et)
    print("elapsed: ", et - st)

    return json_data


create_recommended_class_list("audit")
