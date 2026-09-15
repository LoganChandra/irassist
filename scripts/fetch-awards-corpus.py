#!/usr/bin/env python3
"""Fetch the authoritative awards corpus from the Malaysian Industrial Court.

Source: https://www.mp.gov.my/fullawards/searchFullAwards.php
The template (DOC-20260528) says: Case Year — 2026 then 2025, 2024 and continue.
Case code — DISMISSAL.

Output per award, JSON-lines into awards-corpus.jsonl:
    {award_no, award_date, case_no, claimant, respondent,
     pdf_url, pdf_path (downloaded), year}

Usage:
    python3 scripts/fetch-awards-corpus.py [--years 2026 2025 2024 ...] [--no-download]
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

BASE = "https://www.mp.gov.my"
RESULTS = BASE + "/fullawards/fullAwardsResults.php"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Firefox/126.0"}

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "corpus")
PDF_DIR = os.path.join(OUT_DIR, "pdfs")
JSONL = os.path.join(OUT_DIR, "awards-corpus.jsonl")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", errors="replace")


def rows_from(html: str):
    """Yield parsed award rows from a results page."""
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S):
        cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.S)
        if len(cells) < 7:
            continue
        def cell(i):
            return re.sub(r"<[^>]+>", " ", cells[i]).replace("&nbsp;", " ").strip()
        no = cell(0)
        if no == "No":
            continue  # header row
        parties = [p.strip() for p in cell(1).split("vs") if p.strip()]
        award_no = cell(2)
        award_date = cell(3)
        case_no = cell(4)
        dl = re.search(r"action=downloadAward&[^'\" ]*awardIndex=(\d+)", row)
        pdf_url = (BASE + "/eicpp/MainServlet?action=downloadAward"
                   "&awardCategory=4&awardIndex=" + dl.group(1)) if dl else None
        yield {
            "no": no,
            "claimant": parties[0] if len(parties) > 0 else "",
            "respondent": parties[1] if len(parties) > 1 else "",
            "award_no": award_no,
            "award_date": award_date,
            "case_no": case_no,
            "pdf_url": pdf_url,
        }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", nargs="+", default=["2026", "2025", "2024"])
    ap.add_argument("--no-download", action="store_true")
    a = ap.parse_args()

    os.makedirs(PDF_DIR, exist_ok=True)
    seen = set()
    if os.path.exists(JSONL):
        for line in open(JSONL, encoding="utf-8"):
            try:
                seen.add(json.loads(line)["case_no"])
            except Exception:
                pass

    with open(JSONL, "a", encoding="utf-8") as out:
        for year in a.years:
            print(f"[corpus] year {year} — POSTing search…", file=sys.stderr)
            body = urllib.parse.urlencode({"caseYear": year, "caseCode": "4",
                                           "searchID": "Submit"}).encode()
            req = urllib.request.Request(RESULTS, data=body, headers=UA)
            try:
                with urllib.request.urlopen(req, timeout=90) as r:
                    html = r.read().decode("utf-8", errors="replace")
            except Exception as e:
                print(f"[corpus] {year} fetch failed: {e}", file=sys.stderr)
                continue
            rows = list(rows_from(html))
            print(f"[corpus] {year} — {len(rows)} dismissal awards", file=sys.stderr)
            for r in rows:
                if r["case_no"] in seen:
                    continue
                seen.add(r["case_no"])
                if not a.no_download and r["pdf_url"]:
                    try:
                        dl = urllib.request.Request(r["pdf_url"], headers=UA)
                        fname = f"{r['year'] if False else year}-{r['award_no'].replace('/','-')}-{r['case_no'].replace('/','-').replace('(','').replace(')','')}.pdf"
                        with urllib.request.urlopen(dl, timeout=120) as src, open(os.path.join(PDF_DIR, fname), "wb") as f:
                            f.write(src.read())
                        r["pdf_path"] = os.path.join(PDF_DIR, fname)
                    except Exception as e:
                        r["pdf_error"] = str(e)
                r["year"] = year
                out.write(json.dumps(r, ensure_ascii=False) + "\n")
                out.flush()
    print(f"[corpus] done. JSONL rows: {os.path.getsize(JSONL)} bytes → {JSONL}", file=sys.stderr)


if __name__ == "__main__":
    main()