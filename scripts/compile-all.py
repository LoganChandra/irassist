#!/usr/bin/env python3
"""Compile ALL dismissal award PDFs into seven-heading records. v2

Cost discipline (pre-registered): heuristics + OCR are free and run everywhere.
The LLM is used ONLY to classify awards the rules can't (low-confidence), with
a hard balance floor — the pass disables itself rather than overspend.

Pipeline per award:
  1. pdftotext extraction; OCR fallback (tesseract) for scanned PDFs
  2. heuristic section slicing → headings 3-7 (verbatim court text, cleaned)
  3. rule-based Termination Index classification (keyword evidence, auditable)
  4. LLM classification ONLY when rules are not confident (budget-guarded)

Resume-safe: appends to corpus/compiled-full.jsonl, skips already-compiled ids.

Usage:
  python3 scripts/compile-all2.py [--limit N] [--workers 8] [--llm] [--model ID]
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import urllib.request
import concurrent.futures as cf

import dotenv

dotenv.load_dotenv(os.path.expanduser("~/.hermes/.env"))

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(BASE, "corpus")
INDEX = os.path.join(CORPUS, "awards-full-index.jsonl")
PDF_DIR = os.path.join(CORPUS, "pdfs-full")
OUT = os.path.join(CORPUS, "compiled-full.jsonl")

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
LLM_BALANCE_FLOOR = float(os.environ.get("IRASSIST_LLM_BALANCE_FLOOR", "5"))
_LLM_CALLS = 0
_LLM_DISABLED = False
_llm_lock = threading.Lock()

# ── CANONICAL TAXONOMY — verbatim from DOC-20260528, word for word ─────────
TERMINATION_INDEX = [
    "Misconduct",
    "Poor Performance",
    "Breach of Contract/Fiduciary Duty",
    "Redundancy/Retrenchment",
    "Insubordination",
    "Negligence",
    "Poor Health/Incapacity",
    "Constructive Dismissal",
]
MISCONDUCT_TYPES = [
    "Theft, Fraud, Dishonesty",
    "Insubordination",
    "Fighting or Workplace Violence",
    "Sexual Harassment",
    "Absenteeism or Habitual Lateness",
]

SYSTEM_PROMPT = (
    "You are a precise Malaysian industrial-law research assistant. Classify "
    "Industrial Court dismissal awards into the Termination Index. Rules:\n"
    "1. Base classification ONLY on what the award text says. When the text "
    "shows a dismissal from employment, at least one index entry applies.\n"
    "2. Copy labels EXACTLY as given — never paraphrase, translate, or invent.\n"
    "3. Misconduct-type entries apply only when the dismissal was for "
    "misconduct and the award names the specific misconduct.\n"
    "4. Answer with STRICT JSON using EXACTLY these keys:\n"
    '{"terminationIndex": ["..."], "misconductTypes": ["..."]}\n\n'
    "TERMINATION INDEX labels:\n"
    + "\n".join(f"- {t}" for t in TERMINATION_INDEX)
    + "\n\nMisconduct type labels (only with Misconduct):\n"
    + "\n".join(f"- {m}" for m in MISCONDUCT_TYPES)
)

# ── extraction ──────────────────────────────────────────────────────────────

def pdf_text(path: str) -> str:
    r = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else ""


def pdf_page_count(path: str) -> int:
    r = subprocess.run(["pdfinfo", path], capture_output=True, text=True)
    m = re.search(r"Pages:\s+(\d+)", r.stdout)
    return int(m.group(1)) if m else 0


def ocr_pdf(path: str, max_pages: int = 40, dpi: int = 150) -> str:
    """OCR the first pages of a scanned PDF. Free, local, slow-ish."""
    try:
        n = pdf_page_count(path)
        n = min(n or max_pages, max_pages)
        with tempfile.TemporaryDirectory() as td:
            subprocess.run(
                ["pdftoppm", "-r", str(dpi), "-gray", "-f", "1", "-l", str(n), path, os.path.join(td, "p")],
                check=True, timeout=600,
            )
            txt = []
            for f in sorted(os.listdir(td)):
                out = subprocess.run(["tesseract", os.path.join(td, f), "stdout"], capture_output=True, text=True)
                txt.append(out.stdout)
            return "\n".join(txt)
    except Exception as e:
        print(f"[ocr] fail {os.path.basename(path)}: {e}", file=sys.stderr)
        return ""


def clean_text(t: str) -> str:
    t = t.replace("\x0c", " ")
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


# ── heuristic section slicing ───────────────────────────────────────────────

MARKERS = {
    "backgroundOfCase": re.compile(
        # line-anchored exact headers mined from the corpus, then fuzzy fallback
        r"^(brief\s+facts|background(\s+of\s+the\s+case)?|fakta\s+kes|facts\s+of\s+the\s+case|"
        r"factual\s+background|the\s+facts)$|"
        r"background\s+facts|fakta\s+kes|facts\s+of\s+the\s+case|latar\s+belakang",
        re.I | re.M),
    "claimantCase": re.compile(
        r"^(the\s+claimant'?s?\s+case|claimant'?s?\s+case|kes\s+pihak\s+menuntut|"
        r"case\s+for\s+the\s+claimant|the\s+claimant'?s?\s+evidence)$|"
        r"claimant'?s?\s+(contention|version|complaint)|pihak\s+penuntut",
        re.I | re.M),
    "companyCase": re.compile(
        r"^(the\s+company'?s?\s+case|company'?s?\s+case|kes\s+pihak\s+responden|kes\s+pihak\s+syarikat|"
        r"case\s+for\s+the\s+company|the\s+respondent'?s?\s+case)$|"
        r"company'?s?\s+(defen[cs]e|version|contention)",
        re.I | re.M),
    "courtFindings": re.compile(
        r"^(evaluation\s+and\s+findings|evaluation\s+of\s+evidence\s+and\s+findings|findings|"
        r"penilaian\s+keterangan\s+dan\s+dapatan\s+mahkamah|court\s+findings)$|"
        r"evaluation\s+of\s+evidence|findings\s+of\s+the\s+court|\bthe\s+court\s+finds\b|"
        r"penilaian\s+keterangan",
        re.I | re.M),
    "legalSummary": re.compile(
        r"^(the\s+law|conclusion|remedy|kesimpulan|rumusan|undang-undang|remedi|"
        r"legal\s+summary|summary\s+of\s+findings|disposition)$|"
        r"legal\s+summary|summary\s+of\s+(findings|the\s+court)|\bconclusion\b|"
        r"for\s+reasons?\s+above",
        re.I | re.M),
}
# Order matters: later sections shouldn't swallow earlier ones.
SECTION_ORDER = ["backgroundOfCase", "claimantCase", "companyCase", "courtFindings", "legalSummary"]


def heuristic_headings(text: str) -> dict:
    fields = {k: "" for k in SECTION_ORDER}
    marks = {}
    for key in SECTION_ORDER:
        m = MARKERS[key].search(text)
        if m:
            marks[key] = m.start()
    ordered = sorted(marks.items(), key=lambda kv: kv[1])
    for i, (key, pos) in enumerate(ordered):
        end = ordered[i + 1][1] if i + 1 < len(ordered) else min(len(text), pos + 14000)
        seg = text[pos:end].strip()
        seg = re.sub(r"[ \t]+", " ", seg)
        seg = re.sub(r"\n{3,}", "\n\n", seg)
        fields[key] = seg
    return fields


# ── rule-based classification ───────────────────────────────────────────────

RULES = [
    # (label, regex list, weight)
    ("Redundancy/Retrenchment", [r"retrench\w*", r"redundan\w*", r"lay[- ]?off\w*", r"reorganis\w+",
                                 r"closure\s+of", r"vss\b|voluntary\s+separation"], 2),
    ("Constructive Dismissal", [r"constructive(ly)? dismiss\w*", r"s\.?\s*20\(1A\)|section 20", ], 2),
    ("Poor Health/Incapacity", [r"medical\s+(incapacit\w+|unfit\w*|board)", r"ill[- ]?health", r"unfit\s+to\s+(work|continue)",
                                r"incapacitat\w+", r"stroke|cancer|kidney|dialysis|heart\s+(condition|attack)"], 2),
    ("Sexual Harassment", [r"sexual\s+harass\w+", r"pelecehan\s+seksual"], 3),
    ("Absenteeism or Habitual Lateness", [r"absenteeism|absenting", r"habitual(ly)?\s+late", r"absen\s+tanpa",
                                          r"absent\s+without\s+leave", r"awan\s+cuti"], 3),
    ("Fighting or Workplace Violence", [r"\bf(ight|ought)\b.{0,40}(colleague|coworker|co[- ]?worker|employee|staff)|workplace\s+violence",
                                        r"assault\w*", r"fighting\s+in"], 3),
    ("Theft, Fraud, Dishonesty", [r"\btheft\b|\bsteal\w*|\bcipok\w*|\bmencuri\b", r"\bfraud\w*|forgery|falsif\w+",
                                  r"dishonest\w*", r"criminal\s+breach\s+of\s+trust|\bcbt\b", r"bribe\w*|kickback"], 3),
    ("Insubordination", [r"insubordinat\w+", r"refus\w+.{0,30}(lawful|order|instruction)",
                         r"disobedi\w+|dereliction\s+of\s+duty", r"tidak\s+mematuhi\s+arahan"], 2),
    ("Negligence", [r"negligen\w+", r"careless\w*|keremehan"], 2),
    ("Poor Performance", [r"poor\s+performance|unsatisfactory\s+(performance|work)", r"fail\w+.{0,30}(KPI|target|standard)",
                          r"preformance\s+improvement|pip\b", r"kapasiti\s+kerja|inefficien\w+|incompeten\w+"], 2),
    ("Breach of Contract/Fiduciary Duty", [r"breach\s+of\s+contract", r"fiduciary\s+duty", r"conflict\s+of\s+interest",
                                           r"breach\w*.{0,25}(duty|obligation|confidential)"], 2),
    ("Misconduct", [r"\bmisconduct\b|salah\s+laku", r"domestic\s+inquiry", r"show\s+cause", r"charge\s+(sheet|no)",
                    r"dismiss\w+.{0,40}(misconduct|charge)"], 2),
]
RULE_COMPILED = [(label, [re.compile(rx, re.I) for rx in rxs], w) for label, rxs, w in RULES]
VALID_TI = set(TERMINATION_INDEX)
VALID_MT = set(MISCONDUCT_TYPES)


def classify_rules(text: str) -> tuple[list[str], list[str], int]:
    """Keyword-evidence classification. Returns (terminationIndex, misconductTypes, score)."""
    # Classification evidence lives mostly in the first 30K (charges, facts) and
    # last 10K (disposition) chars — scanning everything over-matches history
    # sections that list every possible charge. Scan head+tail.
    scan = (text[:30000] + "\n" + text[-10000:]) if len(text) > 40000 else text
    scores: dict[str, int] = {}
    for label, rxs, w in RULE_COMPILED:
        s = 0
        for rx in rxs:
            hits = len(rx.findall(scan))
            if hits:
                s += w * min(hits, 3)
        if s:
            scores[label] = s
    if not scores:
        return [], [], 0
    ordered = sorted(scores.items(), key=lambda kv: -kv[1])
    top_score = int(ordered[0][1])
    ti: list[str] = []
    mt: list[str] = []
    # Primary label always in. Secondary labels only if strongly present (≥40% of top).
    for label, sc in ordered:
        if label == "Misconduct":
            continue
        if sc == top_score or sc >= max(4, int(top_score * 0.4)):
            ti.append(label)
    if any(l == "Misconduct" for l, _ in ordered):
        ti.append("Misconduct")
    # Misconduct sub-types only when Misconduct applies
    if "Misconduct" in ti:
        for label in ("Theft, Fraud, Dishonesty", "Insubordination", "Fighting or Workplace Violence",
                      "Sexual Harassment", "Absenteeism or Habitual Lateness"):
            if label in scores:
                mt.append(label)
        if not mt:
            mt = []  # Misconduct without a specific named type — allowed (types optional)
    # Insubordination is both an index entry and a misconduct type
    return ti, mt, top_score


def llm_classify(text: str, meta: dict, model: str) -> dict | None:
    """LLM classification for low-confidence cases. Budget-guarded."""
    global _LLM_CALLS, _LLM_DISABLED
    if not OPENROUTER_KEY:
        return None
    with _llm_lock:
        _LLM_CALLS += 1
        disabled = _LLM_DISABLED
        check = _LLM_CALLS % 100 == 0
    if disabled:
        return None
    if check:
        try:
            creq = urllib.request.Request(
                "https://openrouter.ai/api/v1/credits",
                headers={"Authorization": f"Bearer {OPENROUTER_KEY}"},
            )
            bal = json.loads(urllib.request.urlopen(creq, timeout=30).read().decode())
            remaining = bal["data"]["total_credits"] - bal["data"]["total_usage"]
            print(f"[llm] balance check: ${remaining:.2f} remaining", flush=True)
            if remaining < LLM_BALANCE_FLOOR:
                with _llm_lock:
                    _LLM_DISABLED = True
                print(f"[llm] BALANCE FLOOR ${LLM_BALANCE_FLOOR} hit — LLM pass disabled", flush=True)
                return None
        except Exception:
            pass
    body = {
        "model": model,
        "temperature": 0,
        "max_tokens": 300,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"AWARD: {meta.get('claimant','')} vs {meta.get('respondent','')} | "
                    f"Case No {meta.get('case_no','')}\n\n"
                    "AWARD TEXT (head and tail):\n" + text[:20000] + "\n[...]\n" + text[-8000:]
                ),
            },
        ],
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"},
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.loads(r.read().decode())
            content = data["choices"][0]["message"]["content"]
            content = re.sub(r"^```(json)?|```$", "", content.strip()).strip()
            obj = json.loads(content)
            ti = obj.get("terminationIndex") or obj.get("termination_index") or []
            if isinstance(ti, str):
                ti = [ti]
            mt = obj.get("misconductTypes") or obj.get("misconduct_types") or []
            if isinstance(mt, str):
                mt = [mt]
            return {"terminationIndex": [t for t in ti if t in VALID_TI],
                    "misconductTypes": [m for m in mt if m in VALID_MT]}
        except Exception as e:
            if attempt == 2:
                print(f"[llm] fail {meta.get('case_no')}: {e}", file=sys.stderr)
                return None
    return None


CONFIDENCE_FLOOR = 6  # rule score below this → ask the LLM


def compile_one(job: dict, use_llm: bool, model: str) -> dict | None:
    pdf_path = job.get("pdf_path")
    text = pdf_text(pdf_path) if pdf_path and os.path.exists(pdf_path) else ""
    if len(text.strip()) < 200:
        text = ocr_pdf(pdf_path) if pdf_path and os.path.exists(pdf_path) else ""
    if len(text.strip()) < 200:
        return None  # unreadable even after OCR — skipped, counted
    text = clean_text(text)

    rec = {
        "id": job["case_no"],
        "caseNo": job["case_no"],
        "awardNo": job.get("award_no", ""),
        "title": f"{job.get('claimant','')}  v  {job.get('respondent','')}".strip(),
        "claimant": job.get("claimant", ""),
        "respondent": job.get("respondent", ""),
        "awardDate": job.get("award_date", ""),
        "court": job.get("court", ""),
        "year": job.get("year", ""),
        "judgmentUrl": job.get("pdf_url", ""),
    }
    rec.update(heuristic_headings(text))

    ti, mt, score = classify_rules(text)
    method = "rules"
    if use_llm and (score < CONFIDENCE_FLOOR or not ti):
        out = llm_classify(text, job, model)
        if out and (out["terminationIndex"] or out["misconductTypes"]):
            ti, mt, method = out["terminationIndex"], out["misconductTypes"], "llm"
    rec["terminationIndex"] = ti
    rec["misconductTypes"] = mt
    rec["classificationMethod"] = method
    rec["classificationScore"] = score

    if not rec.get("typeOfDismissal", ""):
        rec["typeOfDismissal"] = ", ".join(ti[:2]) if ti else ""
    return rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--llm", action="store_true", help="LLM fallback for low-confidence classification")
    ap.add_argument("--model", default="google/gemini-2.5-flash-lite")
    ap.add_argument("--pilot", type=int, default=0)
    a = ap.parse_args()

    jobs = [json.loads(l) for l in open(INDEX, encoding="utf-8") if l.strip()]
    have = {f.split("_")[0]: os.path.join(PDF_DIR, f) for f in os.listdir(PDF_DIR) if f.endswith(".pdf")}
    for j in jobs:
        j["awardIndex"] = (j.get("pdf_url") or "").split("awardIndex=")[-1]
        j["pdf_path"] = have.get(j["awardIndex"], "")

    done_ids = set()
    if os.path.exists(OUT):
        for line in open(OUT, encoding="utf-8"):
            try:
                done_ids.add(json.loads(line)["id"])
            except Exception:
                pass
    jobs = [j for j in jobs if j["case_no"] not in done_ids]
    if a.pilot:
        import random
        random.seed(7)
        jobs = random.sample(jobs, a.pilot)
    if a.limit:
        jobs = jobs[: a.limit]

    print(f"compiling {len(jobs)} awards (llm={a.llm}, model={a.model}, workers={a.workers})", flush=True)
    lock = threading.Lock()
    counts = {"ok": 0, "unreadable": 0}
    out_f = open(OUT, "a", encoding="utf-8")

    def work(job):
        try:
            rec = compile_one(job, a.llm, a.model)
        except Exception as e:
            rec = None
            print(f"[err] {job.get('case_no')}: {e}", file=sys.stderr)
        with lock:
            if rec is None:
                counts["unreadable"] += 1
            else:
                out_f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                out_f.flush()
                counts["ok"] += 1
                n = counts["ok"] + counts["unreadable"]
                if n % 200 == 0:
                    print(f"progress {n}/{len(jobs)} ok={counts['ok']} unreadable={counts['unreadable']}", flush=True)

    with cf.ThreadPoolExecutor(max_workers=a.workers) as ex:
        list(ex.map(work, jobs))
    out_f.close()
    print(f"DONE ok={counts['ok']} unreadable={counts['unreadable']} → {OUT}", flush=True)


if __name__ == "__main__":
    main()
