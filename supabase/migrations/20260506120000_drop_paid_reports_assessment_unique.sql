-- Allow multiple paid_reports rows per assessment (₹39 regenerate with same assessment_id).
-- Requires application changes (generate-report duplicate handling).
drop index if exists public.paid_reports_assessment_id_unique;
