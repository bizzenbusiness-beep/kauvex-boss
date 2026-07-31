-- ============================================================
-- KAUVEX OPS — ROLE STRUCTURE UPGRADE
-- Replaces the old 6-role model (kauvex_owner/admin/team,
-- client_leader/admin/team) with the real BizZen Business Framex
-- role structure — 17 company-level roles + 5 platform-level
-- (BizZen team) roles. Also adds Notes, Appointments, and the
-- BFSPL / BFSPC / BFSPI stage category on companies.
--
-- Run this AFTER all previous kauvex_ops_*.sql files.
-- Safe to run once — it migrates existing rows.
-- ============================================================

-- ---------- 1. Migrate the `role` column from enum to text ----------
alter table profiles add column if not exists role_new text;

update profiles set role_new = case
  when role::text = 'kauvex_owner' then 'platform_owner'
  when role::text = 'kauvex_admin' then 'platform_support'
  when role::text = 'kauvex_team'  then 'platform_dev'
  when role::text = 'client_leader' then 'bdd'
  when role::text = 'client_admin'  then 'bgm'
  when role::text = 'client_team'   then 'staff'
  else role::text
end
where role_new is null;

alter table profiles drop column role;
alter table profiles rename column role_new to role;
alter table profiles alter column role set not null;

alter table profiles add constraint profiles_role_check check (
  role in (
    -- Company-level (tied to a company_id)
    'bdd',                  -- Managing Director
    'bgm',                  -- Chief General Manager
    'cbo',                  -- Chief Business Officer
    'bom',                  -- Chief Operations Officer
    'bdm',                  -- Chief Development Officer
    'cgo',                  -- Chief Growth Officer
    'accountant',           -- Finance Manager
    'manager',              -- Team Manager
    'sales',                -- Sales Executive
    'sales_manager',        -- Sales Manager
    'staff',                -- Office Staff
    'bso',                  -- System Administrator
    'hr',                   -- HR
    'marketing_executive',  -- Marketing Executive
    'marketing_manager',    -- Marketing Manager
    'team_leader',          -- Team Leader
    'company_investor',     -- Company Investor
    -- Platform-level (BizZen team only, company_id is null)
    'platform_owner',
    'platform_dev',
    'platform_support',
    'platform_bom',
    'platform_investor'
  )
);

-- Drop the old enum type (no longer used by any column)
drop type if exists user_role;

-- ---------- 2. Helper functions — updated for the new role set ----------
create or replace function is_kauvex_staff()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('platform_owner','platform_dev','platform_support','platform_bom','platform_investor')
  );
$$;

-- Company-side "full access" roles: the executive/admin tier who can
-- manage their company's data (add team, edit records, etc.)
create or replace function is_company_admin_or_leader()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('bdd','bgm','cbo','bom','bdm','cgo','bso')
  );
$$;

-- ---------- 3. Notes ----------
create table if not exists company_notes (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  author_id uuid references profiles(id),
  note text not null,
  created_at timestamptz default now()
);
alter table company_notes enable row level security;

create policy "notes_visibility" on company_notes for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "notes_insert" on company_notes for insert
  with check (is_kauvex_staff() or company_id = my_company_id());
create policy "notes_delete" on company_notes for delete
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

-- ---------- 4. Appointments ----------
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  title text not null,
  with_whom text,
  location text,
  appointment_date date,
  appointment_time time,
  status text default 'scheduled',  -- scheduled / completed / cancelled
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table appointments enable row level security;

create policy "appointments_visibility" on appointments for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "appointments_manage" on appointments for all
  using (is_kauvex_staff() or company_id = my_company_id())
  with check (is_kauvex_staff() or company_id = my_company_id());

-- ---------- 5. BFSP stage category on companies ----------
-- BFSPL = Learning (client is still learning the system)
-- BFSPC = Creation (system is being built/customized for them)
-- BFSPI = Implementation (system is live and being implemented)
alter table companies add column if not exists bfsp_category text
  check (bfsp_category in ('bfspl','bfspc','bfspi'));
