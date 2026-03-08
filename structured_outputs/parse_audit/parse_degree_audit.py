"""
Degree Audit PDF Parser
Parses CU Boulder (and similar) degree audit PDFs into structured JSON format.

Usage:
    python parse_degree_audit.py <path_to_audit.pdf>
    python parse_degree_audit.py <path_to_audit.pdf> --output audit.json

Requirements:
    pip install pdfplumber
"""

import re
import json
import sys
import argparse
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Missing dependency. Run: pip install pdfplumber")
    sys.exit(1)


# ─── Helpers ──────────────────────────────────────────────────────────────────

GRADE_PATTERN = re.compile(
    r'^(FA|SP|SU)(\d{2})\s+'           # term
    r'([A-Z]{2,6}\d{3,4}[A-Z]?)\s+'   # course code
    r'(\d+\.\d)\s+'                     # credits
    r'(\*{3}|[A-Z][A-Z+-]?|NR|TA)\s+'  # grade
    r'(.+)$'                            # title
)

TRANSFER_LINE = re.compile(r'CO-CCU:\s*(\S+)')

HOURS_GPA_LINE = re.compile(
    r'(\d+\.\d)\s*HOURS\s+ATTEMPTED\s+(\d+\.\d)\s*POINTS\s+(\d+\.\d{3})\s*GPA'
)

EARNED_LINE = re.compile(r'EARNED:\s*(\d+\.\d)\s*HOURS')
IN_PROGRESS_LINE = re.compile(r'IN PROGRESS\s+(\d+\.\d)\s*HOURS')

SECTION_HEADER = re.compile(
    r'^(==?.+?==?|[A-Z][A-Za-z &/\-]+(?:Requirement|Requirements|History|Courses?|Electives?|Rqrmnt))',
    re.IGNORECASE
)

STATUS_LINE = re.compile(r'^(OK|NO|\+)\s*$')
NEEDS_LINE  = re.compile(r'NEEDS:\s*(\d+\.\d)\s*HOURS')
ADDED_LINE  = re.compile(r'(\d+\.\d)\s*HOURS\s+ADDED')
IN_P_LINE   = re.compile(r'IN-P\s*--->\s*(\d+\.\d)\s*HOURS')
GPA_LINE    = re.compile(r'^(\d+\.\d{3})\s*GPA\s*$')


def parse_term(term_str: str) -> dict:
    """Convert 'FA25' -> {'semester': 'FA', 'year': 2025}"""
    sem = term_str[:2]
    yr  = int(term_str[2:]) + 2000
    return {"semester": sem, "year": yr}


def make_course(m: re.Match, transfer_equiv: str | None = None) -> dict:
    term_raw, course, credits, grade, title = (
        m.group(1) + m.group(2), m.group(3),
        float(m.group(4)), m.group(5), m.group(6).strip()
    )
    in_progress = grade == "***"
    transfer     = grade.startswith("T") or (transfer_equiv is not None)

    c = {
        "term": term_raw,
        **parse_term(term_raw),
        "course_code": course,
        "credits": credits,
        "grade": None if in_progress else grade,
        "title": title,
        "in_progress": in_progress,
        "transfer": transfer,
    }
    if transfer_equiv:
        c["transfer_equivalent"] = transfer_equiv
    return c


# ─── Main parser ──────────────────────────────────────────────────────────────

