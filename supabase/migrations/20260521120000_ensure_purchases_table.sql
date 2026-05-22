-- Safe idempotent purchases table (does not drop existing data).
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  plan text not null,
  amount integer not null,
  txnid text not null unique,
  payment_id text,
  status text not null default 'pending',
  mode text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.purchases
  add column if not exists mode text,
  add column if not exists sessions_used integer default 0,
  add column if not exists sessions_total integer default 0,
  add column if not exists updated_at timestamptz default now();

create index if not exists purchases_user_id_idx on public.purchases(user_id);
create index if not exists purchases_user_plan_status_idx on public.purchases(user_id, plan, status);

alter table public.purchases enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'purchases'
      and policyname = 'Service role full access'
  ) then
    create policy "Service role full access"
      on public.purchases for all
      using (true)
      with check (true);
  end if;
end $$;
