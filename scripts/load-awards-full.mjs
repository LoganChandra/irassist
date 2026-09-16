#!/usr/bin/env node
/**
 * Load the compiled awards corpus (compiled-full.jsonl, ~8,900 records) into
 * the Supabase `awards` table. Upserts keyed on case_no — idempotent.
 *
 * Mapping (compiler field → awards column):
 *   terminationIndex → termination_index (enum[])  misconductTypes → misconduct_types
 *   typeOfDismissal / backgroundOfCase / claimantCase / companyCase /
 *   courtFindings / legalSummary → the seven heading columns
 *   claimant/respondent → parties + title   awardDate (DD-MM-YYYY) → award_date (ISO)
 *
 * Usage (from repo root):
 *   node --env-file=.env.local scripts/load-awards-full.mjs [--source corpus/compiled-full.jsonl] [--limit N]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const argOf = (flag, def) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : def;
};
const limit = process.argv.includes('--limit')
  ? Number(argOf('--limit', '0'))
  : 0;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const src = resolve(argOf('--source', 'corpus/compiled-full.jsonl'));
const rows = readFileSync(src, 'utf-8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const batch = limit ? rows.slice(0, limit) : rows;

/** DD-MM-YYYY (court format) → YYYY-MM-DD; passthrough if already ISO. */
function isoDate(s) {
  if (!s) return null;
  const t = s.trim();
  const m = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return t.slice(0, 10);
  return null;
}

let upserted = 0;
let failed = 0;
const errors = [];
// Batch upserts — 200 rows per request keeps payloads well under limits.
const CHUNK = 200;
for (let i = 0; i < batch.length; i += CHUNK) {
  const chunk = batch.slice(i, i + CHUNK).map((r) => {
    const ti = r.terminationIndex || [];
    const mt = r.misconductTypes || [];
    return {
      id: r.caseNo,
      title: `${r.claimant || ''}  v  ${r.respondent || ''}`.trim() || r.caseNo,
      claimant: r.claimant || null,
      respondent: r.respondent || null,
      termination_index: ti,
      misconduct_types: mt.length ? mt : null,
      award_no: r.awardNo || null,
      award_date: isoDate(r.awardDate),
      court: r.court || null,
      case_no: r.caseNo,
      type_of_dismissal: r.typeOfDismissal || null,
      background_of_case: r.backgroundOfCase || null,
      claimant_case: r.claimantCase || null,
      company_case: r.companyCase || null,
      court_findings: r.courtFindings || null,
      legal_summary: r.legalSummary || null,
      classification_method: r.classificationMethod || null,
      classification_score: r.classificationScore ?? null,
      judgment_url: r.judgmentUrl || null,
      topics: [...ti, ...mt],
    };
  });
  const { error } = await supabase.from('awards').upsert(chunk, { onConflict: 'case_no' });
  if (error) {
    failed += chunk.length;
    errors.push(error.message);
    console.error(`[load] chunk ${i}-${i + chunk.length} FAILED: ${error.message}`);
  } else {
    upserted += chunk.length;
    if ((i / CHUNK) % 10 === 0) console.log(`[load] ${upserted}/${batch.length}`);
  }
}
console.log(`[load] DONE ${upserted}/${batch.length} upserted, ${failed} failed → ${url}`);
if (errors.length) process.exit(2);
