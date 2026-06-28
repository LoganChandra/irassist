// Server-only data access. Reads the signed-in user's org-scoped data from
// Supabase (RLS enforces the scoping). Falls back to the seed in demo mode
// (no Supabase configured) so local dev still works without a backend.
import { createClient } from '@/lib/supabase/server';
import { hasValidSupabaseConfig } from '@/lib/env';
import type { IRCase, Hearing } from '@/lib/types';
import type { Subscription } from '@/lib/billing/account';
import type { PlanId, BillingPeriod } from '@/lib/billing/plans';
import { CURRENT_USER, CASES, HEARINGS } from './index';

export interface Profile {
  name: string; // first name, for greetings
  fullName: string;
  role: string;
  email: string;
  organization: string;
  industry: string;
  companySize: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapCaseRow(row: any, timeline: any[] = [], documents: any[] = []): IRCase {
  return {
    id: row.id,
    employeeName: row.employee_name,
    employeeId: row.employee_id ?? '',
    department: row.department ?? '',
    role: row.role ?? '',
    issue: row.issue ?? '',
    issueType: row.issue_type,
    status: row.status,
    dateOpened: row.date_opened,
    details: row.details ?? '',
    nextAction: row.next_action ?? null,
    nextActionDate: row.next_action_date ?? null,
    timeline: (timeline ?? []).map((t: any) => ({ label: t.label, date: t.date, state: t.state })),
    documents: (documents ?? []).map((d: any) => ({ name: d.name, date: d.date, type: d.type })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getProfile(): Promise<Profile | null> {
  if (!hasValidSupabaseConfig()) {
    return {
      name: CURRENT_USER.name,
      fullName: CURRENT_USER.fullName,
      role: CURRENT_USER.role,
      email: CURRENT_USER.email,
      organization: CURRENT_USER.organization,
      industry: CURRENT_USER.industry,
      companySize: CURRENT_USER.companySize,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('full_name, role, email, organizations(name, industry, company_size)')
    .eq('id', user.id)
    .maybeSingle();

  const org = (data?.organizations ?? null) as
    | { name?: string; industry?: string; company_size?: string }
    | null;
  const fullName = (data?.full_name as string) || user.email?.split('@')[0] || 'there';

  return {
    name: fullName.split(' ')[0] || 'there',
    fullName,
    role: (data?.role as string) || 'HR Admin',
    email: (data?.email as string) || user.email || '',
    organization: org?.name || '—',
    industry: org?.industry || '—',
    companySize: org?.company_size || '—',
  };
}

export async function getCases(): Promise<IRCase[]> {
  if (!hasValidSupabaseConfig()) return CASES;
  const supabase = await createClient();
  const { data } = await supabase
    .from('cases')
    .select('*')
    .order('date_opened', { ascending: false });
  return (data ?? []).map((r) => mapCaseRow(r));
}

export async function getCaseById(id: string): Promise<IRCase | undefined> {
  if (!hasValidSupabaseConfig()) return CASES.find((c) => c.id.toLowerCase() === id.toLowerCase());
  const supabase = await createClient();
  const { data: c } = await supabase.from('cases').select('*').eq('id', id).maybeSingle();
  if (!c) return undefined;
  const { data: tl } = await supabase
    .from('case_timeline')
    .select('*')
    .eq('case_id', id)
    .order('sort', { ascending: true });
  const { data: docs } = await supabase
    .from('case_documents')
    .select('*')
    .eq('case_id', id)
    .order('date', { ascending: true });
  return mapCaseRow(c, tl ?? [], docs ?? []);
}

export async function upcomingHearings(): Promise<Hearing[]> {
  if (!hasValidSupabaseConfig())
    return [...HEARINGS].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const supabase = await createClient();
  const { data } = await supabase
    .from('hearings')
    .select('case_id, employee_name, date, time')
    .order('date', { ascending: true });
  return (data ?? []).map((h) => ({
    caseId: h.case_id as string,
    employeeName: h.employee_name as string,
    date: h.date as string,
    time: h.time as string,
  }));
}

export async function getSubscription(): Promise<Subscription> {
  if (!hasValidSupabaseConfig()) {
    return {
      planId: 'professional',
      status: 'active',
      period: 'monthly',
      currentPeriodEnd: '2026-07-28',
      demo: true,
    };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('plan_id, status, period, current_period_end')
    .maybeSingle();
  if (!data) {
    return { planId: 'free', status: 'none', period: 'monthly', currentPeriodEnd: null, demo: false };
  }
  return {
    planId: data.plan_id as PlanId,
    status: data.status as Subscription['status'],
    period: data.period as BillingPeriod,
    currentPeriodEnd: data.current_period_end as string | null,
    demo: false,
  };
}
