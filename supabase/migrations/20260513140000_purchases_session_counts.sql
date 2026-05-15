alter table public.purchases
  add column if not exists sessions_used integer default 0,
  add column if not exists sessions_total integer default 0;
