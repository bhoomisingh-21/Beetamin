alter table public.meal_plans add column if not exists pdf_storage_path text;

comment on column public.meal_plans.pdf_storage_path is
  'Supabase storage path in diet-plans bucket for auto-generated meal plan PDF.';
