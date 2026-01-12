# Fix 400 Error - Quick Guide

## 🔴 Error: 400 Bad Request

You're seeing this error because the database tables don't exist yet in Supabase.

---

## ✅ Quick Fix (2 Steps)

### Step 1: Run Complete Database Setup

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `complete-database-setup.sql`
5. Paste and click **Run**

This will create:

- ✅ All 4 tables (teams, players, auction_logs, admin_users)
- ✅ All indexes
- ✅ All RLS policies
- ✅ Sample data (4 teams, 10 players, 1 admin)
- ✅ Realtime subscriptions

### Step 2: Refresh Your App

1. Go back to your app
2. Press `Ctrl+R` (or `Cmd+R`) to refresh
3. The errors should be gone!

---

## 🔍 Verify Setup

Run this in Supabase SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('teams', 'players', 'auction_logs', 'admin_users');
```

**Expected result:** Should show all 4 tables

---

## 📊 Check Data

```sql
-- Check sample data
SELECT 'teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users;
```

**Expected result:**

- teams: 4
- players: 10
- admin_users: 1

---

## 🎯 What Causes 400 Error?

The 400 error happens when:

1. **Tables don't exist** - Most common cause
2. **Wrong table names** - Typo in table name
3. **Missing columns** - Table structure doesn't match query
4. **RLS blocking access** - Row Level Security policies too restrictive

---

## 🔧 Alternative: Create Tables Manually

If the script doesn't work, create tables one by one:

### 1. Teams Table

```sql
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_points INTEGER NOT NULL,
  points_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations on teams"
  ON public.teams FOR ALL USING (true) WITH CHECK (true);
```

### 2. Players Table

```sql
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  sold_price INTEGER,
  status TEXT DEFAULT 'unsold',
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations on players"
  ON public.players FOR ALL USING (true) WITH CHECK (true);
```

### 3. Auction Logs Table

```sql
CREATE TABLE public.auction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id),
  team_id UUID REFERENCES public.teams(id),
  bid_amount INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.auction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations on auction_logs"
  ON public.auction_logs FOR ALL USING (true) WITH CHECK (true);
```

### 4. Admin Users Table

```sql
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations on admin_users"
  ON public.admin_users FOR ALL USING (true) WITH CHECK (true);
```

---

## 🆘 Still Getting 400 Error?

### Check 1: Supabase URL

Verify your `.env` file:

```
REACT_APP_SUPABASE_URL=https://cklqesbzcsijoltuylbo.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-key-here
```

### Check 2: Browser Console

Open browser console (F12) and look for detailed error message.

### Check 3: Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Look for failed requests
4. Click on them to see response

### Check 4: Supabase Logs

1. Go to Supabase Dashboard
2. Click on Logs
3. Look for error messages

---

## 📝 Common Issues

### Issue: "relation does not exist"

**Cause:** Table not created
**Fix:** Run `complete-database-setup.sql`

### Issue: "permission denied"

**Cause:** RLS policies too restrictive
**Fix:** Run the RLS policy commands

### Issue: "column does not exist"

**Cause:** Table structure doesn't match
**Fix:** Drop and recreate table

---

## 🎯 Success Checklist

After running the setup script, verify:

- [ ] No errors in browser console
- [ ] Dashboard loads without errors
- [ ] Teams page loads
- [ ] Players page loads
- [ ] Can see sample data
- [ ] Can login with demo credentials

---

## 🚀 Next Steps

Once tables are created:

1. **Login** with demo credentials:

   - Email: `padmakumarc187@gmail.com`
   - Password: `Admin@123`

2. **Explore the app**:

   - View teams
   - View players
   - Try the auction

3. **Add your own data**:
   - Create new teams
   - Add more players
   - Run test auctions

---

## 📞 Need More Help?

If still stuck:

1. Share the exact error message
2. Share browser console output
3. Share Supabase logs
4. Check if Supabase project is active

---

**Quick Summary:**

1. Run `complete-database-setup.sql` in Supabase
2. Refresh your app
3. Done! ✅

---

**Last Updated:** December 2024
**Status:** Troubleshooting guide for 400 errors
