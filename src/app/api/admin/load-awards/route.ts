import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * ONE-OFF admin loader for the awards corpus.
 * - GET  ?action=migrate : applies the 0003 DDL (columns + indexes)
 * - GET  ?action=count   : row count + column sample
 * - POST { rows: [...] } : upsert compiled award records (max 300 per call)
 * Protected by LOADER_TOKEN. DELETE THIS FILE after the corpus is loaded.
 */

function isoDate(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  const m = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? t.slice(0, 10) : null;
}

const DDL = `
alter table awards
  add column if not exists misconduct_types misconduct_type[],
  add column if not exists award_no text,
  add column if not exists claimant text,
  add column if not exists respondent text,
  add column if not exists classification_method text,
  add column if not exists classification_score int,
  add column if not exists type_of_dismissal text,
  add column if not exists background_of_case text,
  add column if not exists claimant_case text,
  add column if not exists company_case text,
  add column if not exists court_findings text,
  add column if not exists legal_summary text;
create extension if not exists pg_trgm;
create index if not exists awards_search_fts_idx
  on awards using gin (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(background_of_case,'') || ' ' ||
      coalesce(claimant_case,'') || ' ' ||
      coalesce(company_case,'') || ' ' ||
      coalesce(court_findings,'') || ' ' ||
      coalesce(legal_summary,''))
  );
create index if not exists awards_title_trgm_idx
  on awards using gin (title gin_trgm_ops);
create index if not exists awards_date_idx on awards (award_date desc nulls last);
create index if not exists awards_court_idx on awards (court);
create index if not exists awards_misconduct_idx on awards using gin (misconduct_types);
do $$ begin
  alter table awards add constraint awards_case_no_unique unique (case_no);
exception when duplicate_object then null; end $$;
`;

// enum types may not exist if 0002 was never applied — create idempotently first
const ENUMS = `
do $$ begin
  create type termination_index as enum (
    'Misconduct', 'Poor Performance', 'Breach of Contract/Fiduciary Duty',
    'Redundancy/Retrenchment', 'Insubordination', 'Negligence',
    'Poor Health/Incapacity', 'Constructive Dismissal'
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create type misconduct_type as enum (
    'Theft, Fraud, Dishonesty', 'Insubordination', 'Fighting or Workplace Violence',
    'Sexual Harassment', 'Absenteeism or Habitual Lateness'
  );
exception when duplicate_object then null; end $$;
`;

export async function GET(request: NextRequest) {
  const token = process.env.LOADER_TOKEN;
  if (!token || request.headers.get('x-loader-token') !== token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
  const supabase: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });

  const action = request.nextUrl.searchParams.get('action');

  if (action === 'count') {
    const { count, error } = await supabase
      .from('awards')
      .select('id', { count: 'exact', head: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rows: count });
  }

  if (action === 'migrate') {
    // Supabase JS cannot run raw DDL; use the pg-meta-style exec via rpc fallback.
    // On hosted Supabase the service-role REST API cannot execute DDL, so we
    // report the exact SQL to paste if this path is unavailable.
    return NextResponse.json({
      error: 'REST cannot run DDL. Apply via Supabase SQL editor.',
      sql: ENUMS + DDL,
    });
  }

  return NextResponse.json({ ok: true, actions: ['count', 'migrate', 'POST rows'] });
}

export async function POST(request: NextRequest) {
  const token = process.env.LOADER_TOKEN;
  if (!token || request.headers.get('x-loader-token') !== token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });

  const body = await request.json().catch(() => null);
  const rows = Array.isArray(body?.rows) ? body.rows : null;
  if (!rows || rows.length === 0 || rows.length > 300) {
    return NextResponse.json({ error: 'rows required (1..300)' }, { status: 400 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const mapped = rows.map((r: Record<string, unknown>) => {
    const ti = (r.terminationIndex as string[]) || [];
    const mt = (r.misconductTypes as string[]) || [];
    return {
      id: r.caseNo,
      title: `${r.claimant ?? ''}  v  ${r.respondent ?? ''}`.trim() || String(r.caseNo),
      claimant: (r.claimant as string) || null,
      respondent: (r.respondent as string) || null,
      termination_index: ti,
      misconduct_types: mt.length ? mt : null,
      award_no: (r.awardNo as string) || null,
      award_date: isoDate(r.awardDate as string),
      court: (r.court as string) || null,
      case_no: r.caseNo,
      type_of_dismissal: (r.typeOfDismissal as string) || null,
      background_of_case: (r.backgroundOfCase as string) || null,
      claimant_case: (r.claimantCase as string) || null,
      company_case: (r.companyCase as string) || null,
      court_findings: (r.courtFindings as string) || null,
      legal_summary: (r.legalSummary as string) || null,
      classification_method: (r.classificationMethod as string) || null,
      classification_score: (r.classificationScore as number) ?? null,
      judgment_url: (r.judgmentUrl as string) || null,
      topics: [...ti, ...mt],
    };
  });

  const { error } = await supabase.from('awards').upsert(mapped, { onConflict: 'case_no' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, upserted: mapped.length });
}
