-- PayU: unique merchant txnid per checkout row (nullable for legacy rows).

alter table public.paid_reports
  add column if not exists txnid text;

create unique index if not exists paid_reports_txnid_unique
  on public.paid_reports (txnid)
  where txnid is not null;
