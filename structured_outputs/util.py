import requests
from dotenv import load_dotenv
from collections import defaultdict

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
    courses = defaultdict(list)
    for course in res:
        courses[course["code"]].append(course)
    return courses


# print(json.dumps(resolve_courses(["ARSC 1080"]), indent=2))
