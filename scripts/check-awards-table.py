#!/usr/bin/env python3
"""Apply migration 0003 + inspect the awards table. Fetches env live from Vercel."""
import json, os, urllib.request, urllib.error

HOME = os.path.expanduser('~')
cfg = json.load(open(HOME + '/irassist/.vercel/project.json'))
token = json.load(open(HOME + '/.local/share/com.vercel.cli/auth.json'))['token']
project = cfg['projectId']
team = cfg.get('teamId', '')
base = f"https://api.vercel.com/v9/projects/{project}/env"
if team:
    base += f"?teamId={team}"

def fetch_env(name):
    req = urllib.request.Request(base, headers={'Authorization': f'Bearer {token}'})
    data = json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
    for env in data.get('envs', []):
        if env['key'] == name:
            dreq = urllib.request.Request(f"{base}/{env['id']}", headers={'Authorization': f'Bearer {token}'})
            d = json.loads(urllib.request.urlopen(dreq, timeout=30).read().decode())
            return d.get('value') or (d.get('decrypted') or {}).get('value')
    return None

SB_URL = fetch_env('NEXT_PUBLIC_SUPABASE_URL')
SB_KEY = fetch_env('SUPABASE_SERVICE_ROLE_KEY')
assert SB_URL and SB_URL.startswith('http'), f"bad url: {SB_URL!r}"
print("supabase url host:", SB_URL.split('//')[1].split('.')[0], "(ok)")

req = urllib.request.Request(
    SB_URL + '/rest/v1/awards?select=*&limit=1',
    headers={'apikey': SB_KEY, 'Authorization': f'Bearer {SB_KEY}'},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.loads(r.read().decode())
        print("TABLE EXISTS. columns:", sorted(rows[0].keys()) if rows else "(no rows)")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()[:200]}")

req2 = urllib.request.Request(
    SB_URL + '/rest/v1/awards?select=id',
    headers={'apikey': SB_KEY, 'Authorization': f'Bearer {SB_KEY}', 'Prefer': 'count=exact', 'Range': '0-0'},
)
try:
    with urllib.request.urlopen(req2, timeout=30) as r:
        print("row count:", r.headers.get('content-range', '?'))
except Exception as e:
    print("count err:", e)
