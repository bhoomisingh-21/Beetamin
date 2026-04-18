-- ============================================================
-- TheBeetamin — Run this ONCE in your Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================
-- 1. Add clerk_user_id to existing clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Nutritionists table
-- clerk_user_id is nullable — auto-linked on first login by email match
CREATE TABLE IF NOT EXISTS nutritionists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  bio           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ FOR TESTING: use your own Google email for all 3 slots.
-- When real nutritionists are ready, run the UPDATE block at the bottom.
INSERT INTO nutritionists (name, email, bio) VALUES
  ('Test Nutritionist 1', 'YOUR_GOOGLE_EMAIL@gmail.com',  'Certified nutritionist specializing in micronutrient therapy'),
  ('Test Nutritionist 2', 'YOUR_TEST_EMAIL_2@gmail.com',  'Expert in sports and fitness nutrition'),
  ('Test Nutritionist 3', 'YOUR_TEST_EMAIL_3@gmail.com',  'Specialist in gut health and weight management')
ON CONFLICT (email) DO NOTHING;

-- 3. Weekly availability (each row = one time block on one day)
CREATE TABLE IF NOT EXISTS availability (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id  UUID NOT NULL REFERENCES nutritionists(id) ON DELETE CASCADE,
  day_of_week      INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  is_active        BOOLEAN DEFAULT TRUE,
  UNIQUE(nutritionist_id, day_of_week, start_time)
);

-- 4. Appointments (CarePulse-style, replaces bookings for new flow)
CREATE TABLE IF NOT EXISTS appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nutritionist_id  UUID NOT NULL REFERENCES nutritionists(id),
  session_number   INTEGER NOT NULL DEFAULT 1,
  scheduled_date   DATE NOT NULL,
  scheduled_time   TIME NOT NULL,
  reason           TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
  notes            TEXT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_clerk_user_id ON clients(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist_id ON appointments(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_availability_nutritionist_id ON availability(nutritionist_id);



-- 6. Row Level Security (optional but recommended)
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nutritionists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SWAP TO REAL NUTRITIONISTS LATER (run these when ready):
--
-- UPDATE nutritionists SET name = 'Bhoomi Singh',   email = 'bhoomi@gmail.com'   WHERE email = 'YOUR_TEST_EMAIL_1@gmail.com';
-- UPDATE nutritionists SET name = 'Nutritionist 2', email = 'n2@gmail.com'       WHERE email = 'YOUR_TEST_EMAIL_2@gmail.com';
-- UPDATE nutritionists SET name = 'Nutritionist 3', email = 'n3@gmail.com'       WHERE email = 'YOUR_TEST_EMAIL_3@gmail.com';
--
-- ============================================================
-- DONE! After running this:
--
-- 1. Go to https://clerk.com → create app → enable Google OAuth
--    → copy NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY
--    → paste into .env.local
--
-- 2. Edit the INSERT above with your 3 nutritionists' real names + Google emails.
--    When they sign in with Google, their Clerk ID auto-links to their row.
--    NO manual Clerk metadata needed.
--
-- 3. The nutritionist logs in at /nutritionist
--    They set availability at /nutritionist/availability
--    Clients see their slots when booking at /booking/new
-- ============================================================
