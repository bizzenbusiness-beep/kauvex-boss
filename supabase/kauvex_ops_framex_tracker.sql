-- ============================================================
-- BIZZEN BUSINESS FRAMEX IMPLEMENTATION TRACKER
-- Adds to the EXISTING kauvex-boss database — reuses the
-- existing `companies` table (no separate project/database).
-- Run this AFTER kauvex_ops_supabase_schema.sql,
-- kauvex_ops_auth_roles.sql, and kauvex_ops_fix_profiles_rls.sql
-- ============================================================

-- ---------- 6-Stage Implementation Journey ----------
create table if not exists framex_journey_stages (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  stage_key text not null,       -- system_writeup / site_visit / health_checkup / running_stage_analysis / system_demo / first_training
  stage_order int not null,
  status text default 'pending', -- pending / in_progress / done
  completed_date date,
  notes text,
  updated_at timestamptz default now(),
  unique (company_id, stage_key)
);

-- ---------- BOSS BMW Program tracker ----------
create table if not exists framex_boss_bmw (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  program_key text not null,     -- steacks / rise_month1_shift / rise_month2_surge / rise_month3_rise / flow / summit
  status text default 'pending',
  target_date date,
  completed_date date,
  notes text,
  updated_at timestamptz default now(),
  unique (company_id, program_key)
);

-- ---------- 5 Pillars x 7 Business Functions matrix ----------
create table if not exists framex_pillars_matrix (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  pillar_key text not null,      -- pom / pos / pom2 / sops / fmc
  function_key text not null,    -- management / hr / rnd / marketing / sales / operations / accounts
  status text default 'pending',
  notes text,
  updated_at timestamptz default now(),
  unique (company_id, pillar_key, function_key)
);

alter table framex_journey_stages enable row level security;
alter table framex_boss_bmw enable row level security;
alter table framex_pillars_matrix enable row level security;

-- Reuse the SAME access model as the rest of kauvex-boss:
-- Kauvex staff see/manage everything; client_leader/client_admin
-- manage their own company; client_team can view their own company.
create policy "framex_journey_visibility" on framex_journey_stages for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "framex_journey_manage" on framex_journey_stages for all
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()))
  with check (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

create policy "framex_bmw_visibility" on framex_boss_bmw for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "framex_bmw_manage" on framex_boss_bmw for all
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()))
  with check (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

create policy "framex_pillars_visibility" on framex_pillars_matrix for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "framex_pillars_manage" on framex_pillars_matrix for all
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()))
  with check (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

-- ---------- Seed the fixed rows for a company (call once per company) ----------
create or replace function framex_seed_company(p_company_id uuid)
returns void language plpgsql security definer as $$
declare
  pillar text;
  fn text;
begin
  insert into framex_journey_stages (company_id, stage_key, stage_order)
  values
    (p_company_id, 'system_writeup', 1),
    (p_company_id, 'site_visit', 2),
    (p_company_id, 'health_checkup', 3),
    (p_company_id, 'running_stage_analysis', 4),
    (p_company_id, 'system_demo', 5),
    (p_company_id, 'first_training', 6)
  on conflict (company_id, stage_key) do nothing;

  insert into framex_boss_bmw (company_id, program_key)
  values
    (p_company_id, 'steacks'),
    (p_company_id, 'rise_month1_shift'),
    (p_company_id, 'rise_month2_surge'),
    (p_company_id, 'rise_month3_rise'),
    (p_company_id, 'flow'),
    (p_company_id, 'summit')
  on conflict (company_id, program_key) do nothing;

  foreach pillar in array array['pom','pos','pom2','sops','fmc'] loop
    foreach fn in array array['management','hr','rnd','marketing','sales','operations','accounts'] loop
      insert into framex_pillars_matrix (company_id, pillar_key, function_key)
      values (p_company_id, pillar, fn)
      on conflict (company_id, pillar_key, function_key) do nothing;
    end loop;
  end loop;
end;
$$;
