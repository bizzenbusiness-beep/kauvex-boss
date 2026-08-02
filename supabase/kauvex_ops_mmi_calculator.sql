-- ============================================================
-- M-M-I CALCULATOR
-- Measure -> Monitor -> Improve loop, optionally linked to a
-- KRA/KPI Tracker row.
-- ============================================================

create table if not exists mmi_records (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  kpi_id uuid references kra_kpi_tracker(id) on delete set null,
  title text not null,   -- fallback label if not linked to a KPI row

  measure_notes text,      -- how it's measured, current baseline
  measure_status text default 'pending' check (measure_status in ('pending','done')),

  monitor_notes text,      -- monitoring method / observations
  monitor_frequency text,  -- daily/weekly/monthly
  monitor_status text default 'pending' check (monitor_status in ('pending','done')),

  improve_notes text,      -- action plan
  improve_target text,     -- target value/outcome
  improve_deadline date,
  improve_status text default 'pending' check (improve_status in ('pending','done')),

  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table mmi_records enable row level security;

create policy "mmi_visibility" on mmi_records for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "mmi_manage" on mmi_records for all
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()))
  with check (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

create or replace function set_updated_at_mmi()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mmi_set_updated_at on mmi_records;
create trigger mmi_set_updated_at
  before update on mmi_records
  for each row execute function set_updated_at_mmi();
