#!/usr/bin/env python3
"""Apply migration 0003 to the production Supabase (via service-role REST exec).

Uses the pg-meta style /pg endpoint is NOT available on hosted Supabase, so we
run each statement through PostgREST's rpc is also unavailable. Instead we use
the service role key against the management SQL endpoint — not public either.

Fallback that always works: execute DDL statement-by-statement through the
Supabase client's .rpc() is impossible without a function. So this script uses
the direct Postgres connection string derived from the project ref + password
if SUPABASE_DB_URL is set, else prints the SQL for manual paste into the
Supabase SQL editor.

Reality check: hosted Supabase DDL needs either (a) the dashboard SQL editor,
(b) supabase CLI + access token, or (c) the direct Postgres connection string.
This script supports (c) and gracefully reports (a)/(b) otherwise.
"""
import os
import sys

import dotenv

dotenv.load_dotenv(os.path.expanduser("~/irassist/.env.production.tmp"))

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
service = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ref = url.replace("https://", "").split(".")[0] if url else ""

print(f"project ref: {ref}")
mig_path = os.path.expanduser("~/irassist/supabase/migrations/0003_awards_full_text.sql")
sql = open(mig_path).read()

db_url = os.environ.get("SUPABASE_DB_URL") or os.environ.get("POSTGRES_URL")
if db_url:
    import subprocess

    print("applying via direct Postgres connection…")
    p = subprocess.run(["psql", db_url, "-v", "ON_ERROR_STOP=1", "-f", mig_path],
                       capture_output=True, text=True)
    print(p.stdout[-3000:])
    print(p.stderr[-2000:])
    sys.exit(p.returncode)

# Try the Supabase management API with the service key (works for some setups)
import json
import urllib.request

endpoint = f"https://api.supabase.com/v1/projects/{ref}/database/query"
req = urllib.request.Request(
    endpoint,
    data=json.dumps({"query": sql}).encode(),
    headers={"Authorization": f"Bearer {service}", "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        print("applied:", r.status, r.read().decode()[:500])
except Exception as e:
    print(f"management API not available with service key ({e})")
    print("→ paste this migration into the Supabase dashboard SQL editor, or set SUPABASE_DB_URL:")
    print(sql)
    sys.exit(1)
