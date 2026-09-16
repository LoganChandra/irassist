#!/usr/bin/env python3
"""OCR feasibility probe: render 2 pages of a known scanned award, OCR, time it."""
import subprocess, time, os, json

p = None
jobs = [json.loads(l) for l in open('corpus/awards-full-index.jsonl')]
have = {f.split('_')[0]: f for f in os.listdir('corpus/pdfs-full')}
for j in jobs:
    if j['case_no'] == '10/4-1197/16':
        p = 'corpus/pdfs-full/' + have[j['pdf_url'].split('awardIndex=')[-1]]
print("testing:", p)
t0 = time.time()
subprocess.run(['pdftoppm', '-r', '200', '-gray', '-f', '1', '-l', '2', p, '/tmp/ocrtest'], check=True)
pgs = sorted(f for f in os.listdir('/tmp') if f.startswith('ocrtest'))
print("rendered:", pgs, f"{time.time()-t0:.1f}s")
txt = ""
for f in pgs:
    out = subprocess.run(['tesseract', f'/tmp/{f}', 'stdout'], capture_output=True, text=True).stdout
    txt += out
print(f"OCR chars: {len(txt)} in {time.time()-t0:.1f}s")
print("SAMPLE:", txt[:500])
