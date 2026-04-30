-- Upsert uses ON CONFLICT (user_id, logged_at); Postgres requires a matching unique index.
-- Older DBs may lack UNIQUE(user_id, logged_at) if progress_logs existed before the constraint was added.

delete from public.progress_logs
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by user_id, logged_at
        order by created_at desc nulls last
      ) as rn
    from public.progress_logs
  ) t
  where t.rn > 1
);

create unique index if not exists progress_logs_user_id_logged_at_unique
  on public.progress_logs (user_id, logged_at);
