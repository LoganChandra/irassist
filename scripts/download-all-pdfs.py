#!/usr/bin/env python3
"""Download every dismissal-award PDF from the full index. Parallel + resumable."""
import json, os, urllib.request, concurrent.futures as cf, threading, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(BASE, "corpus", "awards-full-index.jsonl")
PDF_DIR = os.path.join(BASE, "corpus", "pdfs-full")
os.makedirs(PDF_DIR, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Firefox/126.0"}

rows = [json.loads(l) for l in open(INDEX, encoding="utf-8") if l.strip()]
# dedupe by awardIndex
seen, jobs = set(), []
for r in rows:
    if not r.get("pdf_url"):
        continue
    idx = r["pdf_url"].split("awardIndex=")[-1]
    if idx in seen:
        continue
    seen.add(idx)
    year = r.get("year", "unknown")
    case = r.get("case_no", "nocase").replace("/", "-").replace("(", "").replace(")", "")
    an = r.get("award_no", "noaward").replace("/", "-")
    fname = f"{idx}_{year}_{case}_{an}.pdf"
    jobs.append((idx, fname, r["pdf_url"]))

print(f"jobs: {len(jobs)}", flush=True)
lock = threading.Lock()
done = [0]
fail = [0]

def dl(job):
    idx, fname, url = job
    path = os.path.join(PDF_DIR, fname)
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        with lock:
            done[0] += 1
        return True
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=60) as src, open(path + ".tmp", "wb") as f:
            f.write(src.read())
        os.rename(path + ".tmp", path)
        with lock:
            done[0] += 1
            if done[0] % 250 == 0:
                print(f"progress: {done[0]}/{len(jobs)} (fails {fail[0]})", flush=True)
        return True
    except Exception as e:
        try:
            os.remove(path + ".tmp")
        except OSError:
            pass
        with lock:
            fail[0] += 1
            if fail[0] <= 10:
                print(f"FAIL {idx}: {e}", flush=True)
        return False

with cf.ThreadPoolExecutor(max_workers=12) as ex:
    list(ex.map(dl, jobs))

print(f"DONE. downloaded/verified: {done[0]}, failed: {fail[0]}", flush=True)
