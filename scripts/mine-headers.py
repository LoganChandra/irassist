#!/usr/bin/env python3
"""Mine frequent section-header lines across the corpus to build better markers."""
import json, os, re, subprocess, random, collections

PDF_DIR = 'corpus/pdfs-full'
have = [os.path.join(PDF_DIR, f) for f in os.listdir(PDF_DIR) if f.endswith('.pdf')]
random.seed(3)
sample = random.sample(have, 60)

cand = collections.Counter()
for p in sample:
    txt = subprocess.run(['pdftotext', '-layout', p, '-'], capture_output=True, text=True).stdout
    if len(txt.strip()) < 200:
        continue
    for line in txt.split('\n'):
        s = line.strip()
        # candidate headers: short lines, mostly letters, no trailing period-comma
        if 3 < len(s) < 70 and not s.endswith(('.', ',', ';', ':')) and s.count(' ') <= 6:
            letters = sum(c.isalpha() for c in s)
            if letters / max(len(s), 1) > 0.75 and not s.isdigit():
                cand[s.upper()] += 1

for h, n in cand.most_common(60):
    print(f"{n:4d}  {h}")
