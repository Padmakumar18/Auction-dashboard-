-- Cricket Auction Database Setup
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  total_points INTEGER NOT NULL,
  points_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Players Table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  sold_price INTEGER,
  status TEXT DEFAULT 'unsold',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auction Logs Table
CREATE TABLE IF NOT EXISTS auction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  bid_amount INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_player_id ON auction_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_team_id ON auction_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_created_at ON auction_logs(created_at DESC);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES (Development - Allow All)
-- ============================================

-- Teams Policies
DROP POLICY IF EXISTS "Allow all operations on teams" ON teams;
CREATE POLICY "Allow all operations on teams" 
  ON teams 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Players Policies
DROP POLICY IF EXISTS "Allow all operations on players" ON players;
CREATE POLICY "Allow all operations on players" 
  ON players 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Auction Logs Policies
DROP POLICY IF EXISTS "Allow all operations on auction_logs" ON auction_logs;
CREATE POLICY "Allow all operations on auction_logs" 
  ON auction_logs 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- 5. CREATE FUNCTIONS (Optional)
-- ============================================

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_stats(team_uuid UUID)
RETURNS TABLE (
  team_name TEXT,
  total_points INTEGER,
  points_used INTEGER,
  points_remaining INTEGER,
  player_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.name,
    t.total_points,
    t.points_used,
    t.total_points - t.points_used,
    COUNT(p.id)
  FROM teams t
  LEFT JOIN players p ON p.team_id = t.id
  WHERE t.id = team_uuid
  GROUP BY t.id, t.name, t.total_points, t.points_used;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. INSERT SAMPLE DATA (Optional)
-- ============================================

-- Sample Teams
INSERT INTO teams (name, total_points, points_used) VALUES
  ('Mumbai Indians', 1000000, 0),
  ('Chennai Super Kings', 1000000, 0),
  ('Royal Challengers', 1000000, 0),
  ('Kolkata Knight Riders', 1000000, 0)
ON CONFLICT DO NOTHING;

-- Sample Players
INSERT INTO players (name, role, base_price, status) VALUES
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
-- 7. ENABLE REALTIME (Important!)
-- ============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE auction_logs;

-- ============================================
-- 8. PRODUCTION RLS POLICIES (Use these in production)
-- ============================================

/*
-- First, create an admin role check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then replace the policies:

-- Teams - Admin can modify, everyone can read
DROP POLICY IF EXISTS "Allow all operations on teams" ON teams;
CREATE POLICY "Admin can modify teams" ON teams FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Everyone can view teams" ON teams FOR SELECT USING (true);

-- Players - Admin can modify, everyone can read
DROP POLICY IF EXISTS "Allow all operations on players" ON players;
CREATE POLICY "Admin can modify players" ON players FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Everyone can view players" ON players FOR SELECT USING (true);

-- Auction Logs - Admin can modify, everyone can read
DROP POLICY IF EXISTS "Allow all operations on auction_logs" ON auction_logs;
CREATE POLICY "Admin can modify logs" ON auction_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Everyone can view logs" ON auction_logs FOR SELECT USING (true);
*/

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('teams', 'players', 'auction_logs')
ORDER BY table_name;

-- Show sample data counts
SELECT 
  'teams' as table_name, COUNT(*) as record_count FROM teams
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'auction_logs', COUNT(*) FROM auction_logs;
