// Pure aggregations over a list of cases. No DB, no seed — callers pass the
// cases they fetched (from Supabase or the seed). Used by dashboard + reports.
import type { CaseStatus, DashboardStat, IRCase } from '@/lib/types';

export function dashboardStats(cases: IRCase[]): DashboardStat[] {
  const open = cases.filter((c) => c.status === 'Open').length;
  const investigation = cases.filter((c) => c.status === 'Investigation').length;
  const pip = cases.filter((c) => c.status === 'PIP').length;
  const pendingActions = cases.filter((c) => c.nextAction !== null).length;
  return [
    { label: 'Open Cases', value: open, hint: 'Active disciplinary matters' },
    { label: 'Pending Actions', value: pendingActions, hint: 'Awaiting your next step' },
    { label: 'PIP Cases', value: pip, hint: 'On performance improvement' },
    { label: 'Investigations', value: investigation, hint: 'Under investigation' },
  ];
}

export function statusCounts(cases: IRCase[]): Record<CaseStatus, number> {
  return {
    Open: cases.filter((c) => c.status === 'Open').length,
    Investigation: cases.filter((c) => c.status === 'Investigation').length,
    PIP: cases.filter((c) => c.status === 'PIP').length,
    Closed: cases.filter((c) => c.status === 'Closed').length,
  };
}

export function casesByCategory(cases: IRCase[]): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const c of cases) counts.set(c.issueType, (counts.get(c.issueType) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function casesByDepartment(cases: IRCase[]): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const c of cases) counts.set(c.department || 'Unassigned', (counts.get(c.department || 'Unassigned') ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function recentCases(cases: IRCase[], limit = 5): IRCase[] {
  return [...cases]
    .sort((a, b) => +new Date(b.dateOpened) - +new Date(a.dateOpened))
    .slice(0, limit);
}

export function relatedCases(cases: IRCase[], c: IRCase, limit = 3): IRCase[] {
  return cases.filter((o) => o.id !== c.id && o.issueType === c.issueType).slice(0, limit);
}
