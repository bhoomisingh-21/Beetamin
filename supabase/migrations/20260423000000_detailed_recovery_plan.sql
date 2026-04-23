-- Detailed Recovery Plan — NEW tables & storage (run in Supabase SQL editor or CLI)
-- Does not modify existing tables.

create table if not exists public.detailed_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  diet_type text not null,
  food_frequency jsonb not null default '{}'::jsonb,
  sun_exposure text not null,
  physical_symptoms text[] not null default '{}',
  energy_mood text not null,
  sleep_quality text not null,
  digestion text not null,
  exercise_level text not null,
  water_intake text not null,
  menstrual_health text,
  created_at timestamptz not null default now()
);

create index if not exists detailed_assessments_user_id_idx on public.detailed_assessments (user_id);
create index if not exists detailed_assessments_created_at_idx on public.detailed_assessments (created_at desc);

create table if not exists public.paid_reports (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  report_id text not null unique,
  pdf_url text not null,
  payment_id text,
  amount integer not null default 39,
  status text not null default 'generated',
  created_at timestamptz not null default now()
);

create index if not exists paid_reports_user_id_idx on public.paid_reports (user_id);
create index if not exists paid_reports_report_id_idx on public.paid_reports (report_id);

-- Private bucket for PDFs (signed URLs issued server-side)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reports',
  'reports',
  false,
  52428800,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Service role uploads from backend; optional: restrict authenticated read via policies if you add client-side access later.
-- For admin API-only access, no extra policies are required when using the service role key.
