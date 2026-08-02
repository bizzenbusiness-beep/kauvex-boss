-- ============================================================
-- BUSINESS METRICS, STRATEGY & ROLE PERFORMANCE RATIO
-- ============================================================

-- ---------- Business Metrics & Strategy (on companies) ----------
alter table companies add column if not exists current_income numeric;
alter table companies add column if not exists market_share_pct numeric;
alter table companies add column if not exists client_retention_pct numeric;
alter table companies add column if not exists competition_ratio text;
alter table companies add column if not exists anticipation_strategy text;
alter table companies add column if not exists penetration_strategy text;
alter table companies add column if not exists bottleneck_notes text;

-- ---------- Role Performance Ratio (on team_members) ----------
-- expected_performance_pct = what the role should deliver (target)
-- actual_performance_pct   = what they are actually delivering
-- loss_ratio is computed client-side as (expected - actual)
alter table team_members add column if not exists expected_performance_pct numeric check (expected_performance_pct between 0 and 100);
alter table team_members add column if not exists actual_performance_pct numeric check (actual_performance_pct between 0 and 100);
alter table team_members add column if not exists performance_notes text;
