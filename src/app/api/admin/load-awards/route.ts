import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * ONE-OFF admin loader: upserts the compiled awards corpus into Supabase.
 * Protected by LOADER_TOKEN (set it as a Vercel env var before calling).
 * DELETE THIS FILE after the corpus is loaded.
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

export async function POST(request: NextRequest) {
  const token = process.env.LOADER_TOKEN;
  if (!token || request.headers.get('x-loader-token') !== token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
  }

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
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, upserted: mapped.length });
}
