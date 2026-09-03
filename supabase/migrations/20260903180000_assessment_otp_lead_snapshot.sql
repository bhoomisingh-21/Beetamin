-- Compact lead snapshot + sheet-append flag for verified assessment OTPs.
-- Safe to run even if 20260903140000 was already applied.

create table if not exists public.assessment_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  channel text not null check (channel in ('phone', 'email')),
  destination text not null,
  code_hash text not null,
  name text,
  email text,
  phone text,
  age text,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.assessment_otp_challenges
  add column if not exists lead_snapshot jsonb,
  add column if not exists sheet_appended_at timestamptz;

create index if not exists assessment_otp_challenges_email_sheet_idx
  on public.assessment_otp_challenges (email)
  where sheet_appended_at is not null;
