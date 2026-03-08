from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional
import pathlib
import datetime
import json

class Class(BaseModel):
    code: str = Field(description="Name code of class. (Ex: MATH2001)")
    # name: str = Field(description="Name of class. (Ex: Introduction to Discrete Mathematics)")
    prerequisites: List[str] = Field(description="A list of classes that are prerequisites for this class.")
    credit_hours: int = Field(description="Credit hours for the class.")
    priority: int = Field(description="Number 1-5 corresponding to how important the class is for the degree.")

class ClassList(BaseModel):
    class_list_name: str = Field(description="The name of the degree or program.")
    classes: List[Class] = Field(description="A list of classes to reccomend.")
    thoughts: str = Field(description="Comments describing the reasons for how the list was ordered.")


client = genai.Client()

filepath = pathlib.Path('./audits/audit.md')

credit_hours = 17



prompt = f"""
Please extract the entire degree audit in the PDF.
The user would like to attend classes which advances their major.
This means taking mostly classes in the core sections aligning with their major.
They will do this by taking courses on their degree audit that they have not completed yet.
Return a list of the classes that fulfill the following:
- The user has fulfilled the prerequisites
- Has not been completed
- Is not 'in progress'
- On the degree audit for the major
For electives with multiple choices, prioritize courses based on their history and interests.
Do not reccomend multiple classes that fulfill the same requirements.
Prioritize classes that are prerequisites or directly required.
Important: making sure balance the schedule between core and electives.
"""

st = datetime.datetime.now()
print("start time: ", st)

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=[
        types.Part.from_bytes(
            data=filepath.read_bytes(),
            mime_type='text/plain',
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