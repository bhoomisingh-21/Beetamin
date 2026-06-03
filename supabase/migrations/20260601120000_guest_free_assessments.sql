-- Guest free quiz snapshots keyed by email (restored after Clerk sign-up / sign-in).
create table if not exists public.guest_free_assessments (
  email text primary key,
  assessment_result jsonb not null,
  assessment_meta jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.guest_free_assessments is
  'Free assessment taken before auth; merged into clients.assessment_result on login when emails match.';