def parse_audit(pdf_path: str) -> dict:
    with pdfplumber.open(pdf_path) as pdf:
        pages_text = [p.extract_text() or "" for p in pdf.pages]

    full_text = "\n".join(pages_text)
    lines = [l.rstrip() for l in full_text.splitlines()]

    audit = {
        "student": {},
        "program": {},
        "overall": {},
        "requirements": [],
        "coursework_history": {
            "terms": {},
            "transfer_credits": [],
        },
        "raw_notes": [],
    }

    # ── Header info (page 1) ──────────────────────────────────────────────────
    for line in lines[:40]:
        if "Admission Term" in line:
            m = re.search(r'Admission Term\s+(\S+)\s*-\s*Catalog Year\s+(\S+)', line)
            if m:
                audit["program"]["admission_term"]  = m.group(1)
                audit["program"]["catalog_year"]    = m.group(2)

        if "Bachelor of" in line or "Master of" in line:
            audit["program"]["degree_name"] = line.strip()

        if "College of" in line and "degree_name" in audit["program"]:
            audit["program"]["college"] = line.strip()

        if re.match(r'^\s*\d{9}\s*$', line):
            audit["student"]["id"] = line.strip()

        m = re.search(r'CATALOG YEAR:\s*(\S+)', line)
        if m:
            audit["program"]["catalog_year"] = m.group(1)

        m = re.search(r'PREPARED:\s*(.+)', line)
        if m:
            audit["program"]["prepared_date"] = m.group(1).strip()

        # "Asher, Akhil"  – name line right before "REQUESTED:"
        m = re.search(r'^([A-Z][a-z]+,\s+[A-Z][a-zA-Z]+)\s*$', line)
        if m:
            audit["student"]["name"] = m.group(1)

        m = re.search(r'REQUESTED:\s*(\S+)', line)
        if m:
            audit["program"]["requested_program"] = m.group(1)

        m = re.search(r'Program:\s*(.+)', line)
        if m:
            audit["program"]["program_codes"] = [p.strip() for p in m.group(1).split(",")]

    # ── Overall hours / GPA ───────────────────────────────────────────────────
    for line in lines:
        m = HOURS_GPA_LINE.search(line)
        if m:
            audit["overall"]["attempted_hours"] = float(m.group(1))
            audit["overall"]["quality_points"]  = float(m.group(2))
            audit["overall"]["gpa"]             = float(m.group(3))

        m = EARNED_LINE.search(line)
        if m:
            audit["overall"]["earned_hours"] = float(m.group(1))

        m = IN_PROGRESS_LINE.search(line)
        if m:
            audit["overall"]["in_progress_hours"] = float(m.group(1))

        if "AT LEAST ONE REQUIREMENT HAS NOT BEEN SATISFIED" in line:
            audit["overall"]["all_requirements_met"] = False
        if "ALL REQUIREMENTS HAVE BEEN SATISFIED" in line:
            audit["overall"]["all_requirements_met"] = True

    if "all_requirements_met" not in audit["overall"]:
        audit["overall"]["all_requirements_met"] = None

    # ── Requirements + courses ────────────────────────────────────────────────
    current_req: dict | None = None
    current_sub: dict | None = None
    i = 0

    def flush_sub():
        nonlocal current_sub
        if current_sub and current_req is not None:
            current_req["sub_requirements"].append(current_sub)
            current_sub = None

    def flush_req():
        nonlocal current_req
        flush_sub()
        if current_req is not None:
            audit["requirements"].append(current_req)
            current_req = None

    COURSEWORK_SECTION_MARKERS = {
        "Coursework History",
        "Other Coursework Not Applied",
        "Courserwork Not Applied above",  # typo in the original
        "Course Not Applied",
    }

    in_coursework_history = False

    while i < len(lines):
        line = lines[i]

        # ── Transition to coursework history section ──────────────────────────
        if any(m in line for m in COURSEWORK_SECTION_MARKERS):
            in_coursework_history = True
            flush_req()
            i += 1
            continue

        # ── Coursework history parsing ────────────────────────────────────────
        if in_coursework_history:
            m = GRADE_PATTERN.match(line)
            if m:
                course = make_course(m)
                # peek for transfer equiv
                if i + 1 < len(lines):
                    tm = TRANSFER_LINE.match(lines[i + 1].strip())
                    if tm:
                        course["transfer_equivalent"] = tm.group(1)
                        i += 1
                term_key = course["term"]
                if course.get("transfer"):
                    audit["coursework_history"]["transfer_credits"].append(course)
                else:
                    audit["coursework_history"]["terms"].setdefault(term_key, []).append(course)
            i += 1
            continue

        # ── Requirement section headers ───────────────────────────────────────
        # Detect named requirement sections by keyword patterns
        req_header_patterns = [
            r'^(General Education .+)',
            r'^(Computer Science .+)',
            r'^(Free Electives.*)',
            r'^(Additional Area of Study.*)',
            r'^(University of Colorado Boulder .+)',
            r'^(Overall Credit Hour.*)',
            r'^(Writing Requirements.*)',
        ]
        matched_header = None
        for pat in req_header_patterns:
            hm = re.match(pat, line)
            if hm:
                matched_header = hm.group(1).strip()
                break

        if matched_header:
            flush_req()
            current_req = {
                "name": matched_header,
                "status": None,
                "min_grade": None,
                "sub_requirements": [],
                "courses": [],
                "notes": [],
            }
            # Check for "All courses must be completed with X or better"
            if i + 1 < len(lines):
                gm = re.search(r'All courses must be completed with (.+?) or better', lines[i + 1])
                if gm:
                    current_req["min_grade"] = gm.group(1).strip()
            i += 1
            continue

        # ── Status (OK / NO / +) ──────────────────────────────────────────────
        sm = STATUS_LINE.match(line)
        if sm and current_req is not None:
            status_val = sm.group(1)
            if current_sub is not None:
                current_sub["status"] = status_val
            else:
                current_req["status"] = status_val
            i += 1
            continue

        # ── Sub-requirement "Complete X" lines ────────────────────────────────
        complete_m = re.match(r'^[+-]?\s*(Complete .+|SELECT FROM:.+)', line)
        if complete_m and current_req is not None:
            flush_sub()
            current_sub = {
                "description": complete_m.group(1).strip(),
                "status": None,
                "courses": [],
                "hours_needed": None,
                "hours_in_progress": None,
            }
            i += 1
            continue

        # ── NEEDS / ADDED / IN-P ──────────────────────────────────────────────
        nm = NEEDS_LINE.search(line)
        if nm and current_req is not None:
            target = current_sub if current_sub else current_req
            target["hours_needed"] = float(nm.group(1))
            i += 1
            continue

        am = ADDED_LINE.search(line)
        if am and current_req is not None:
            target = current_sub if current_sub else current_req
            target.setdefault("hours_added", float(am.group(1)))
            i += 1
            continue

        ip = IN_P_LINE.search(line)
        if ip and current_req is not None:
            target = current_sub if current_sub else current_req
            target["hours_in_progress"] = float(ip.group(1))
            i += 1
            continue

        # ── GPA line inside a requirement ─────────────────────────────────────
        gm = GPA_LINE.match(line)
        if gm and current_req is not None:
            target = current_sub if current_sub else current_req
            target["gpa"] = float(gm.group(1))
            i += 1
            continue

        # ── Course lines ──────────────────────────────────────────────────────
        cm = GRADE_PATTERN.match(line)
        if cm and current_req is not None:
            course = make_course(cm)
            # peek for transfer equiv
            if i + 1 < len(lines):
                tm = TRANSFER_LINE.match(lines[i + 1].strip())
                if tm:
                    course["transfer_equivalent"] = tm.group(1)
                    i += 1
            target = current_sub if current_sub else current_req
            target["courses"].append(course)
            i += 1
            continue

        i += 1

    flush_req()

    # ── Compute a quick summary ───────────────────────────────────────────────
    all_courses: list[dict] = []
    for term_courses in audit["coursework_history"]["terms"].values():
        all_courses.extend(term_courses)
    all_courses.extend(audit["coursework_history"]["transfer_credits"])

    completed = [c for c in all_courses if not c["in_progress"] and c["grade"] not in (None,)]
    in_prog   = [c for c in all_courses if c["in_progress"]]

    audit["summary"] = {
        "total_courses_completed": len(completed),
        "total_courses_in_progress": len(in_prog),
        "total_credits_completed": sum(c["credits"] for c in completed),
        "total_credits_in_progress": sum(c["credits"] for c in in_prog),
        "requirements_total": len(audit["requirements"]),
        "requirements_met": sum(1 for r in audit["requirements"] if r["status"] in ("+", "OK")),
        "requirements_not_met": sum(1 for r in audit["requirements"] if r["status"] == "NO"),
    }

    return audit


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_audit_pdf_to_json(pdf_file, out_file="./audits/audit.json"):
    #parser = argparse.ArgumentParser(description="Parse a CU-style degree audit PDF into JSON.")
    #parser.add_argument("pdf", help="Path to the degree audit PDF")
    #parser.add_argument("--output", "-o", default=None,
    #                    help="Output JSON file path (default: print to stdout)")
    #parser.add_argument("--indent", type=int, default=2,
    #                    help="JSON indent level (default: 2)")
    #args = parser.parse_args()

    pdf_path = Path(pdf_file)
    if not pdf_path.exists():
        print(f"Error: file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Parsing {pdf_path.name} ...", file=sys.stderr)
    result = parse_audit(str(pdf_path))

    output_json = json.dumps(result, indent=2, ensure_ascii=False)

    if out_file:
        Path(out_file).write_text(output_json, encoding="utf-8")
        print(f"Saved to {out_file}", file=sys.stderr)
    else:
        print(output_json)
    
    return out_file