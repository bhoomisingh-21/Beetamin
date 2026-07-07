-- Health Risk Assessment (HRA) filled by nutritionists during client intake.
alter table public.clients
  add column if not exists nutritionist_hra jsonb not null default '{}'::jsonb;

comment on column public.clients.nutritionist_hra is
  'Structured HRA intake form completed by the assigned nutritionist (not visible to client as contact info).';
