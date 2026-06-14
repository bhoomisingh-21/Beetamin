-- Structured day-by-day meal plans created by nutritionists and delivered to clients.
-- Separate from diet_plans (PDF upload); this table stores editable JSON meal data.

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  client_email text not null,
  title text not null default 'My Personalised Meal Plan',
  nutritionist_notes text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  days jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meal_plans_client_id_idx on public.meal_plans (client_id);
create index if not exists meal_plans_client_email_idx on public.meal_plans (client_email);
create index if not exists meal_plans_nutritionist_id_idx on public.meal_plans (nutritionist_id);
create index if not exists meal_plans_status_idx on public.meal_plans (status);

comment on table public.meal_plans is
  'Day-by-day structured meal plans created by nutritionists. days column is a JSONB array of MealPlanDay objects.';

comment on column public.meal_plans.days is
  'Array of { day: number, meals: { early_morning, breakfast, mid_morning, lunch, evening_snack, dinner, bedtime }, water_target?, day_notes? }';
