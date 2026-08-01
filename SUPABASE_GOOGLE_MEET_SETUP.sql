-- ============================================================
-- TheBeetamin — Google Meet integration for appointments
-- Run ONCE in Supabase Dashboard → SQL Editor → New query → Run
-- Adds: appointments.meet_link / google_event_id / meeting_created_at
--       + google_calendar_tokens table (stores the connected Google account)
-- ============================================================

alter table public.appointments
  add column if not exists meet_link text,
  add column if not exists google_event_id text,
  add column if not exists meeting_created_at timestamptz;

create table if not exists public.google_calendar_tokens (
  id             text primary key default 'primary',
  connected_email text,
  refresh_token  text not null,
  access_token   text,
  scope          text,
  token_type     text,
  expiry_date    bigint,
  updated_at     timestamptz not null default now()
);

comment on table public.google_calendar_tokens is
  'Single shared TheBeetamin Google account used to create real Google Meet-enabled Calendar events for confirmed sessions. One row (id=''primary'').';
