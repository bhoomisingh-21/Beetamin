-- Detailed assessment: personal info, medical conditions, allergies, stress level,
-- and jsonb bucket for conditional follow-up answers (PCOS/diabetes sub-questions,
-- weight-loss target, training frequency, etc).
alter table public.detailed_assessments
  add column if not exists medical_conditions text[] default '{}',
  add column if not exists allergies text[] default '{}',
  add column if not exists height_cm numeric,
  add column if not exists weight_kg numeric,
  add column if not exists gender text,
  add column if not exists stress_level text,
  add column if not exists condition_details jsonb default '{}'::jsonb,
  add column if not exists weight_loss_target_kg numeric;

comment on column public.detailed_assessments.medical_conditions is
  'Multi-select: PCOS/PCOD, Diabetes, Thyroid, Hypertension, Heart condition, Other, etc.';
comment on column public.detailed_assessments.condition_details is
  'Conditional follow-up answers keyed by topic, e.g. {"pcos": "...", "diabetes_type": "...", "training_frequency": "..."}.';
comment on column public.detailed_assessments.weight_loss_target_kg is
  'Only collected when the free quiz goal was weight_loss.';
