-- Phase 1 Section 4: apply_template() — copy template_entries into meal_plan_entries.
-- Macros are auto-filled by trg_meal_plan_entries_nutrition (Section 3).

create or replace function public.apply_template(
  p_template_id uuid,
  p_meal_plan_id uuid,
  p_start_date date,
  p_scale_factor numeric default 1.0
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inserted integer;
begin
  if p_template_id is null then
    raise exception 'p_template_id is required';
  end if;

  if p_meal_plan_id is null then
    raise exception 'p_meal_plan_id is required';
  end if;

  if p_start_date is null then
    raise exception 'p_start_date is required';
  end if;

  if p_scale_factor is null or p_scale_factor <= 0 then
    raise exception 'p_scale_factor must be greater than 0';
  end if;

  if not exists (select 1 from public.templates t where t.id = p_template_id) then
    raise exception 'template % not found', p_template_id;
  end if;

  if not exists (select 1 from public.meal_plans mp where mp.id = p_meal_plan_id) then
    raise exception 'meal_plan % not found', p_meal_plan_id;
  end if;

  insert into public.meal_plan_entries (
    meal_plan_id,
    entry_date,
    meal_slot,
    food_id,
    recipe_id,
    qty_grams
  )
  select
    p_meal_plan_id,
    p_start_date + (te.day_number - 1),
    te.meal_slot,
    te.food_id,
    te.recipe_id,
    round(te.qty_grams * p_scale_factor, 2)
  from public.template_entries te
  where te.template_id = p_template_id
    and te.qty_grams is not null
    and te.qty_grams > 0;

  get diagnostics v_inserted = row_count;

  return v_inserted;
end;
$$;

revoke all on function public.apply_template(uuid, uuid, date, numeric) from public;
grant execute on function public.apply_template(uuid, uuid, date, numeric) to authenticated;
grant execute on function public.apply_template(uuid, uuid, date, numeric) to service_role;

comment on function public.apply_template(uuid, uuid, date, numeric) is
  'Copies template_entries into meal_plan_entries. entry_date = p_start_date + (day_number - 1); qty_grams scaled by p_scale_factor. Returns rows inserted.';
