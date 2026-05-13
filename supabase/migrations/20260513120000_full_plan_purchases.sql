drop table if exists public.purchases;

create table public.purchases (
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

create index purchases_user_id_idx on public.purchases(user_id);
create index purchases_user_plan_status_idx on public.purchases(user_id, plan, status);

alter table public.purchases enable row level security;

create policy "Service role full access"
  on public.purchases for all
  using (true)
  with check (true);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reports'
      and column_name = 'user_id'
      and data_type = 'uuid'
  ) then
    alter table public.reports alter column user_id type text;
  end if;
end $$;
