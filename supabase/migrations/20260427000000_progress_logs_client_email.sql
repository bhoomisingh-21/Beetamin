-- Optional denormalized email on progress_logs for operational lookup (RLS unchanged).
alter table public.progress_logs
  add column if not exists client_email text;
