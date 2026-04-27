-- Profile progress + wellness goals (clients + progress_logs)
alter table public.clients
  add column if not exists goals_progress jsonb default '{}'::jsonb;

alter table public.progress_logs
  add column if not exists water_ml integer default 0,
  add column if not exists sleep_hours numeric(4, 1),
  add column if not exists sleep_quality text;
