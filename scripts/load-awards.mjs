#!/usr/bin/env node
/**
 * Load the compiled awards corpus into the Supabase `awards` table.
 *
 * Reads corpus/compiled-awards.jsonl and upserts each record keyed on
 * case_no — idempotent, safe to re-run as the corpus grows. Maps the
 * seven-heading record onto the awards schema (migration 0002):
 *   type_of_dismissal, case_no, background_of_case, claimant_case,
 *   company_case, court_findings, legal_summary, termination_index,
 *   misconduct_types.
 *
 * Usage (from the repo root, after scripts/compile-awards.py):
 *   node --env-file=.env.local scripts/load-awards.mjs --limit 50
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const limit = process.argv.includes('--limit')
  ? Number(process.argv[process.argv.indexOf('--limit') + 1])
  : 0;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const src = resolve('corpus/compiled-awards.jsonl');
const rows = readFileSync(src, 'utf-8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .filter((r) => !r.error);
const batch = limit ? rows.slice(0, limit) : rows;

let upserted = 0;
for (const r of batch) {
  const { error } = await supabase.from('awards').upsert(
    {
      id: r.case_no,
      title: `${r.claimant}  v  ${r.respondent}`,
      termination_index: r.termination_index || [],
      misconduct_types: r.misconduct_types || null,
      award_date: r.award_date?.trim() || null,
      court: r.court || null,
      case_no: r.case_no,
      type_of_dismissal: r.type_of_dismissal || null,
      background_of_case: r.background_of_case || null,
      claimant_case: r.claimant_case || null,
      company_case: r.company_case || null,
      court_findings: r.court_findings || null,
      legal_summary: r.legal_summary || null,
      judgment_url: r.judgment_url || null,
      topics: [...(r.termination_index || []), ...(r.misconduct_types || [])],
    },
    { onConflict: 'case_no' }
  );
  if (error) {
    console.error('upsert failed:', r.case_no, error.message);
  } else {
    upserted += 1;
  }
}
console.log(`[load] ${upserted}/${batch.length} awards upserted → ${url}`);