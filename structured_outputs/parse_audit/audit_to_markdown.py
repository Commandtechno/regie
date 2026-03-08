"""
Degree Audit JSON → LLM-friendly Markdown
Converts the structured JSON from parse_degree_audit.py into clean markdown
optimized for LLM context windows (deduplicated, scannable, token-efficient).

Usage:
    python audit_to_markdown.py audit_parsed.json
    python audit_to_markdown.py audit_parsed.json --output audit.md
"""

import json
import sys
import argparse
from pathlib import Path
from collections import OrderedDict


def fmt_course_row(c: dict) -> str:
    status = "⏳ IN PROGRESS" if c["in_progress"] else f"✓ {c['grade']}"
    xfer   = f" [transfer ← {c['transfer_equivalent']}]" if c.get("transfer_equivalent") else \
             (" [transfer]" if c.get("transfer") else "")
    return f"| {c['term']} | {c['course_code']} | {c['title']} | {c['credits']} | {status}{xfer} |"


def dedup_courses(courses: list[dict]) -> list[dict]:
    seen = set()
    out  = []
    for c in courses:
        key = (c["course_code"], c["term"])
        if key not in seen:
            seen.add(key)
            out.append(c)
    return out


def course_table(courses: list[dict], indent: str = "") -> list[str]:
    if not courses:
        return []
    lines = [
        f"{indent}| Term | Course | Title | Credits | Grade |",
        f"{indent}|------|--------|-------|---------|-------|",
    ]
    for c in dedup_courses(courses):
        lines.append(indent + fmt_course_row(c))
    return lines


