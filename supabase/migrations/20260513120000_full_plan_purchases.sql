create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  plan text not null,
  amount integer not null,
  payment_id text,
  txnid text unique,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_user_plan_status_idx
  on public.purchases (user_id, plan, status);
