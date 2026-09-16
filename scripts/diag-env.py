#!/usr/bin/env python3
"""Diagnose what's actually in .env.production.tmp without leaking values."""
for line in open('/home/logan/irassist/.env.production.tmp'):
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    k, _, v = line.partition('=')
    print(f"{k}: len={len(v)} prefix_ok={v.startswith('http')} first4_is_placeholder={v[:12] == '[SENSITIVE]:' or v.startswith('[SENSITIVE]')}")
