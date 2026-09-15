#!/usr/bin/env python3
"""Generate src/lib/data/awards.ts from corpus/compiled-awards.jsonl.

Maps the compiled seven-heading record onto the Award domain model:
  typeOfDismissal, caseNo, backgroundOfCase, claimantCase, companyCase,
  courtFindings, legalSummary — the headings a detail view must render in
  exact order. Fields the compiler could not populate are left empty rather
  than invented.

Usage:
    python3 scripts/gen-awards-seed.py [--limit N] [--source corpus/compiled-awards.jsonl]
"""

import argparse
import json
import os
import re

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "lib", "data")


def outcome_from(text: str) -> str:
    low = (text or "").lower()
    if re.search(r"reinstat", low):
        return "Reinstatement ordered"
    if re.search(r"reduced|reduced to|dismissal reduced|set aside", low):
        return "Dismissal reduced / set aside"
    if re.search(r"compensation|damages.*awarded|award.*compensation", low):
        return "Compensation awarded"
    if re.search(r"dismissal upheld|dismissed.*unfair|claim.*dismissed|not unfair", low):
        return "Dismissal upheld"
    return ""


def bullets(text: str, n: int = 3) -> list[str]:
    if not text:
        return []
    parts = [s.strip() for s in re.split(r"(?<=[.;])\s+", text) if len(s.strip()) > 40]
    return parts[:n]


def ts_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def iso_date(s: str) -> str:
    """Convert DD-MM-YYYY (MP site format) to ISO YYYY-MM-DD."""
    m = re.match(r"^(\d{1,2})-(\d{1,2})-(\d{4})$", (s or "").strip())
    return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}" if m else s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=os.path.join(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))), "corpus", "compiled-awards.jsonl"))
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()

    rows = [json.loads(l) for l in open(a.source, encoding="utf-8") if l.strip()]
    if a.limit:
        rows = rows[:a.limit]

    items = []
    for r in rows:
        if r.get("error"):
            continue
        idx = r.get("termination_index") or ["Misconduct"]
        mtypes = r.get("misconduct_types") or []
        titles = [t for t in (r.get("claimant", ""), r.get("respondent", "")) if t]
        title = "  v  ".join(titles)
        mtypes_line = ("    misconductTypes: "
                       + json.dumps(mtypes, ensure_ascii=False) + ",\n") if mtypes else ""
        block = (
            "{\n"
            f"    id: {ts_str(r.get('case_no', ''))},\n"
            f"    title: {ts_str(title)},\n"
            f"    terminationIndex: {json.dumps(idx, ensure_ascii=False)},\n"
            + mtypes_line +
            f"    awardDate: {ts_str(iso_date(r.get('award_date', '')))},\n"
            f"    court: {ts_str(r.get('court', ''))},\n"
            f"    caseNo: {ts_str(r.get('case_no', ''))},\n"
            "    industry: '',\n"
            "    employmentLevel: '',\n"
            "    representation: '',\n"
            f"    outcome: {ts_str(outcome_from((r.get('court_findings', '') + ' ' + r.get('legal_summary', ''))))},\n"
            f"    typeOfDismissal: {ts_str(r.get('type_of_dismissal', ''))},\n"
            f"    backgroundOfCase: {ts_str(r.get('background_of_case', ''))},\n"
            f"    claimantCase: {ts_str(r.get('claimant_case', ''))},\n"
            f"    companyCase: {ts_str(r.get('company_case', ''))},\n"
            f"    courtFindings: {ts_str(r.get('court_findings', ''))},\n"
            f"    legalSummary: {ts_str(r.get('legal_summary', ''))},\n"
            f"    summary: {ts_str(r.get('legal_summary', ''))},\n"
            f"    keyTakeaways: {json.dumps(bullets(r.get('legal_summary', '')), ensure_ascii=False)},\n"
            f"    principles: {json.dumps(bullets(r.get('court_findings', '')), ensure_ascii=False)},\n"
            f"    judgmentUrl: {ts_str(r.get('judgment_url', ''))},\n"
            "  },"
        )
        items.append(block)

    header = """import type { Award } from '@/lib/types';

/**
 * INDUSTRIAL COURT AWARDS — real awards compiled from the public MP full-awards
 * database (mp.gov.my/fullawards, case code 4 — Dismissal).
 *
 * Each record follows the fixed seven-heading research template:
 *   1. TYPE OF DISMISSAL
 *   2. INDUSTRIAL COURT CASE NO
 *   3. BACKGROUND OF THE CASE
 *   4. CLAIMANT CASE
 *   5. COMPANY CASE
 *   6. COURT FINDINGS
 *   7. LEGAL SUMMARY
 * Fields the compiler could not populate stay empty rather than invented.
 * Regenerate with: python3 scripts/gen-awards-seed.py
 */
export const AWARDS: Award[] = [
"""
    output = header + "\n".join(items) + "\n];\n"
    dest = os.path.join(OUT, "awards.ts")
    with open(dest, "w", encoding="utf-8") as f:
        f.write(output)
    print(f"[seed] wrote {len(items)} awards → {dest}")


if __name__ == "__main__":
    main()