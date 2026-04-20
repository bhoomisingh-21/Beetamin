-- ============================================================
-- Fix 2 — Row Level Security (run in Supabase SQL Editor)
-- Service role (supabaseAdmin) bypasses RLS; anon key is restricted.
-- ============================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Optional: only if you have a leads table (used by /api/save-lead)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    EXECUTE 'ALTER TABLE leads ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- clients: block direct access via anon / Supabase-authenticated JWT (app uses service role)
DROP POLICY IF EXISTS "clients_no_public" ON clients;
CREATE POLICY "clients_no_public" ON clients FOR ALL USING (false) WITH CHECK (false);

-- appointments: block direct public access
DROP POLICY IF EXISTS "appointments_no_public" ON appointments;
CREATE POLICY "appointments_no_public" ON appointments FOR ALL USING (false) WITH CHECK (false);

-- nutritionists: public read (booking / listing)
DROP POLICY IF EXISTS "nutritionists_public_read" ON nutritionists;
CREATE POLICY "nutritionists_public_read" ON nutritionists FOR SELECT USING (true);

-- availability: public read (booking slots)
DROP POLICY IF EXISTS "availability_public_read" ON availability;
CREATE POLICY "availability_public_read" ON availability FOR SELECT USING (true);

-- leads: no public access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    EXECUTE 'DROP POLICY IF EXISTS "leads_no_public" ON leads';
    EXECUTE 'CREATE POLICY "leads_no_public" ON leads FOR ALL USING (false) WITH CHECK (false)';
  END IF;
END $$;
