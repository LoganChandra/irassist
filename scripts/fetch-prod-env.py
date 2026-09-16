#!/usr/bin/env python3
"""Fetch prod env vars from the Vercel API (real values) into a local file."""
import json, os, urllib.request

cfg = json.load(open(os.path.expanduser('/home/logan/irassist/.vercel/project.json')))
token = json.load(open(os.path.expanduser('/home/logan/.local/share/com.vercel.cli/auth.json')))['token']
project = cfg['projectId']
team = cfg.get('teamId', '')
base = f"https://api.vercel.com/v9/projects/{project}/env"
if team:
    base += f"?teamId={team}"

req = urllib.request.Request(base, headers={'Authorization': f'Bearer {token}'})
data = json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
out = []
for env in data.get('envs', []):
    if env.get('target', []) and 'production' not in env.get('target', []):
        continue
    name = env['key']
    # decrypt endpoint per-variable
    try:
        dreq = urllib.request.Request(
            f"{base}/{env['id']}",
            headers={'Authorization': f'Bearer {token}'},
        )
        d = json.loads(urllib.request.urlopen(dreq, timeout=30).read().decode())
        val = d.get('value') or d.get('decrypted', {}).get('value')
        if val:
            out.append(f"{name}={val}")
    except Exception:
        out.append(f"{name}=<unreadable>")

with open('/home/logan/irassist/.env.production.real', 'w') as f:
    f.write('\n'.join(out) + '\n')
os.chmod('/home/logan/irassist/.env.production.real', 0o600)
print(f"wrote {len(out)} vars → .env.production.real (gitignored, 0600)")
for line in out:
    print(" -", line.split('=')[0])
