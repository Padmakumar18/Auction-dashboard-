# Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd app
npm install
```

## Step 2: Configure Supabase

1. Go to https://supabase.com and create a new project
2. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
3. Update `.env` with your Supabase credentials

## Step 3: Set Up Database

Go to your Supabase SQL Editor and run:

```sql
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
  status TEXT DEFAULT 'unsold',
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auction Logs Table
CREATE TABLE auction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES teams(id),
  bid_amount INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for demo)
CREATE POLICY "Allow all operations" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON auction_logs FOR ALL USING (true);
```

## Step 4: Set Up Authentication (Optional)

For admin login, go to Supabase Authentication settings:

1. Enable Email authentication
2. Create a test user in the Users tab
3. Use those credentials to login

## Step 5: Start Development Server

```bash
npm start
```

The app will open at http://localhost:3000

## Step 6: Initial Data Setup

1. Login (or skip if auth not configured)
2. Go to Teams page and add teams
3. Go to Players page and add players (manually or via CSV)
4. Go to Auction page to start the auction!

## Troubleshooting

### Issue: "Invalid Supabase credentials"

- Check your `.env` file has correct URL and key
- Restart the dev server after changing `.env`

### Issue: "Database error"

- Verify all tables are created in Supabase
- Check RLS policies are set correctly

### Issue: "Cannot read properties of undefined"

- Make sure you've added at least one team and player
- Check browser console for specific errors

## Production Deployment

1. Build the app:

   ```bash
   npm run build
   ```

2. Deploy the `build` folder to:

   - Vercel
   - Netlify
   - Firebase Hosting
   - Any static hosting service

3. Update Supabase RLS policies for production security

## Need Help?

- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- Tailwind Docs: https://tailwindcss.com
