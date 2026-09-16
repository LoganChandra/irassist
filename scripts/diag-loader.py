#!/usr/bin/env python3
"""Diagnose the server-side 'fetch failed' in the loader route.

Hypothesis: NODE fetch from Vercel functions fails to reach the Supabase host.
Test 1: is the Supabase URL reachable from Vercel's network at all? We can't
run code on Vercel directly, but the login page (which calls Supabase from the
browser) works — so DNS is fine client-side. The loader's server-side fetch
fails, which suggests the URL env itself is malformed server-side.

Test 2: recreate the exact failure locally — run the same upsert against the
real Supabase using creds fetched from the Vercel API decrypt path (which the
vercel CLI itself uses). If the creds work locally, the envs on Vercel are
fine and the bug is in the route code (e.g. createServerClient import side
effects). If they fail locally too, the Supabase project may be paused.
"""
import json, os, subprocess, urllib.request, urllib.error

HOME = os.path.expanduser('~')

# 1) Get the deployment's env via the vercel CLI's own debug output
out = subprocess.run(
    ['vercel', 'env', 'pull', '/tmp/.env.diag', '--environment=production', '--yes'],
    cwd=HOME + '/irassist', capture_output=True, text=True)
print("pull rc:", out.returncode)

# 2) Check whether the Supabase project responds to an unauthenticated REST ping
#    (We need the ref; ask the user's config instead — try common sources)
# Try reading the ref from the Vercel API build logs is not possible; instead
# probe the anon-key from the login page build — not possible either.

# 3) Direct: use the supabase CLI to list projects (needs token) — check auth state
out = subprocess.run(['supabase', 'projects', 'list'], capture_output=True, text=True)
print("supabase projects:", (out.stdout + out.stderr).strip()[:200])
