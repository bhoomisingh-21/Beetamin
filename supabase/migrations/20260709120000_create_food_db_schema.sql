-- Phase 1: Food database schema for nutritionist meal-plan CRM.
-- Uses existing public.clients + public.meal_plans (no separate patients table).
-- created_by columns reference public.nutritionists (Clerk-linked), not auth.users.

-- Foods (base nutrition data)

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  category varchar(50),
  default_unit varchar(20),
  default_qty_grams decimal(6, 2),
  kcal_per_100g decimal(6, 2),
  carbs_g_per_100g decimal(6, 2),
  protein_g_per_100g decimal(6, 2),
  fat_g_per_100g decimal(6, 2),
  fiber_g_per_100g decimal(6, 2),
  tags text[],
  source varchar(20) not null default 'custom' check (source in ('ifct', 'custom')),
  is_verified boolean not null default false,
  created_by uuid references public.nutritionists(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_foods_name on public.foods using gin (to_tsvector('english', name));
create index if not exists idx_foods_source on public.foods (source);
create index if not exists idx_foods_created_by on public.foods (created_by) where created_by is not null;

comment on table public.foods is 'Nutrition catalog: IFCT verified rows and nutritionist custom foods.';

-- Recipes

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  serving_size varchar(50),
  created_by uuid references public.nutritionists(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_recipes_created_by on public.recipes (created_by) where created_by is not null;

-- Recipe ingredients

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete restrict,
  qty_grams decimal(6, 2) not null check (qty_grams > 0)
);

create index if not exists idx_recipe_ingredients_recipe on public.recipe_ingredients (recipe_id);

-- Extend existing meal_plans with calendar fields

alter table public.meal_plans add column if not exists start_date date;
alter table public.meal_plans add column if not exists end_date date;
alter table public.meal_plans add column if not exists target_kcal int;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'meal_plans_target_kcal_positive'
  ) then
    alter table public.meal_plans
      add constraint meal_plans_target_kcal_positive
      check (target_kcal is null or target_kcal > 0);
  end if;
end $$;

comment on column public.meal_plans.start_date is 'First day of meal_plan_entries calendar.';
comment on column public.meal_plans.end_date is 'Last day of meal_plan_entries calendar.';
comment on column public.meal_plans.target_kcal is 'Daily kcal target for template scaling.';

-- Templates

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  condition_tags text[] not null default '{}',
  target_kcal int,
  created_by uuid not null references public.nutritionists(id) on delete cascade,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'templates_target_kcal_positive'
  ) then
    alter table public.templates
      add constraint templates_target_kcal_positive
      check (target_kcal is null or target_kcal > 0);
  end if;
end $$;

create index if not exists idx_templates_created_by on public.templates (created_by);
create index if not exists idx_templates_condition_tags on public.templates using gin (condition_tags);

-- Template entries

create table if not exists public.template_entries (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  day_number int not null check (day_number >= 1),
  meal_slot varchar(50) not null,
  food_id uuid references public.foods(id) on delete set null,
  recipe_id uuid references public.recipes(id) on delete set null,
  qty_grams decimal(6, 2) check (qty_grams is null or qty_grams > 0),
  constraint template_entries_food_or_recipe check (food_id is not null or recipe_id is not null)
);

create index if not exists idx_template_entries_template on public.template_entries (template_id, day_number);

-- Normalized meal plan entries (alongside JSONB meal_plans.days)

create table if not exists public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  entry_date date not null,
  meal_slot varchar(50) not null,
  food_id uuid references public.foods(id) on delete set null,
  recipe_id uuid references public.recipes(id) on delete set null,
  qty_grams decimal(6, 2) not null check (qty_grams > 0),
  kcal decimal(6, 2),
  carbs_g decimal(6, 2),
  protein_g decimal(6, 2),
  fat_g decimal(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plan_entries_food_or_recipe check (food_id is not null or recipe_id is not null)
);

create index if not exists idx_mpe_plan_date on public.meal_plan_entries (meal_plan_id, entry_date);
create index if not exists idx_mpe_plan_slot on public.meal_plan_entries (meal_plan_id, entry_date, meal_slot);

comment on table public.meal_plan_entries is 'Normalized meal items; macro trigger added in a later migration.';
