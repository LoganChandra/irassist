#!/usr/bin/env node
/**
 * Run the awards upsert LOCALLY against prod Supabase using the runtime env
 * that Vercel itself injects — via `vercel env pull` in plaintext mode.
 * The CLI redacts secrets in pulled files, so instead we deploy the loader as
 * a script on Vercel... which we already have. So this local run is only a
 * connectivity check: if the project is paused, we'll see it here.
 *
 * Real creds come from Supabase dashboard if these fail — reported to user.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || url.includes('SENSITIVE')) {
  console.error('no real creds locally — cannot test from here');
  process.exit(2);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const { count, error } = await sb.from('awards').select('id', { count: 'exact', head: true });
console.log('count result:', count, 'error:', error?.message ?? 'none');
