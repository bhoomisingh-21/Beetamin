-- Guest free-assessment OTP (phone/email) before result reveal.
-- Independent of Clerk; keyed by a browser session_id.

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

create index if not exists assessment_otp_challenges_session_created_idx
  on public.assessment_otp_challenges (session_id, created_at desc);

comment on table public.assessment_otp_challenges is
  'OTP challenges for the free assessment lead-capture gate (pre-auth).';
