-- Clerk user IDs look like "user_xxxxxxxx" — not UUIDs.
-- If progress_logs.user_id was uuid, ALTER TYPE fails until RLS policies that reference user_id are dropped.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'progress_logs'
      and column_name = 'user_id'
      and udt_name = 'uuid'
  ) then
    drop policy if exists "progress_logs_select_own" on public.progress_logs;
    drop policy if exists "progress_logs_insert_own" on public.progress_logs;
    drop policy if exists "progress_logs_update_own" on public.progress_logs;
    drop policy if exists "progress_logs_delete_own" on public.progress_logs;
    drop policy if exists "users can manage own logs" on public.progress_logs;

    alter table public.progress_logs drop constraint if exists progress_logs_user_id_logged_at_key;
    drop index if exists progress_logs_user_id_logged_at_unique;

    alter table public.progress_logs
      alter column user_id type text using user_id::text;

    create unique index if not exists progress_logs_user_id_logged_at_unique
      on public.progress_logs (user_id, logged_at);

    create policy "progress_logs_select_own"
      on public.progress_logs for select
      using (
        auth.jwt() is not null
        and (auth.jwt()->>'sub') is not null
        and (auth.jwt()->>'sub')::text = user_id::text
      );

    create policy "progress_logs_insert_own"
      on public.progress_logs for insert
      with check (
        auth.jwt() is not null
        and (auth.jwt()->>'sub') is not null
        and (auth.jwt()->>'sub')::text = user_id::text
      );

    create policy "progress_logs_update_own"
      on public.progress_logs for update
      using (
        auth.jwt() is not null
        and (auth.jwt()->>'sub') is not null
        and (auth.jwt()->>'sub')::text = user_id::text
      );

    create policy "progress_logs_delete_own"
      on public.progress_logs for delete
      using (
        auth.jwt() is not null
        and (auth.jwt()->>'sub') is not null
        and (auth.jwt()->>'sub')::text = user_id::text
      );
  end if;
end $$;
