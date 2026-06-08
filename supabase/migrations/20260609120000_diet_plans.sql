-- Diet plans: nutritionist uploads a personalised PDF for a client; customer is notified.
create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  client_email text not null,
  title text not null,
  storage_path text not null,
  file_name text not null,
  file_size_kb integer,
  status text not null default 'published',
  version integer not null default 1,
  notified_at timestamptz,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists diet_plans_client_id_idx on public.diet_plans (client_id);
create index if not exists diet_plans_client_email_idx on public.diet_plans (client_email);
create index if not exists diet_plans_nutritionist_id_idx on public.diet_plans (nutritionist_id);

comment on table public.diet_plans is
  'Personalised diet plan PDFs uploaded by a nutritionist and delivered to the client.';

-- Private storage bucket for diet plan PDFs (signed URLs issued server-side).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diet-plans',
  'diet-plans',
  false,
  10485760,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
