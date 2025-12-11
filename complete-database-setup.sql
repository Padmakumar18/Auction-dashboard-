-- ============================================
-- COMPLETE DATABASE SETUP FOR CRICKET AUCTION
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_points INTEGER NOT NULL,
  points_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players Table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  sold_price INTEGER,
  status TEXT DEFAULT 'unsold',
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auction Logs Table
CREATE TABLE IF NOT EXISTS public.auction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  bid_amount INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('superadmin', 'admin')) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_player_id ON public.auction_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_team_id ON public.auction_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_created_at ON public.auction_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_email ON public.admin_users(email);

-- ============================================
-- 3. CREATE TRIGGERS
-- ============================================

-- Trigger function to update admin_users timestamp
CREATE OR REPLACE FUNCTION update_admin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_admin_timestamp ON public.admin_users;
CREATE TRIGGER trg_update_admin_timestamp
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_timestamp();

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES (Development - Allow All)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations on teams" ON public.teams;
DROP POLICY IF EXISTS "Enable all operations on players" ON public.players;
DROP POLICY IF EXISTS "Enable all operations on auction_logs" ON public.auction_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.admin_users;

-- Teams policies
CREATE POLICY "Enable all operations on teams"
  ON public.teams
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Players policies
CREATE POLICY "Enable all operations on players"
  ON public.players
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auction Logs policies
CREATE POLICY "Enable all operations on auction_logs"
  ON public.auction_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin Users policies
CREATE POLICY "Enable read access for all users"
  ON public.admin_users
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON public.admin_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
  ON public.admin_users
  FOR DELETE
  USING (true);

-- ============================================
-- 6. INSERT SAMPLE DATA
-- ============================================

-- Insert demo admin user
INSERT INTO public.admin_users (email, password_hash, full_name, role)
VALUES ('padmakumarc187@gmail.com', 'Admin@123', 'System Administrator', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample teams
INSERT INTO public.teams (name, total_points, points_used) VALUES
  ('Mumbai Indians', 1000000, 0),
  ('Chennai Super Kings', 1000000, 0),
  ('Royal Challengers', 1000000, 0),
  ('Kolkata Knight Riders', 1000000, 0)
ON CONFLICT DO NOTHING;

-- Insert sample players
INSERT INTO public.players (name, role, base_price, status) VALUES
  ('Virat Kohli', 'Batsman', 150000, 'unsold'),
  ('Rohit Sharma', 'Batsman', 140000, 'unsold'),
  ('Jasprit Bumrah', 'Bowler', 130000, 'unsold'),
  ('Ravindra Jadeja', 'All-Rounder', 120000, 'unsold'),
  ('MS Dhoni', 'Wicket-Keeper', 160000, 'unsold'),
  ('KL Rahul', 'Batsman', 135000, 'unsold'),
  ('Mohammed Shami', 'Bowler', 110000, 'unsold'),
  ('Hardik Pandya', 'All-Rounder', 125000, 'unsold'),
  ('Rishabh Pant', 'Wicket-Keeper', 145000, 'unsold'),
  ('Yuzvendra Chahal', 'Bowler', 100000, 'unsold')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. ENABLE REALTIME
-- ============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_logs;

-- ============================================
-- 8. VERIFY SETUP
-- ============================================

-- Check tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('teams', 'players', 'auction_logs', 'admin_users')
ORDER BY table_name;

-- Check data counts
SELECT 'teams' as table_name, COUNT(*) as record_count FROM public.teams
UNION ALL
SELECT 'players', COUNT(*) FROM public.players
UNION ALL
SELECT 'auction_logs', COUNT(*) FROM public.auction_logs
UNION ALL
SELECT 'admin_users', COUNT(*) FROM public.admin_users;

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('teams', 'players', 'auction_logs', 'admin_users')
ORDER BY tablename, policyname;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

/*
✅ Tables created:
   - teams
   - players
   - auction_logs
   - admin_users

✅ Sample data inserted:
   - 4 teams
   - 10 players
   - 1 admin user

✅ RLS enabled with permissive policies

✅ Realtime enabled

✅ Ready to use!

Login credentials:
Email: padmakumarc187@gmail.com
Password: Admin@123

⚠️ SECURITY WARNING:
This setup uses permissive RLS policies and plain text passwords.
This is for DEVELOPMENT ONLY!
For production, implement proper security measures.
*/
