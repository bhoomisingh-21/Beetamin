-- Run in Supabase SQL Editor (Fix 5 — store assessment in DB instead of localStorage)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS assessment_result JSONB,
  ADD COLUMN IF NOT EXISTS assessment_meta JSONB;
