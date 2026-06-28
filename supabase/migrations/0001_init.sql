-- IRAssist initial schema (fresh, dedicated Supabase project — separate from Annota).
-- Org-scoped caseload data + shared reference data (awards, templates) + billing.
-- Apply with: supabase db push   (or paste into the SQL editor).

-- ── Enums ────────────────────────────────────────────────────────────────
create type case_status as enum ('Open', 'Investigation', 'PIP', 'Closed');
create type issue_type as enum (
  'Absenteeism','Misconduct','Performance Issue','Insubordination',
  'Harassment','Policy Violation','Attendance','Dishonesty'
);
create type timeline_state as enum ('done', 'pending');
create type doc_type as enum ('pdf', 'docx', 'form');
create type plan_id as enum ('free', 'professional', 'team');
create type sub_status as enum ('active','trialing','past_due','canceled','none');
create type billing_period as enum ('monthly', 'yearly');

-- ── Organizations & profiles ─────────────────────────────────────────────
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  company_size text,
  created_at timestamptz not null default now()
);

-- One row per auth user, linked to their org.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references organizations (id) on delete set null,
  full_name text not null default '',
  role text not null default 'HR Admin',
  email text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

-- Caller's org id — used by RLS policies.
create or replace function auth_org_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select org_id from profiles where id = auth.uid()
$$;

-- ── Caseload ─────────────────────────────────────────────────────────────
create table cases (
  id text primary key,                       -- e.g. 'IR-2026-001'
  org_id uuid not null references organizations (id) on delete cascade,
  employee_name text not null,
  employee_id text,
  department text,
  role text,
  issue text,
  issue_type issue_type not null,
  status case_status not null default 'Open',
  date_opened date not null default current_date,
  details text,
  next_action text,
  next_action_date date,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cases_org_idx on cases (org_id);

create table case_timeline (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references cases (id) on delete cascade,
  label text not null,
  date date,
  state timeline_state not null default 'pending',
  sort int not null default 0
);
create index case_timeline_case_idx on case_timeline (case_id);

create table case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references cases (id) on delete cascade,
  name text not null,
  date date not null default current_date,
  type doc_type not null default 'pdf',
  url text
);
create index case_documents_case_idx on case_documents (case_id);

create table hearings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  case_id text not null references cases (id) on delete cascade,
  employee_name text not null,
  date date not null,
  time text not null
);
create index hearings_org_idx on hearings (org_id);

-- ── Billing ──────────────────────────────────────────────────────────────
create table subscriptions (
  org_id uuid primary key references organizations (id) on delete cascade,
  plan_id plan_id not null default 'free',
  status sub_status not null default 'none',
  period billing_period not null default 'monthly',
  current_period_end timestamptz,
  provider text,                              -- 'polar' | 'stripe'
  provider_customer_id text,
  provider_subscription_id text,
  updated_at timestamptz not null default now()
);

-- ── Shared reference data (not org-scoped) ───────────────────────────────
create table awards (
  id text primary key,
  title text not null,
  topics text[] not null default '{}',
  award_date date,
  court text,
  case_no text,
  industry text,
  employment_level text,
  representation text,
  outcome text,
  summary text,
  facts text,
  issues text,
  decision text,
  key_takeaways text[] not null default '{}',
  principles text[] not null default '{}',
  judgment_url text
);

create table templates (
  id text primary key,
  name text not null,
  category text not null,
  description text
);

-- ── Row Level Security ───────────────────────────────────────────────────
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table cases enable row level security;
alter table case_timeline enable row level security;
alter table case_documents enable row level security;
alter table hearings enable row level security;
alter table subscriptions enable row level security;
alter table awards enable row level security;
alter table templates enable row level security;

-- Profiles: a user sees/edits their own row.
create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Organizations: members can read their org.
create policy "read own org" on organizations
  for select using (id = auth_org_id());

-- Org-scoped data: full access within your org.
create policy "org cases" on cases
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "org timeline" on case_timeline
  for all using (case_id in (select id from cases where org_id = auth_org_id()))
  with check (case_id in (select id from cases where org_id = auth_org_id()));
create policy "org documents" on case_documents
  for all using (case_id in (select id from cases where org_id = auth_org_id()))
  with check (case_id in (select id from cases where org_id = auth_org_id()));
create policy "org hearings" on hearings
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "org subscription" on subscriptions
  for select using (org_id = auth_org_id());

-- Reference data: any authenticated user can read.
create policy "read awards" on awards
  for select using (auth.role() = 'authenticated');
create policy "read templates" on templates
  for select using (auth.role() = 'authenticated');

-- ── New-signup bootstrap: create a profile + org on user creation ─────────
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  new_org uuid;
begin
  insert into organizations (name) values ('My Organization') returning id into new_org;
  insert into profiles (id, org_id, email, full_name)
    values (new.id, new_org, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into subscriptions (org_id, plan_id, status) values (new_org, 'free', 'none');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
