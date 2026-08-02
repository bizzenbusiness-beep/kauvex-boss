-- ============================================================
-- AI DAILY SUMMARY
-- Stores the auto-generated end-of-day paragraph (highlight /
-- challenge / tomorrow's prep) so owners can look back over time.
-- ============================================================

create table if not exists daily_ai_summaries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  summary_date date not null default current_date,
  summary_text text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique (company_id, summary_date)
);

alter table daily_ai_summaries enable row level security;

create policy "daily_summary_visibility" on daily_ai_summaries for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "daily_summary_manage" on daily_ai_summaries for all
  using (is_kauvex_staff() or company_id = my_company_id())
  with check (is_kauvex_staff() or company_id = my_company_id());
