#!/usr/bin/env python3
"""Download the award PDFs for the corpus (one pass, resumable).

Reads corpus/awards-corpus.jsonl, downloads each pdf_url into corpus/pdfs/
unless already present, and writes the pdf_path back into a refreshed JSONL
(corpus/awards-corpus.jsonl), ready for compile-awards.py.

Usage:
    python3 scripts/download-award-pdfs.py [--limit N] [--source corpus/awards-corpus.jsonl]
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "corpus")
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Firefox/126.0"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=os.path.join(OUT, "awards-corpus.jsonl"))
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--sleep", type=float, default=0.3)
    a = ap.parse_args()

    pdf_dir = os.path.join(OUT, "pdfs")
    os.makedirs(pdf_dir, exist_ok=True)

    rows = [json.loads(l) for l in open(a.source, encoding="utf-8") if l.strip()]
    if a.limit:
        rows = rows[:a.limit]

    updated = []
    for i, rec in enumerate(rows):
        # rebuild pdf_path deterministically
        fname = (f"{rec['year']}-{rec['award_no'].replace('/', '-')}-"
                 f"{rec['case_no'].replace('/', '-').replace('(', '').replace(')', '')}.pdf")
        fname = re.sub(r"[^A-Za-z0-9._-]", "-", fname)
        path = os.path.join(pdf_dir, fname)
        rec["pdf_path"] = path
        if not os.path.exists(path) or os.path.getsize(path) < 10000:
            try:
                req = urllib.request.Request(rec["pdf_url"], headers=UA)
                with urllib.request.urlopen(req, timeout=180) as r, open(path, "wb") as f:
                    f.write(r.read())
            except Exception as e:
                rec["pdf_error"] = str(e)
        updated.append(rec)
        if (i + 1) % 25 == 0:
            print(f"[download] {i + 1}/{len(rows)}", file=sys.stderr)
            sys.stdout.flush()
        import time
        time.sleep(a.sleep)

    with open(a.source, "w", encoding="utf-8") as out:
        for rec in updated:
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
    n_ok = sum(1 for r in updated if os.path.exists(r.get("pdf_path", "")) and os.path.getsize(r["pdf_path"]) >= 10000)
    n_err = sum(1 for r in updated if "pdf_error" in r)
    print(f"[download] done — {n_ok} ok, {n_err} failed / {len(updated)}", file=sys.stderr)


if __name__ == "__main__":
    main()