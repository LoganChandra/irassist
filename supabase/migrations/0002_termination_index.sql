-- Awards data bank — Termination Index + the seven compilation headings.
-- Brings the awards table in line with the MP full-awards research template:
-- every award is classified against the fixed index, Misconduct awards carry
-- their specific misconduct type(s), and the detail record keeps the seven
-- headings verbatim and in order:
--   1. TYPE OF DISMISSAL      (type_of_dismissal)
--   2. INDUSTRIAL COURT CASE NO (case_no — already present)
--   3. BACKGROUND OF THE CASE (background_of_case)
--   4. CLAIMANT CASE          (claimant_case)
--   5. COMPANY CASE           (company_case)
--   6. COURT FINDINGS         (court_findings)
--   7. LEGAL SUMMARY          (legal_summary)

-- ── Enums ────────────────────────────────────────────────────────────────

create type termination_index as enum (
  'Misconduct',
  'Poor Performance',
  'Breach of Contract/Fiduciary Duty',
  'Redundancy/Retrenchment',
  'Insubordination',
  'Negligence',
  'Poor Health/Incapacity',
  'Constructive Dismissal'
);

create type misconduct_type as enum (
  'Theft, Fraud, Dishonesty',
  'Insubordination',
  'Fighting or Workplace Violence',
  'Sexual Harassment',
  'Absenteeism or Habitual Lateness'
);

-- ── Columns ──────────────────────────────────────────────────────────────

alter table awards
  add column if not exists termination_index termination_index[]
    not null default '{}',
  add column if not exists misconduct_types misconduct_type[],
  add column if not exists type_of_dismissal text,
  add column if not exists background_of_case text,
  add column if not exists claimant_case text,
  add column if not exists company_case text,
  add column if not exists court_findings text,
  add column if not exists legal_summary text;

-- backfill: every existing award is a Dismissal-class matter by definition of
-- this corpus branch (case code 4); leave the detailed headings to the
-- compilation pass.
update awards
set termination_index = '{}'::termination_index[]
where termination_index = '{}'::termination_index[];

-- index for data-bank facet queries
create index if not exists awards_termination_index_idx
  on awards using gin (termination_index);
create index if not exists awards_case_no_idx
  on awards (case_no);

-- the loader (scripts/load-awards.mjs) upserts keyed on case_no
alter table awards
  add constraint awards_case_no_unique unique (case_no);