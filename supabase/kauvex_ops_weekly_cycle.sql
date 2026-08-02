-- ============================================================
-- WEEKLY GOVERNANCE CYCLE
-- Friday (Green) — Consultant + Owner plan the week
-- Saturday (Blue) — Owner + Operating Leaders review the week, fix gaps
-- Sunday (Orange) — Operating team hands off documents, AI verifies first
-- Monday (Red) — BizZen admin does manual second verification;
--                Owner submits AI-based report of dept-head acceptance
-- ============================================================

create table if not exists weekly_cycle (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  week_of date not null,  -- the Friday date this cycle belongs to

  green_status text default 'pending' check (green_status in ('pending','done')),
  green_notes text,        -- Friday: Consultant + Owner — plan for Mon-Sat

  blue_status text default 'pending' check (blue_status in ('pending','done')),
  blue_notes text,         -- Saturday: Owner + Leaders — last week review, gaps, next week design

  orange_status text default 'pending' check (orange_status in ('pending','done')),
  orange_ai_verification text,  -- AI's verification of the Mon-Sat handoff documents

  red_status text default 'pending' check (red_status in ('pending','done')),
  red_verified_by text,    -- BizZen BFSPI admin who did the manual second verification
  red_owner_report text,   -- AI-based report: which dept heads/executives accepted their tasks

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, week_of)
);

alter table weekly_cycle enable row level security;

create policy "weekly_cycle_visibility" on weekly_cycle for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "weekly_cycle_manage" on weekly_cycle for all
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()))
  with check (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

create or replace function set_updated_at_weekly_cycle()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists weekly_cycle_set_updated_at on weekly_cycle;
create trigger weekly_cycle_set_updated_at
  before update on weekly_cycle
  for each row execute function set_updated_at_weekly_cycle();
