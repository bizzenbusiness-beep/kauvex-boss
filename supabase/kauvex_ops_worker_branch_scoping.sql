-- ============================================================
-- WORKER BRANCH SCOPING
-- Lets a company-level user (worker) be tied to one specific
-- branch, so their Project Coordination / Activity views only
-- show that branch's data.
-- ============================================================

alter table profiles add column if not exists branch_id uuid references branches(id) on delete set null;

-- Helper: current user's branch (null = not branch-scoped, e.g. admins/leaders who see all)
create or replace function my_branch_id()
returns uuid language sql stable security definer as $$
  select branch_id from profiles where id = auth.uid();
$$;
