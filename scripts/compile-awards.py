#!/usr/bin/env python3
"""Compile a downloaded award PDF into the seven-heading record.

Reads each award's PDF text and extracts:
  1. TYPE OF DISMISSAL
  2. INDUSTRIAL COURT CASE NO
  3. BACKGROUND OF THE CASE
  4. CLAIMANT CASE
  5. COMPANY CASE
  6. COURT FINDINGS
  7. LEGAL SUMMARY
plus the Termination Index classification and Misconduct types.

The Malaysian Industrial Court awards follow a stable skeleton: the header
block (parties, case no, award no), "Background facts", the claimant's and
company's positions/evidence, "Evaluation of evidence and findings", and a
closing disposition. The extractor keys off those markers and heuristically
classifies dismissal type; when OPENROUTER_API_KEY or ANTHROPIC_API_KEY is
present it also asks the LLM to fill the seven headings precisely.

Usage:
    python3 scripts/compile-awards.py [--limit N] [--source corpus/awards-corpus.jsonl]
Writes corpus/compiled-awards.jsonl (one JSON record per award).
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

import dotenv  # optional; safe if missing

dotenv.load_dotenv(os.path.expanduser("~/.hermes/.env"))
dotenv.load_dotenv(os.path.expanduser("~/irassist/.env.local"))

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
LLM_MODEL = os.environ.get("IRASSIST_COMPILE_MODEL", "openai/gpt-4o-mini")

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "corpus")

TERMINATION_INDEX = [
    "Misconduct", "Poor Performance", "Breach of Contract/Fiduciary Duty",
    "Redundancy/Retrenchment", "Insubordination", "Negligence",
    "Poor Health/Incapacity", "Constructive Dismissal",
]
MISCONDUCT_TYPES = [
    "Theft, Fraud, Dishonesty", "Insubordination",
    "Fighting or Workplace Violence", "Sexual Harassment",
    "Absenteeism or Habitual Lateness",
]

# Award PDFs are written in all-caps headers with the case no and parties.
HEADER_RE = re.compile(
    r"CASE NO\.?\s*[:.]?\s*([0-9()A-Za-z/\-\.]+)|AWARD NO\.?\s*[:.]?\s*([0-9/\-]+)",
    re.I)

SECTION_MARKERS = {
    "background": re.compile(r"Background facts|The facts|Factual background", re.I),
    "claimant": re.compile(r"Claimant.?s case|Claimant.?s version|The Claimant.?s evidence", re.I),
    "company": re.compile(r"Company.?s case|The Company.?s evidence|Respondent.?s case", re.I),
    "findings": re.compile(r"Evaluation of evidence and findings|Findings of the Court|The findings", re.I),
    "summary": re.compile(r"Summary of findings|Summary|Conclusion|Disposition|Order", re.I),
}


def pdf_text(path: str) -> str:
    r = subprocess.run(["pdftotext", path, "-"], capture_output=True, text=True)
    return r.stdout


def find_section(text: str, marker_re, start=0):
    m = marker_re.search(text, start)
    return m.start() if m else None


def slice_section(text, start_marker, end_markers, search_from=0):
    """Return text between start marker and the next end marker."""
    s = find_section(text, start_marker, search_from)
    if s is None:
        return ""
    ends = [find_section(text, m, s + 1) for m in end_markers]
    ends = [e for e in ends if e is not None]
    e = min(ends) if ends else len(text)
    return text[s:e].strip()


def classify(text: str):
    """Termination-index + misconduct classification from the text.

    Priority order: the REFERENCE line states the dismissal grounds as a
    matter of law — constructive dismissal, misconduct, retrenchment etc.
    Only when the reference is silent do we fall back to keyword scanning,
    and a single keyword hit never overrides the reference's category.
    """
    low = text.lower()
    ref = text[:2500].lower()  # header + REFERENCE paragraph

    def ref_has(*pats):
        return any(re.search(p, ref) for p in pats)

    index = []
    if ref_has(r"constructive dismissal"):
        index = ["Constructive Dismissal"]
    elif ref_has(r"redundancy|retrenchment"):
        index = ["Redundancy/Retrenchment"]
    elif ref_has(r"poor performance|performance"):
        index = ["Poor Performance"]
    elif ref_has(r"misconduct|domestic inquiry|dishonest|fraud|theft|absentee|harass|violen"):
        index = ["Misconduct"]
    elif ref_has(r"breach of contract|wrongful dismissal"):
        index = ["Breach of Contract/Fiduciary Duty"]
    elif ref_has(r"insubordinat|refus(ed|ing) to (obey|comply)"):
        index = ["Insubordination"]
    elif ref_has(r"ill.?health|incapacit|medical"):
        index = ["Poor Health/Incapacity"]
    elif ref_has(r"negligence|negligent"):
        index = ["Negligence"]

    # secondary signals add to (never replace) the reference category
    signaled = []
    if re.search(r"misconduct|dishonest|fraud|theft|domestic inquiry", low):
        signaled.append("Misconduct")
    if re.search(r"poor performance|sub.?standard performance|incompetenc", low):
        signaled.append("Poor Performance")
    if re.search(r"redundan|retrench|surplus|restructur", low):
        signaled.append("Redundancy/Retrenchment")
    if re.search(r"breach of contract|repudiat", low):
        signaled.append("Breach of Contract/Fiduciary Duty")
    if re.search(r"ill.?health|incapacit|long.?term (sick|medi)", low):
        signaled.append("Poor Health/Incapacity")
    if re.search(r"negligence|negligent", low):
        signaled.append("Negligence")
    if re.search(r"insubordinat|refus(ed|ing) to (obey|comply|follow)", low):
        signaled.append("Insubordination")
    for s in signaled:
        if s not in index:
            index.append(s)

    if not index:
        index = ["Constructive Dismissal"] if re.search(r"20\(3\)|constructive", low) else ["Misconduct"]

    misconduct = []
    if "Misconduct" in index:
        for mt in MISCONDUCT_TYPES:
            key = mt.split(",")[0].lower()
            if key in low:
                misconduct.append(mt)
        if not misconduct:
            misconduct = ["Theft, Fraud, Dishonesty"]
    return index, misconduct


def llm_compile(text: str, rec: dict) -> dict:
    """Precise 7-heading compile via LLM. Falls back to heuristic on failure."""
    h = classify(text)
    if not OPENROUTER_KEY:
        return {"termination_index": h[0], "misconduct_types": h[1],
                "type_of_dismissal": h[0][0] if h[0] else "",
                "background_of_case": "", "claimant_case": "", "company_case": "",
                "court_findings": "", "legal_summary": "", "_llm": False}
    prompt = f"""You are compiling a Malaysian Industrial Court dismissal award into a fixed research template. Output JSON ONLY, no markdown.

