-- Phase 1 Section 3: Auto-compute macros on meal_plan_entries + updated_at sync.

create or replace function public.compute_entry_nutrition()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_kcal numeric := 0;
  v_carbs numeric := 0;
  v_protein numeric := 0;
  v_fat numeric := 0;
  v_total_recipe_grams numeric := 0;
begin
  if new.qty_grams is null or new.qty_grams <= 0 then
    return new;
  end if;

  if new.food_id is not null then
    select
      coalesce(f.kcal_per_100g, 0) * new.qty_grams / 100,
      coalesce(f.carbs_g_per_100g, 0) * new.qty_grams / 100,
      coalesce(f.protein_g_per_100g, 0) * new.qty_grams / 100,
      coalesce(f.fat_g_per_100g, 0) * new.qty_grams / 100
    into v_kcal, v_carbs, v_protein, v_fat
    from public.foods f
    where f.id = new.food_id;

    if not found then
      raise exception 'food_id % not found', new.food_id;
    end if;

  elsif new.recipe_id is not null then
    select coalesce(sum(ri.qty_grams), 0)
    into v_total_recipe_grams
    from public.recipe_ingredients ri
    where ri.recipe_id = new.recipe_id;

    if v_total_recipe_grams > 0 then
      select
        coalesce(sum(coalesce(f.kcal_per_100g, 0) * ri.qty_grams / 100), 0)
          * new.qty_grams / v_total_recipe_grams,
        coalesce(sum(coalesce(f.carbs_g_per_100g, 0) * ri.qty_grams / 100), 0)
          * new.qty_grams / v_total_recipe_grams,
        coalesce(sum(coalesce(f.protein_g_per_100g, 0) * ri.qty_grams / 100), 0)
          * new.qty_grams / v_total_recipe_grams,
        coalesce(sum(coalesce(f.fat_g_per_100g, 0) * ri.qty_grams / 100), 0)
          * new.qty_grams / v_total_recipe_grams
      into v_kcal, v_carbs, v_protein, v_fat
      from public.recipe_ingredients ri
      join public.foods f on f.id = ri.food_id
      where ri.recipe_id = new.recipe_id;
    end if;
  end if;

  new.kcal := round(v_kcal, 2);
  new.carbs_g := round(v_carbs, 2);
  new.protein_g := round(v_protein, 2);
  new.fat_g := round(v_fat, 2);

  return new;
end;
$$;

create or replace function public.set_meal_plan_entries_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_meal_plan_entries_nutrition on public.meal_plan_entries;
drop trigger if exists trg_meal_plan_entries_updated_at on public.meal_plan_entries;

create trigger trg_meal_plan_entries_nutrition
  before insert or update of food_id, recipe_id, qty_grams
  on public.meal_plan_entries
  for each row
  execute function public.compute_entry_nutrition();

create trigger trg_meal_plan_entries_updated_at
  before update on public.meal_plan_entries
  for each row
  execute function public.set_meal_plan_entries_updated_at();

comment on function public.compute_entry_nutrition() is
  'BEFORE INSERT/UPDATE on meal_plan_entries: sets kcal/carbs_g/protein_g/fat_g from foods or scaled recipe totals.';
