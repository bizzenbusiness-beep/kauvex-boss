-- ============================================================
-- KAUVEX OPS — FORMS MODULE
-- Run this AFTER kauvex_ops_supabase_schema.sql and kauvex_ops_auth_roles.sql
-- Stores every fillable form (Growth Toolkit, Health Checkup, Rollout Pack)
-- as JSON, one row per form-type per company (or per date/employee where noted).
-- ============================================================

create table if not exists form_entries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  form_type text not null,        -- e.g. 'business_diagnostic_audit', 'daily_report'
  entry_label text,               -- optional human label, e.g. a date or employee name, to allow multiple entries per form_type
  data jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists form_entries_company_type_idx on form_entries (company_id, form_type);

alter table form_entries enable row level security;

create policy "form_entries_visibility" on form_entries for select
  using (is_kauvex_staff() or company_id = my_company_id());

create policy "form_entries_insert" on form_entries for insert
  with check (is_kauvex_staff() or company_id = my_company_id());

create policy "form_entries_update" on form_entries for update
  using (is_kauvex_staff() or company_id = my_company_id())
  with check (is_kauvex_staff() or company_id = my_company_id());

create policy "form_entries_delete" on form_entries for delete
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

-- keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists form_entries_set_updated_at on form_entries;
create trigger form_entries_set_updated_at
  before update on form_entries
  for each row execute function set_updated_at();