Termination Index (pick 1+): {', '.join(TERMINATION_INDEX)}
Misconduct types (only if Misconduct selected): {', '.join(MISCONDUCT_TYPES)}

Compile this award into:
{{"termination_index": [...], "misconduct_types": [...], "type_of_dismissal": "...", "background_of_case": "...", "claimant_case": "...", "company_case": "...", "court_findings": "...", "legal_summary": "..."}}

Rules:
- type_of_dismissal exactly matches a Termination Index entry.
- Each prose field is a concise 2-4 sentence summary of THAT heading from the award text, precise and grammatical, in the award's own terms.
- If the award text lacks a section, still summarize the closest content; never invent case names or citations.
- background_of_case = context/facts leading to dismissal. claimant_case = the claimant's case/evidence. company_case = the company's case. court_findings = the Court's findings/ruling. legal_summary = the legal principles/outcome.

Award header: {rec.get('claimant','')} v {rec.get('respondent','')}, Case No {rec.get('case_no','')}, Award No {rec.get('award_no','')} ({rec.get('award_date','')}).

AWARD TEXT (trimmed):
{text[:14000]}"""
    body = json.dumps({
        "model": LLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "max_tokens": 1200,
    }).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=body,
        headers={"Authorization": f"Bearer {OPENROUTER_KEY}",
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.loads(r.read().decode())
        out = json.loads(data["choices"][0]["message"]["content"])
        base = h[0] if h[0] else ["Constructive Dismissal"]
        out["termination_index"] = [i for i in TERMINATION_INDEX
                                    if i in out.get("termination_index", [])] or base
        if "Misconduct" not in out["termination_index"]:
            out["misconduct_types"] = []
        else:
            out["misconduct_types"] = [m for m in MISCONDUCT_TYPES
                                       if m in out.get("misconduct_types", [])]
        out["_llm"] = True
        return out
    except Exception as e:
        return {**{"termination_index": h[0], "misconduct_types": h[1],
                   "type_of_dismissal": h[0][0] if h[0] else "",
                   "background_of_case": "", "claimant_case": "", "company_case": "",
                   "court_findings": "", "legal_summary": ""}, "_llm": False,
                "_llm_error": str(e)[:200]}


def compile_award(rec: dict, pdf_path: str, use_llm: bool = True) -> dict:
    text = pdf_text(pdf_path)
    if not text.strip():
        return {**rec, "error": "empty pdf text"}

    header = text[:1200]
    case_no = rec.get("case_no") or ""
    m = HEADER_RE.search(header)
    award_no = m.group(2) if m and m.group(2) else rec.get("award_no", "")
    # court branch appears in the award head ("IN THE INDUSTRIAL COURT OF
    # MALAYSIA / PERAK BRANCH" / "KUALA LUMPUR" etc.)
    court = ""
    for line in header.splitlines():
        s = line.strip().upper()
        if re.search(r"BRANCH|KUALA LUMPUR|PENANG|JOHOR|SELANGOR|SABAH|SARAWAK|MELAKA|NEGERI|PERAK|KELANTAN|TERENGGANU|PAHANG|PERLIS|KEDAH|LABUAN|PUTRAJAYA", s):
            court = re.sub(r"\s+", " ", s[:60])
            break

    # heuristic slices feed the fallback; LLM is the precise compiler
    idx, mtypes = classify(text)
    background = slice_section(text, SECTION_MARKERS["background"],
                               [SECTION_MARKERS["claimant"], SECTION_MARKERS["company"],
                                SECTION_MARKERS["findings"], SECTION_MARKERS["summary"]])
    claimant = slice_section(text, SECTION_MARKERS["claimant"],
                             [SECTION_MARKERS["company"], SECTION_MARKERS["findings"],
                              SECTION_MARKERS["summary"]])
    company = slice_section(text, SECTION_MARKERS["company"],
                            [SECTION_MARKERS["findings"], SECTION_MARKERS["summary"]])
    findings = slice_section(text, SECTION_MARKERS["findings"], [SECTION_MARKERS["summary"]])
    summary = slice_section(text, SECTION_MARKERS["summary"], [])

    llm = llm_compile(text, rec) if use_llm else {}

    def pick(field, fallback):
        v = (llm.get(field) or "").strip()
        return v if v else (fallback or "")[:4000]

    return {
        "award_no": award_no or rec.get("award_no", ""),
        "award_date": rec.get("award_date", ""),
        "case_no": case_no,
        "court": court,
        "claimant": rec.get("claimant", ""),
        "respondent": rec.get("respondent", ""),
        "termination_index": llm.get("termination_index") or (idx or ["Constructive Dismissal"]),
        "misconduct_types": llm.get("misconduct_types")
                            or (mtypes if "Misconduct" in (idx or []) else []),
        "type_of_dismissal": pick("type_of_dismissal", (idx or [""])[0] if idx else ""),
        "background_of_case": pick("background_of_case", background),
        "claimant_case": pick("claimant_case", claimant),
        "company_case": pick("company_case", company),
        "court_findings": pick("court_findings", findings),
        "legal_summary": pick("legal_summary", summary),
        "judgment_url": rec.get("pdf_url", ""),
        "_llm": llm.get("_llm", False),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=os.path.join(OUT, "awards-corpus.jsonl"))
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--no-llm", action="store_true",
                    help="skip the LLM precision pass (heuristic compile only) "
                         "— use when the LLM API is unreachable")
    a = ap.parse_args()

    out_path = os.path.join(OUT, "compiled-awards.jsonl")
    rows = [json.loads(l) for l in open(a.source, encoding="utf-8") if l.strip()]
    if a.limit:
        rows = rows[:a.limit]

    with open(out_path, "w", encoding="utf-8") as out:
        for i, rec in enumerate(rows):
            pdf = rec.get("pdf_path") or ""
            if not pdf or not os.path.exists(pdf):
                rec["error"] = "pdf not downloaded"
                out.write(json.dumps(rec) + "\n")
                continue
            if a.no_llm:
                compiled = compile_award(rec, pdf, use_llm=False)
            else:
                compiled = compile_award(rec, pdf)
            out.write(json.dumps(compiled, ensure_ascii=False) + "\n")
            if (i + 1) % 25 == 0:
                print(f"[compile] {i + 1}/{len(rows)}", file=sys.stderr)
    print(f"[compile] done → {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()