import requests
from dotenv import load_dotenv

load_dotenv()


def resolve_courses(codes: list[str]):
    res = requests.post("http://localhost:3001/api/courses/bulk", json=codes)
    return res.json()


# print(resolve_courses(["Csci2824"]))
