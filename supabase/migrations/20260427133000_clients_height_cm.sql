alter table public.clients
  add column if not exists height_cm numeric(5, 2);
