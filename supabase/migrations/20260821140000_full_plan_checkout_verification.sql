-- Full-plan (₹3,999) checkout: profile fields + OTP challenges before PayU.

alter table public.clients
  add column if not exists age integer,
  add column if not exists address_line text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists pincode text,
  add column if not exists phone_verified_at timestamptz;

create table if not exists public.checkout_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  channel text not null check (channel in ('phone', 'email')),
  destination text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists checkout_otp_challenges_user_created_idx
  on public.checkout_otp_challenges (clerk_user_id, created_at desc);