def render(audit: dict) -> str:
    lines: list[str] = []
    s = audit.get("student", {})
    p = audit.get("program", {})
    o = audit.get("overall", {})
    summary = audit.get("summary", {})

    # ── Header ────────────────────────────────────────────────────────────────
    lines += [
        f"# Degree Audit — {s.get('name', 'Unknown Student')}",
        "",
        "## Student & Program",
        "",
        f"- **Name:** {s.get('name', 'N/A')}",
        f"- **Degree:** {p.get('degree_name', 'N/A')}",
        f"- **College:** {p.get('college', 'N/A')}",
        f"- **Catalog Year:** {p.get('catalog_year', 'N/A')}",
        f"- **Admission Term:** {p.get('admission_term', 'N/A')}",
        f"- **Program Codes:** {', '.join(p.get('program_codes', []))}",
        f"- **Audit Prepared:** {p.get('prepared_date', 'N/A')}",
        "",
    ]

    # ── Progress snapshot ─────────────────────────────────────────────────────
    all_req_met = o.get("all_requirements_met")
    req_status  = "✅ ALL MET" if all_req_met else ("❌ NOT ALL MET" if all_req_met is False else "Unknown")
    lines += [
        "## Overall Progress",
        "",
        f"| | |",
        f"|---|---|",
        f"| Credits Earned | {o.get('earned_hours', '?')} |",
        f"| Credits In Progress | {o.get('in_progress_hours', '?')} |",
        f"| Credits Needed (total) | 120 |",
        f"| Cumulative GPA | {o.get('gpa', '?')} |",
        f"| Requirements Status | {req_status} |",
        f"| Courses Completed | {summary.get('total_courses_completed', '?')} |",
        f"| Courses In Progress | {summary.get('total_courses_in_progress', '?')} |",
        "",
    ]

    # ── Coursework history ────────────────────────────────────────────────────
    lines += ["## Coursework History", ""]

    history = audit.get("coursework_history", {})

    # Sort terms chronologically
    def term_sort_key(t):
        sem_order = {"FA": 2, "SP": 0, "SU": 1}
        sem, yr = t[:2], int(t[2:]) + 2000
        return (yr, sem_order.get(sem, 9))

    sorted_terms = sorted(history.get("terms", {}).keys(), key=term_sort_key)

    for term in sorted_terms:
        courses = dedup_courses(history["terms"][term])
        sem_label = {"FA": "Fall", "SP": "Spring", "SU": "Summer"}.get(term[:2], term[:2])
        yr = int(term[2:]) + 2000
        ip_flag = " *(in progress)*" if any(c["in_progress"] for c in courses) else ""
        lines.append(f"### {sem_label} {yr}{ip_flag}")
        lines.append("")
        lines += course_table(courses)
        lines.append("")

    xfer = dedup_courses(history.get("transfer_credits", []))
    if xfer:
        lines += ["### Transfer Credits", ""]
        lines += course_table(xfer)
        lines += [""]

    # ── Requirements ──────────────────────────────────────────────────────────
    lines += ["## Degree Requirements", ""]

    # Collect unique sub-requirements across all requirement blocks, keyed by description
    # to avoid the duplication problem in the raw JSON
    seen_subs: set[str] = set()

    for req in audit.get("requirements", []):
        name   = req.get("name", "Unnamed Requirement")
        status = req.get("status")
        status_icon = {"OK": "✅", "+": "✅", "NO": "❌"}.get(status, "⚪") if status else "⚪"
        min_g  = req.get("min_grade")
        gpa    = req.get("gpa")
        h_need = req.get("hours_needed")
        h_add  = req.get("hours_added")
        h_ip   = req.get("hours_in_progress")

        lines.append(f"### {status_icon} {name}")
        lines.append("")

        meta = []
        if min_g:   meta.append(f"Minimum grade: **{min_g}**")
        if gpa:     meta.append(f"GPA in this area: **{gpa}**")
        if h_need:  meta.append(f"Hours still needed: **{h_need}**")
        if h_add:   meta.append(f"Hours applied: **{h_add}**")
        if h_ip:    meta.append(f"Hours in progress: **{h_ip}**")
        if meta:
            lines.append("  " + " · ".join(meta))
            lines.append("")

        # Top-level courses for this requirement (skip if all shown in subs)
        top_courses = dedup_courses(req.get("courses", []))
        if top_courses and not req.get("sub_requirements"):
            lines += course_table(top_courses, indent="")
            lines.append("")

        # Sub-requirements
        for sub in req.get("sub_requirements", []):
            desc = sub.get("description", "").strip()
            if not desc or desc in seen_subs:
                continue
            seen_subs.add(desc)

            sub_status = sub.get("status")
            sub_icon   = {"OK": "✅", "+": "✅", "NO": "❌"}.get(sub_status, "⚪") if sub_status else "⚪"
            sub_h_need = sub.get("hours_needed")
            sub_h_ip   = sub.get("hours_in_progress")
            sub_h_add  = sub.get("hours_added")
            sub_gpa    = sub.get("gpa")

            lines.append(f"#### {sub_icon} {desc}")
            lines.append("")

            sub_meta = []
            if sub_gpa:   sub_meta.append(f"GPA: **{sub_gpa}**")
            if sub_h_need: sub_meta.append(f"Hours still needed: **{sub_h_need}**")
            if sub_h_add:  sub_meta.append(f"Hours applied: **{sub_h_add}**")
            if sub_h_ip:   sub_meta.append(f"Hours in progress: **{sub_h_ip}**")
            if sub_meta:
                lines.append("  " + " · ".join(sub_meta))
                lines.append("")

            sub_courses = dedup_courses(sub.get("courses", []))
            if sub_courses:
                lines += course_table(sub_courses, indent="")
                lines.append("")

    # ── What's still missing (quick reference) ───────────────────────────────
    lines += ["## Still Needed — Quick Reference", ""]
    lines += [
        "> This section summarises unfulfilled sub-requirements at a glance.",
        "",
    ]

    found_any = False
    seen_needed: set[str] = set()
    for req in audit.get("requirements", []):
        for sub in req.get("sub_requirements", []):
            desc = sub.get("description", "").strip()
            h_need = sub.get("hours_needed")
            sub_courses = dedup_courses(sub.get("courses", []))
            # Show if empty (not yet started) or has explicit hours_needed
            if desc and desc not in seen_needed and (not sub_courses or h_need):
                seen_needed.add(desc)
                h_label = f" — **{h_need} hrs still needed**" if h_need else ""
                lines.append(f"- {desc}{h_label}")
                found_any = True

    if not found_any:
        lines.append("- *(No unfulfilled sub-requirements detected)*")

    lines += ["", "---", f"*Audit prepared: {p.get('prepared_date', 'N/A')}*", ""]

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Convert parsed audit JSON to LLM-friendly markdown.")
    parser.add_argument("json_file", help="Path to audit_parsed.json")
    parser.add_argument("--output", "-o", default=None, help="Output .md file (default: stdout)")
    args = parser.parse_args()

    data = json.loads(Path(args.json_file).read_text())
    md   = render(data)

    if args.output:
        Path(args.output).write_text(md, encoding="utf-8")
        print(f"Saved → {args.output}", file=sys.stderr)
    else:
        print(md)


if __name__ == "__main__":
    main()
