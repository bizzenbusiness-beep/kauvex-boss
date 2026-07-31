-- ============================================================
-- FIX: infinite recursion in profiles RLS policies
-- The old policies queried `profiles` directly inside a policy
-- ON profiles, which causes Postgres to re-trigger the same
-- policy recursively (500 error). Fix: route through the
-- existing SECURITY DEFINER function is_kauvex_staff(), and a
-- new one for the admin-only management policy.
-- ============================================================

create or replace function is_kauvex_admin_or_owner()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('kauvex_owner','kauvex_admin')
  );
$$;

drop policy if exists "kauvex_reads_all_profiles" on profiles;
create policy "kauvex_reads_all_profiles" on profiles for select
  using (is_kauvex_staff());

drop policy if exists "kauvex_admins_manage_profiles" on profiles;
create policy "kauvex_admins_manage_profiles" on profiles for all
  using (is_kauvex_admin_or_owner())
  with check (is_kauvex_admin_or_owner());

-- "read_own_profile" (id = auth.uid()) is untouched — it never
-- had a recursion problem.
