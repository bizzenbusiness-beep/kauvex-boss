-- ============================================================
-- TASK TIMING: track when a task was assigned, started, and completed
-- ============================================================

alter table tasks add column if not exists started_at timestamptz;
alter table tasks add column if not exists completed_at timestamptz;

-- created_at (already exists) = when the task was assigned/given
-- started_at   = when it first moved to 'progress'
-- completed_at = when it moved to 'done'
