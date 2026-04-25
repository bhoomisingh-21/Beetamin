-- Paid report tied to one detailed assessment; deficiency snapshot; Cal.com uid; progress logs; client height for BMI.
-- App uses Clerk `user_id` text on paid_reports — assessment_id links to detailed_assessments.id.

alter table public.paid_reports
  add column if not exists assessment_id uuid references public.detailed_assessments (id) on delete set null;

alter table public.paid_reports
  add column if not exists deficiency_summary jsonb;

create unique index if not exists paid_reports_assessment_id_unique
  on public.paid_reports (assessment_id)
  where assessment_id is not null;

alter table public.appointments
  add column if not exists external_booking_uid text;

create unique index if not exists appointments_external_booking_uid_unique
  on public.appointments (external_booking_uid)
  where external_booking_uid is not null;

alter table public.clients
  add column if not exists height_cm numeric(5, 2);

create table if not exists public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  bmi numeric(4, 2),
  energy_level integer check (energy_level between 1 and 10),
  notes text,
  logged_at date not null default (current_date at time zone 'utc'),
  created_at timestamptz not null default now(),
  unique (user_id, logged_at)
);

create index if not exists progress_logs_user_id_logged_at_idx on public.progress_logs (user_id, logged_at desc);

alter table public.progress_logs enable row level security;

drop policy if exists "progress_logs_select_own" on public.progress_logs;
drop policy if exists "progress_logs_insert_own" on public.progress_logs;
drop policy if exists "progress_logs_update_own" on public.progress_logs;
drop policy if exists "progress_logs_delete_own" on public.progress_logs;
drop policy if exists "users can manage own logs" on public.progress_logs;

create policy "progress_logs_select_own"
  on public.progress_logs for select
  using (auth.jwt() is not null and (auth.jwt()->>'sub') is not null and (auth.jwt()->>'sub') = user_id);

create policy "progress_logs_insert_own"
  on public.progress_logs for insert
  with check (auth.jwt() is not null and (auth.jwt()->>'sub') is not null and (auth.jwt()->>'sub') = user_id);

create policy "progress_logs_update_own"
  on public.progress_logs for update
  using (auth.jwt() is not null and (auth.jwt()->>'sub') is not null and (auth.jwt()->>'sub') = user_id);

create policy "progress_logs_delete_own"
  on public.progress_logs for delete
  using (auth.jwt() is not null and (auth.jwt()->>'sub') is not null and (auth.jwt()->>'sub') = user_id);
