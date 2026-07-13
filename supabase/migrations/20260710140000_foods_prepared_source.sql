-- Prepared Indian meals (Fitrofy-style dish names) searchable alongside IFCT ingredients.

alter table public.foods drop constraint if exists foods_source_check;

alter table public.foods
  add constraint foods_source_check check (source in ('ifct', 'custom', 'prepared'));

create unique index if not exists idx_foods_name_source on public.foods (name, source);

drop policy if exists foods_select_authenticated on public.foods;

create policy foods_select_authenticated
  on public.foods
  for select
  to authenticated
  using (
    source in ('ifct', 'prepared')
    or created_by = public.current_nutritionist_id()
  );

comment on table public.foods is 'Nutrition catalog: IFCT ingredients, prepared Indian meals, and custom foods.';
