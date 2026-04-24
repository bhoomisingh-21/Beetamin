-- Allow signed-in app users (Clerk JWT via Supabase third-party auth) to read their own paid_reports rows for status polling.
-- Service role (server) bypasses RLS.

alter table public.paid_reports enable row level security;

drop policy if exists "paid_reports_select_own_clerk_sub" on public.paid_reports;

create policy "paid_reports_select_own_clerk_sub"
  on public.paid_reports
  for select
  using (
    auth.jwt() is not null
    and (auth.jwt()->>'sub') is not null
    and (auth.jwt()->>'sub') = user_id
  );
