#!/usr/bin/env python3
"""Debug what the Vercel env API returns per variable."""
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
for env in data.get('envs', [])[:3]:
    print("KEY:", env['key'], "| id:", env['id'], "| type:", env.get('type'), "| target:", env.get('target'))
    dreq = urllib.request.Request(f"{base}/{env['id']}", headers={'Authorization': f'Bearer {token}'})
    d = json.loads(urllib.request.urlopen(dreq, timeout=30).read().decode())
    print("  per-var response keys:", sorted(d.keys()))
    # print shape, not values
    for k, v in d.items():
        if isinstance(v, str):
            print(f"  {k}: str len={len(v)} head={v[:8]!r}")
        elif isinstance(v, dict):
            print(f"  {k}: dict keys={sorted(v.keys())}")
        else:
            print(f"  {k}: {type(v).__name__}")
