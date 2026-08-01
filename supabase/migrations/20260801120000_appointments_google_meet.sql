-- Google Meet integration: real Calendar-generated meeting links on appointments,
-- plus a single-row table holding the shared TheBeetamin Google account's OAuth tokens.

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
