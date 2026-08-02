-- ============================================================
-- KRA / KPI TRACKER
-- Key Result Area & Key Performance Indicator rows — each with
-- Target vs Actual vs % Achieved, by department/function and period.
-- ============================================================

create table if not exists kra_kpi_tracker (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  item_type text not null check (item_type in ('kra','kpi')),
  title text not null,
  department text,        -- Management/HR/R&D/Marketing/Sales/Operations/Accounts (free text)
  period text,            -- e.g. '2026-08' or 'Q3 2026'
  target numeric,
  actual numeric,
  unit text,               -- '%','Rs','count' etc — for display only
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table kra_kpi_tracker enable row level security;

create policy "kra_kpi_visibility" on kra_kpi_tracker for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "kra_kpi_manage" on kra_kpi_tracker for all
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()))
  with check (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

create or replace function set_updated_at_kra_kpi()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kra_kpi_set_updated_at on kra_kpi_tracker;
create trigger kra_kpi_set_updated_at
  before update on kra_kpi_tracker
  for each row execute function set_updated_at_kra_kpi();
