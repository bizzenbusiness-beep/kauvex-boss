-- ============================================================
-- MEETING ROOM
-- Meeting types, start/end tracking, check-in/out, file/voice/
-- video/image/PDF attachments (Supabase Storage), CSV import/export
-- (CSV handled client-side, no DB change needed for that part).
-- ============================================================

create table if not exists meetings (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  meeting_type text not null,   -- brief / review / board / evaluation / valuation / measure / monitor / improving / emergency / agenda / other
  title text not null,
  agenda text,
  attendees text,
  start_time timestamptz,
  end_time timestamptz,
  status text default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  checkin_time timestamptz,
  checkin_method text,          -- manual / faceid
  checkout_time timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table meetings enable row level security;

create policy "meetings_visibility" on meetings for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "meetings_manage" on meetings for all
  using (is_kauvex_staff() or company_id = my_company_id())
  with check (is_kauvex_staff() or company_id = my_company_id());

-- ---------- Attachments (voice / video / image / pdf / file) ----------
create table if not exists meeting_attachments (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid references meetings(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  file_name text,
  file_type text,      -- voice / video / image / pdf / csv / file
  file_url text not null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table meeting_attachments enable row level security;

create policy "meeting_attachments_visibility" on meeting_attachments for select
  using (is_kauvex_staff() or company_id = my_company_id());
create policy "meeting_attachments_manage" on meeting_attachments for all
  using (is_kauvex_staff() or company_id = my_company_id())
  with check (is_kauvex_staff() or company_id = my_company_id());

-- ---------- Storage bucket for meeting files ----------
insert into storage.buckets (id, name, public)
values ('meeting-files', 'meeting-files', true)
on conflict (id) do nothing;

drop policy if exists "meeting_files_read" on storage.objects;
create policy "meeting_files_read" on storage.objects for select
  using (bucket_id = 'meeting-files');

drop policy if exists "meeting_files_insert" on storage.objects;
create policy "meeting_files_insert" on storage.objects for insert
  with check (bucket_id = 'meeting-files' and auth.role() = 'authenticated');

drop policy if exists "meeting_files_delete" on storage.objects;
create policy "meeting_files_delete" on storage.objects for delete
  using (bucket_id = 'meeting-files' and auth.role() = 'authenticated');
