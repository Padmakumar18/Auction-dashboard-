-- Admin Users Table Setup for Cricket Auction App
-- Run this in your Supabase SQL Editor

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('superadmin', 'admin')) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admin_email ON public.admin_users(email);

-- Create trigger function to update timestamp
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

-- Insert demo admin user
-- NOTE: This uses plain text password for demo purposes
-- In production, you should use proper password hashing (bcrypt)
INSERT INTO public.admin_users (email, password_hash, full_name, role)
VALUES ('padmakumarc187@gmail.com', 'Admin@123', 'System Administrator', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Drop existing policies first
DROP POLICY IF EXISTS "Allow all operations on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.admin_users;

-- Create permissive policies for development
-- These allow all operations without authentication
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

-- Verify the table was created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'admin_users') as column_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'admin_users';

-- Show the demo user
SELECT id, email, full_name, role, is_active, created_at
FROM public.admin_users
WHERE email = 'padmakumarc187@gmail.com';

-- Test query to verify access
SELECT COUNT(*) as user_count FROM public.admin_users;

-- ============================================
-- IMPORTANT SECURITY NOTES
-- ============================================

/*
⚠️ SECURITY WARNING:
1. This setup uses PLAIN TEXT passwords for demo purposes only!
2. RLS policies allow ALL access for development
3. DO NOT use these settings in production!

For production, you MUST:
1. Implement proper password hashing (bcrypt)
2. Restrict RLS policies to authenticated users only
3. Use Supabase Edge Functions for authentication
4. Implement JWT tokens
5. Add rate limiting
*/

-- ============================================
-- PRODUCTION RLS POLICIES (Use these instead)
-- ============================================

/*
-- First, disable the permissive policies:
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.admin_users;

-- Then create secure policies:
CREATE POLICY "Users can read own profile"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Superadmins can manage users"
  ON public.admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
*/

-- ============================================
-- OPTIONAL: Add more admin users
-- ============================================

-- Add another admin user (uncomment to use)
/*
INSERT INTO public.admin_users (email, password_hash, full_name, role)
VALUES 
  ('admin@auction.com', 'admin123', 'Admin User', 'admin'),
  ('manager@auction.com', 'manager123', 'Manager User', 'admin')
ON CONFLICT (email) DO NOTHING;
*/

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- View all admin users
-- SELECT * FROM public.admin_users ORDER BY created_at DESC;

-- Update user password
-- UPDATE public.admin_users SET password_hash = 'newpassword' WHERE email = 'user@example.com';

-- Deactivate user
-- UPDATE public.admin_users SET is_active = false WHERE email = 'user@example.com';

-- Delete user
-- DELETE FROM public.admin_users WHERE email = 'user@example.com';

-- Check last login times
-- SELECT email, full_name, last_login FROM public.admin_users ORDER BY last_login DESC;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If you get 406 errors, check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'admin_users';

-- If you get permission errors, temporarily disable RLS:
-- ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
-- (Remember to re-enable it after testing!)
