// Server-side awards search over the Supabase awards table (full corpus).
// Falls back to the static seed in demo mode (no Supabase configured).
import { createClient } from '@/lib/supabase/server';
import { hasValidSupabaseConfig } from '@/lib/env';
import { AWARDS } from './awards';
import type { Award } from '@/lib/types';
import {
  TERMINATION_INDEX,
  MISCONDUCT_TYPES,
  type TerminationIndex,
  type MisconductType,
} from './termination-index';

export interface AwardsQuery {
  q?: string;
  topics?: string[]; // Termination Index labels
  misconduct?: string[]; // Misconduct type labels
  court?: string;
  industry?: string;
  year?: string;
  sort?: 'date' | 'relevance';
  page?: number;
  pageSize?: number;
}

export interface AwardsResult {
  awards: Award[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  mode: 'db' | 'seed';
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(row: any): Award {
  const ti = (row.termination_index ?? []) as string[];
  const mt = (row.misconduct_types ?? []) as string[];
  return {
    id: row.id,
    title: row.title,
    terminationIndex: ti.filter((t): t is TerminationIndex =>
      (TERMINATION_INDEX as readonly string[]).includes(t)
    ),
    misconductTypes: mt.filter((m): m is MisconductType =>
      (MISCONDUCT_TYPES as readonly string[]).includes(m)
    ),
    awardDate: row.award_date ?? '',
    court: row.court ?? '',
    caseNo: row.case_no ?? row.id,
    industry: row.industry ?? '',
    employmentLevel: row.employment_level ?? '',
    representation: row.representation ?? '',
    outcome: row.outcome ?? '',
    typeOfDismissal: row.type_of_dismissal ?? '',
    backgroundOfCase: row.background_of_case ?? '',
    claimantCase: row.claimant_case ?? '',
    companyCase: row.company_case ?? '',
    courtFindings: row.court_findings ?? '',
    legalSummary: row.legal_summary ?? '',
    summary: row.legal_summary ?? row.background_of_case ?? '',
    keyTakeaways: [],
    principles: [],
    judgmentUrl: row.judgment_url ?? '',
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function seedSearch(query: AwardsQuery): AwardsResult {
  const q = (query.q ?? '').trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? 20;
  let list = AWARDS.filter((a) => {
    if (q) {
      const hay = [a.title, a.summary, ...a.terminationIndex, ...(a.misconductTypes ?? [])]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (query.topics?.length && !query.topics.some((t) => a.terminationIndex.includes(t as TerminationIndex)))
      return false;
    if (
      query.misconduct?.length &&
      !query.misconduct.some((m) => (a.misconductTypes ?? []).includes(m as MisconductType))
    )
      return false;
    if (query.court && query.court !== 'all' && a.court !== query.court) return false;
    if (query.industry && query.industry !== 'all' && a.industry !== query.industry) return false;
    return true;
  });
  if (query.sort === 'date')
    list = [...list].sort((a, b) => +new Date(b.awardDate) - +new Date(a.awardDate));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    awards: list.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages,
    mode: 'seed',
  };
}

export async function searchAwards(query: AwardsQuery): Promise<AwardsResult> {
  if (!hasValidSupabaseConfig()) return seedSearch(query);

  const supabase = await createClient();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, query.pageSize ?? 20));
  const from = (page - 1) * pageSize;

  let count = 0;
  let req = supabase
    .from('awards')
    .select('*', { count: 'exact', head: false });

  if (query.q?.trim()) {
    const q = query.q.trim();
    // Full-text over the seven headings + parties; fall back to trigram on title.
    req = req.or(
      `fts.fts/english.${JSON.stringify(q)},title.ilike.%${q.replace(/[%_,()]/g, '')}%`
    );
  }
  if (query.topics?.length) {
    req = req.overlaps('termination_index', query.topics);
  }
  if (query.misconduct?.length) {
    req = req.overlaps('misconduct_types', query.misconduct);
  }
  if (query.court && query.court !== 'all') {
    req = req.eq('court', query.court);
  }
  if (query.industry && query.industry !== 'all') {
    req = req.eq('industry', query.industry);
  }
  if (query.year && query.year !== 'all') {
    req = req.gte('award_date', `${query.year}-01-01`).lt('award_date', `${Number(query.year) + 1}-01-01`);
  }

  req = req.order('award_date', { ascending: false, nullsFirst: false }).range(from, from + pageSize - 1);

  const { data, error, count: total } = await req;
  if (error) {
    console.error('[searchAwards]', error.message);
    return { ...seedSearch(query), mode: 'seed' };
  }
  count = total ?? 0;
  return {
    awards: (data ?? []).map(mapRow),
    total: count,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(count / pageSize)),
    mode: 'db',
  };
}

export async function getAwardByIdDb(id: string): Promise<Award | null> {
  if (!hasValidSupabaseConfig()) return AWARDS.find((a) => a.id.toLowerCase() === id.toLowerCase()) ?? null;
  const supabase = await createClient();
  // PostgREST or-syntax breaks on commas/parens in values — use exact eq filters instead.
  const { data, error } = await supabase.from('awards').select('*').eq('id', id).maybeSingle();
  if (error || !data) {
    if (error) console.error('[getAwardByIdDb]', error.message);
    // Backend dead or record absent → serve the seed copy when we have one,
    // so detail pages never 404 just because the database is unreachable.
    return AWARDS.find((a) => a.id.toLowerCase() === id.toLowerCase()) ?? null;
  }
  return mapRow(data);
}

/** Facet values for the filter rail — from the DB when available. */
export async function awardsFacets(): Promise<{
  courts: string[];
  industries: string[];
  years: string[];
}> {
  if (!hasValidSupabaseConfig()) {
    return {
      courts: Array.from(new Set(AWARDS.map((a) => a.court))).sort(),
      industries: Array.from(new Set(AWARDS.map((a) => a.industry).filter(Boolean))).sort(),
      years: Array.from(new Set(AWARDS.map((a) => a.awardDate.slice(0, 4)))).sort().reverse(),
    };
  }
  const supabase = await createClient();
  const [{ data: courts }, { data: industries }, { data: dates }] = await Promise.all([
    supabase.from('awards').select('court').not('court', 'is', null),
    supabase.from('awards').select('industry').not('industry', 'is', null),
    supabase
      .from('awards')
      .select('award_date')
      .not('award_date', 'is', null)
      .order('award_date', { ascending: false }),
  ]);
  const courtSet = Array.from(new Set((courts ?? []).map((r: any) => r.court as string))).sort();
  const industrySet = Array.from(
    new Set((industries ?? []).map((r: any) => (r.industry as string).trim()).filter(Boolean))
  ).sort();
  const yearSet = Array.from(
    new Set((dates ?? []).map((r: any) => String(r.award_date).slice(0, 4)))
  )
    .sort()
    .reverse();
  return { courts: courtSet, industries: industrySet, years: yearSet };
}
