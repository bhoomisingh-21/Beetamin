-- Phase 1 Section 2: Row Level Security for food DB + meal plan tables.
-- Auth model matches nutritionist_notes: Clerk JWT sub -> nutritionists.clerk_user_id.
-- Server actions using service_role bypass RLS (seed script, portal actions).

-- Helper: resolve logged-in Clerk nutritionist to public.nutritionists.id

create or replace function public.current_nutritionist_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select n.id
  from public.nutritionists n
  where n.clerk_user_id is not null
    and n.clerk_user_id = (auth.jwt() ->> 'sub')
  limit 1;
$$;

revoke all on function public.current_nutritionist_id() from public;
grant execute on function public.current_nutritionist_id() to authenticated;

-- ─── foods ───────────────────────────────────────────────────────────────────

alter table public.foods enable row level security;

drop policy if exists foods_select_authenticated on public.foods;
drop policy if exists foods_insert_custom on public.foods;
drop policy if exists foods_update_custom on public.foods;
drop policy if exists foods_delete_custom on public.foods;

create policy foods_select_authenticated
  on public.foods
  for select
  to authenticated
  using (
    source = 'ifct'
    or created_by = public.current_nutritionist_id()
  );

create policy foods_insert_custom
  on public.foods
  for insert
  to authenticated
  with check (
    source = 'custom'
    and created_by = public.current_nutritionist_id()
  );

create policy foods_update_custom
  on public.foods
  for update
  to authenticated
  using (
    source = 'custom'
    and created_by = public.current_nutritionist_id()
  )
  with check (
    source = 'custom'
    and created_by = public.current_nutritionist_id()
  );

create policy foods_delete_custom
  on public.foods
  for delete
  to authenticated
  using (
    source = 'custom'
    and created_by = public.current_nutritionist_id()
  );

-- ─── recipes ─────────────────────────────────────────────────────────────────

alter table public.recipes enable row level security;

drop policy if exists recipes_all_own on public.recipes;

create policy recipes_all_own
  on public.recipes
  for all
  to authenticated
  using (created_by = public.current_nutritionist_id())
  with check (created_by = public.current_nutritionist_id());

-- ─── recipe_ingredients ──────────────────────────────────────────────────────

alter table public.recipe_ingredients enable row level security;

drop policy if exists recipe_ingredients_all_own on public.recipe_ingredients;

create policy recipe_ingredients_all_own
  on public.recipe_ingredients
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.created_by = public.current_nutritionist_id()
    )
  )
  with check (
    exists (
      select 1
      from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.created_by = public.current_nutritionist_id()
    )
  );

-- ─── templates ───────────────────────────────────────────────────────────────

alter table public.templates enable row level security;

drop policy if exists templates_all_own on public.templates;

create policy templates_all_own
  on public.templates
  for all
  to authenticated
  using (created_by = public.current_nutritionist_id())
  with check (created_by = public.current_nutritionist_id());

-- ─── template_entries ────────────────────────────────────────────────────────

alter table public.template_entries enable row level security;

drop policy if exists template_entries_all_own on public.template_entries;

create policy template_entries_all_own
  on public.template_entries
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.templates t
      where t.id = template_entries.template_id
        and t.created_by = public.current_nutritionist_id()
    )
  )
  with check (
    exists (
      select 1
      from public.templates t
      where t.id = template_entries.template_id
        and t.created_by = public.current_nutritionist_id()
    )
  );

-- ─── meal_plans (existing table) ─────────────────────────────────────────────

alter table public.meal_plans enable row level security;

drop policy if exists meal_plans_all_own on public.meal_plans;

create policy meal_plans_all_own
  on public.meal_plans
  for all
  to authenticated
  using (nutritionist_id = public.current_nutritionist_id())
  with check (nutritionist_id = public.current_nutritionist_id());

-- ─── meal_plan_entries ───────────────────────────────────────────────────────

alter table public.meal_plan_entries enable row level security;

drop policy if exists meal_plan_entries_all_own on public.meal_plan_entries;

create policy meal_plan_entries_all_own
  on public.meal_plan_entries
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_entries.meal_plan_id
        and mp.nutritionist_id = public.current_nutritionist_id()
    )
  )
  with check (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_entries.meal_plan_id
        and mp.nutritionist_id = public.current_nutritionist_id()
    )
  );
