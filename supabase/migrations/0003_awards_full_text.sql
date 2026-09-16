-- Awards data bank at full scale (~8,900 Industrial Court dismissal awards).
-- Adds the columns the compiler produces and the search path the app needs.
-- Taxonomy enums already exist from 0002 (termination_index, misconduct_type).

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

-- Search: full-text over parties + headings; trigram for fuzzy party matching.
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

-- case_no unique constraint came in 0002; keep idempotent here for fresh DBs.
do $$ begin
  alter table awards add constraint awards_case_no_unique unique (case_no);
exception when duplicate_object then null; end $$;
