import { CASES, HEARINGS } from './cases';
import { AWARDS } from './awards';
import { TEMPLATES } from './templates';
import type { CaseStatus, DashboardStat, IRCase } from '@/lib/types';

export { CASES, HEARINGS, AWARDS, TEMPLATES };

// ── Current user (demo) ──────────────────────────────────────────────────
export const CURRENT_USER = {
  name: 'Chandra',
  fullName: 'Logan Chandra',
  role: 'HR Admin',
  email: 'chandra@acme-mfg.com.my',
  organization: 'Acme Manufacturing Sdn Bhd',
  industry: 'Manufacturing',
  companySize: '501 – 1000 employees',
};

// ── Case accessors ───────────────────────────────────────────────────────
export function getCases(): IRCase[] {
  return CASES;
}

export function getCaseById(id: string): IRCase | undefined {
  return CASES.find((c) => c.id.toLowerCase() === id.toLowerCase());
}

export function getCasesByStatus(status: CaseStatus): IRCase[] {
  return CASES.filter((c) => c.status === status);
}

export function getRelatedCases(c: IRCase, limit = 3): IRCase[] {
  return CASES.filter((o) => o.id !== c.id && o.issueType === c.issueType).slice(0, limit);
}

// ── Dashboard / analytics aggregations ───────────────────────────────────
export function dashboardStats(): DashboardStat[] {
  const open = CASES.filter((c) => c.status === 'Open').length;
  const investigation = CASES.filter((c) => c.status === 'Investigation').length;
  const pip = CASES.filter((c) => c.status === 'PIP').length;
  const pendingActions = CASES.filter((c) => c.nextAction !== null).length;
  return [
    { label: 'Open Cases', value: open, hint: 'Active disciplinary matters' },
    { label: 'Pending Actions', value: pendingActions, hint: 'Awaiting your next step' },
    { label: 'PIP Cases', value: pip, hint: 'On performance improvement' },
    { label: 'Investigations', value: investigation, hint: 'Under investigation' },
  ];
}

export function statusCounts(): Record<CaseStatus, number> {
  return {
    Open: CASES.filter((c) => c.status === 'Open').length,
    Investigation: CASES.filter((c) => c.status === 'Investigation').length,
    PIP: CASES.filter((c) => c.status === 'PIP').length,
    Closed: CASES.filter((c) => c.status === 'Closed').length,
  };
}

export function casesByCategory(): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const c of CASES) counts.set(c.issueType, (counts.get(c.issueType) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function casesByDepartment(): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const c of CASES) counts.set(c.department, (counts.get(c.department) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function recentCases(limit = 5): IRCase[] {
  return [...CASES]
    .sort((a, b) => +new Date(b.dateOpened) - +new Date(a.dateOpened))
    .slice(0, limit);
}

export function upcomingHearings() {
  return [...HEARINGS].sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

// ── Awards accessors ─────────────────────────────────────────────────────
export function getAwards() {
  return AWARDS;
}

export function getAwardById(id: string) {
  return AWARDS.find((a) => a.id.toLowerCase() === id.toLowerCase());
}

// ── Templates accessors ──────────────────────────────────────────────────
export function getTemplates() {
  return TEMPLATES;
}

export function templateCategories() {
  const cats = new Map<string, number>();
  for (const t of TEMPLATES) cats.set(t.category, (cats.get(t.category) ?? 0) + 1);
  return [...cats.entries()].map(([category, count]) => ({ category, count }));
}
