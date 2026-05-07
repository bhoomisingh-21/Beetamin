-- Store free quiz JSON on the paid report row so PDF generation survives races
-- (workers used to rely only on clients.assessment_result).

alter table public.paid_reports
  add column if not exists free_assessment_snapshot jsonb;

comment on column public.paid_reports.free_assessment_snapshot is
  'Free health assessment snapshot at generation time — source of truth for Groq/PDF alongside clients.';
