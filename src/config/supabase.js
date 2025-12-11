import { createClient } from "@supabase/supabase-js";

// Replace with your Supabase credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Schema Reference:
/*
-- Teams Table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  total_points INTEGER NOT NULL,
  points_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Players Table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  sold_price INTEGER,
  status TEXT DEFAULT 'unsold', -- 'unsold', 'sold'
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auction Logs Table
CREATE TABLE auction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES teams(id),
  bid_amount INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'bid', 'withdraw', 'sold'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
*/
