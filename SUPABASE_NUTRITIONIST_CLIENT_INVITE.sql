-- ============================================================
-- TheBeetamin — Nutritionist "Add client" + HRA form (invite flow)
-- Run ONCE in Supabase Dashboard → SQL Editor → New query → Run
-- Fixes: "could not find client_source column of clients in schema cache"
-- Fixes: "could not find nutritionist_hra column of clients in schema cache"
-- ============================================================

-- Health Risk Assessment (HRA) filled by nutritionists during client intake.
alter table public.clients
  add column if not exists nutritionist_hra jsonb not null default '{}'::jsonb;

alter table public.clients
  add column if not exists client_source text not null default 'marketplace';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clients_client_source_check'
  ) then
    alter table public.clients
      add constraint clients_client_source_check
      check (client_source in ('marketplace', 'nutritionist_invited'));
  end if;
end $$;

create table if not exists public.nutritionist_client_links (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'archived')),
  invited_at timestamptz not null default now(),
  unique (nutritionist_id, client_id)
);

create index if not exists idx_nutritionist_client_links_nut
  on public.nutritionist_client_links (nutritionist_id);

create index if not exists idx_nutritionist_client_links_client
  on public.nutritionist_client_links (client_id);

comment on table public.nutritionist_client_links is
  'Direct CRM link between nutritionist and client (freelance / invited clients).';

-- After running: wait ~30 seconds for Supabase schema cache to refresh, then retry Add client.
