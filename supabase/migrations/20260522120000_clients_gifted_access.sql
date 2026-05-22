-- Gifted plan access (family/friends bypass PayU). Stored on `clients` (Clerk users map here).
alter table public.clients
  add column if not exists is_gifted_access boolean not null default false,
  add column if not exists gifted_plan text,
  add column if not exists gifted_at timestamptz,
  add column if not exists gifted_note text;

comment on column public.clients.gifted_plan is 'report = ₹39 report plan; full_plan = ₹3,999 Full Recovery Plan';
