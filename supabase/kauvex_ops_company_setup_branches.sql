-- ============================================================
-- COMPANY SETUP + BRANCHES
-- Adds Business Category/Stage/Structure Profile fields to
-- companies, and a branches table (Company -> Branches -> Workers).
-- ============================================================

alter table companies add column if not exists business_category text;
alter table companies add column if not exists business_subcategory text;
alter table companies add column if not exists business_stage text
  check (business_stage in ('New Business','Struggle','Survival','Profitable','Scalable','Established Business','Legacy'));

-- Business Structure Profile — tag arrays, a company can carry several at once
alter table companies add column if not exists offering_type text[] default '{}';
alter table companies add column if not exists sales_channel text[] default '{}';
alter table companies add column if not exists value_chain_role text[] default '{}';
alter table companies add column if not exists team_size text
  check (team_size in ('Solo','Small Team (2-10)','Mid Team (11-50)','Big Team/Enterprise (50+)'));
alter table companies add column if not exists legal_structure text
  check (legal_structure in ('Sole Proprietorship','Partnership','LLP','Pvt Ltd','Public Ltd'));

-- ---------- Branches ----------
create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz default now()
);
alter table branches enable row level security;

create policy "branches_visibility" on branches for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "branches_manage" on branches for all
  using (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()))
  with check (is_kauvex_staff() or (company_id = my_company_id() and is_company_admin_or_leader()));

-- Let team members, tasks and activity be tied to a specific branch (optional)
alter table team_members add column if not exists branch_id uuid references branches(id) on delete set null;
alter table tasks add column if not exists branch_id uuid references branches(id) on delete set null;
alter table activity_logs add column if not exists branch_id uuid references branches(id) on delete set null;
