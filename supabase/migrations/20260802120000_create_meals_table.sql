-- Tagged Indian meal database for the rule-based meal-selection engine (lib/meal-engine/).
-- Replaces the live-authored Groq mealPlan with deterministic selection from curated,
-- macro/allergen/diet-tagged rows. Populated once via scripts/seed-meal-database.ts.

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  meal_name text not null,
  meal_type text not null check (
    meal_type in ('breakfast', 'mid_morning_snack', 'lunch', 'evening_snack', 'dinner')
  ),
  cuisine text not null check (
    cuisine in (
      'north_indian',
      'south_indian',
      'gujarati',
      'maharashtrian',
      'punjabi',
      'bengali',
      'rajasthani',
      'indian_fusion'
    )
  ),
  -- A meal can satisfy several diets at once (e.g. a fruit bowl is vegan + vegetarian + jain-safe).
  diet_type text[] not null default '{}',
  health_tags text[] not null default '{}',
  calories numeric not null check (calories > 0),
  protein_g numeric not null check (protein_g >= 0),
  carbs_g numeric not null check (carbs_g >= 0),
  fat_g numeric not null check (fat_g >= 0),
  fiber_g numeric not null check (fiber_g >= 0),
  serving_size text not null,
  ingredients text[] not null default '{}',
  -- Empty array (not null) when a meal has no known allergens.
  allergens text[] not null default '{}',
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  preparation_time_minutes int not null check (preparation_time_minutes > 0),
  preparation_notes text,
  hydration_tip text,
  healthy_alternative text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.meals is
  'Curated, tagged Indian meal catalog for lib/meal-engine deterministic weekly plan selection. Seeded once via scripts/seed-meal-database.ts; edit rows directly in Supabase afterward.';

comment on column public.meals.diet_type is
  'Array of: vegetarian, vegan, jain, non_vegetarian. A meal can satisfy several diets at once.';
comment on column public.meals.health_tags is
  'Array of: high_protein, weight_loss, muscle_gain, pcos, diabetes, thyroid, iron_rich, calcium_rich, vitamin_d, vitamin_b12, high_fiber, low_carb, low_gi, heart_healthy, gut_friendly.';
comment on column public.meals.allergens is
  'Array of: nuts, dairy, gluten, soy, eggs, seafood (or others as needed). Empty array when a meal has no known allergens.';

-- Idempotent re-run safety if this migration is ever edited/reapplied against a partially-created table.
alter table public.meals add column if not exists preparation_notes text;
alter table public.meals add column if not exists hydration_tip text;
alter table public.meals add column if not exists healthy_alternative text;
alter table public.meals add column if not exists is_active boolean default true;

create index if not exists idx_meals_meal_type on public.meals (meal_type) where is_active;
create index if not exists idx_meals_cuisine on public.meals (cuisine) where is_active;
create index if not exists idx_meals_diet_type on public.meals using gin (diet_type);
create index if not exists idx_meals_health_tags on public.meals using gin (health_tags);
create index if not exists idx_meals_allergens on public.meals using gin (allergens);
create index if not exists idx_meals_name on public.meals using gin (to_tsvector('english', meal_name));

-- Read-only catalog: anonymous + authenticated clients can read active meals; writes are
-- service_role only (seed script / manual edits via Supabase dashboard).
alter table public.meals enable row level security;

drop policy if exists meals_select_active on public.meals;

create policy meals_select_active
  on public.meals
  for select
  to anon, authenticated
  using (is_active);
