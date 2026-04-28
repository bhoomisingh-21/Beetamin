-- height_cm for BMI on daily log rows (may be missing on older DBs)
alter table public.progress_logs
  add column if not exists height_cm numeric(5, 2);
