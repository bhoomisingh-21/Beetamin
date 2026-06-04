-- Tie free quiz JSON to the paid follow-up row (checkout works even if clients.assessment_result is empty).
alter table public.detailed_assessments
  add column if not exists free_assessment_snapshot jsonb,
  add column if not exists free_assessment_meta jsonb;

comment on column public.detailed_assessments.free_assessment_snapshot is
  'Copy of guest free quiz at save time — used for PayU checkout and PDF generation.';
