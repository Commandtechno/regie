import requests
from dotenv import load_dotenv
import json

load_dotenv()

import re


def normalize_code(code):
    pattern = re.compile(r"(?P<department>[a-zA-Z]+)\s*(?P<courseNumber>\d+)")
    if not isinstance(code, str):
        return

    match = pattern.search(code)
    if not match:
        return

    department = match.group("department")
    course_number = match.group("courseNumber")

    if not department or not course_number:
        return

    return f"{department.upper()} {course_number}"


def resolve_courses(codes: list[str]):
    res = requests.post("http://localhost:3001/api/courses/bulk", json=codes).json()
    courses = {}
    for course in res:
        courses[course["code"]] = course
    return courses


# print(json.dumps(resolve_courses(["Csci2824"]), indent=2))
