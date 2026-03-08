from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional
import pathlib
import datetime
import json

# from toon import encode

# input schema
# class: {
#   id: XIDX0000,
#   sections: {
#       number: // 001 002 etc
#       time: // start time and end time, probably a text fied
#       type: LEC, REC, LAB, ONLINE, etc
#    }
# }
# preference: { some text describing their preference } // optional
#
#


class Class(BaseModel):
    code: str = Field(description="Name code of class. (Ex: MATH2001)")
    section: str = Field(description="Section of the class. (Ex: 200)")


class Schedule(BaseModel):
    classes: List[Class] = Field(description="A list of classes to reccomend.")
    thoughts: str = Field(
        description="Comments describing the reasons for how the list was ordered."
    )


client = genai.Client()

# filepath = pathlib.Path(
#    "./audits/audit_2026-03-07_17_07_58.0_Sat_Mar_07_17_08_04_MST_2026.pdf"
# )

prompt = f"""
Take the input JSON file of specified classes and build a balanced schedule.
Every class has multiple sections. You must pick a section so there is no overlap with other classes.
Some classes have required recitation or lab sections. Include these in the final schedule.
The user also has a preference described in the preference field. Take the user's input into account when generating your response.
"""


def build_schedule(file_id):
    st = datetime.datetime.now()
    print("start time: ", st)

    filepath = pathlib.Path(f"./documents/{file_id}.md")

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            types.Part.from_bytes(
                data=filepath.read_bytes(),
                mime_type="application/json",
            ),
            prompt,
        ],
        config={
            "response_mime_type": "application/json",
            "response_json_schema": Schedule.model_json_schema(),
        },
    )

    class_list = Schedule.model_validate_json(response.text)
    print(class_list)

    et = datetime.datetime.now()
    print("end time: ", et)
    print("elapsed: ", et - st)

    return class_list
