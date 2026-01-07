# 🚀 Quick Start Guide

Get your Cricket Auction app running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- A Supabase account (free tier works!)
- Basic knowledge of React

## Step 1: Install Dependencies (1 min)

```bash
cd app
npm install
```

## Step 2: Set Up Supabase (2 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize
3. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon/Public key

## Step 3: Configure Environment (30 sec)

1. Copy the example env file:

   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and paste your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Set Up Database (1 min)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-setup.sql`
4. Paste and click **Run**
5. You should see "Setup Complete!" message

## Step 5: Start the App (30 sec)

```bash
npm start
```

The app will open at http://localhost:3000

## 🎉 You're Done!

### What's Included

The sample data includes:

- ✅ 4 teams (Mumbai Indians, CSK, RCB, KKR)
- ✅ 10 players (Virat, Rohit, Bumrah, etc.)
- ✅ Each team has ₹10,00,000 budget

### First Steps

1. **Skip Login** (auth is optional for now)
2. **Go to Teams** - See the 4 pre-loaded teams
3. **Go to Players** - See the 10 pre-loaded players
4. **Go to Auction** - Click "Pick Random Player" to start!

### Try These Features

- 🎲 **Random Player Picker** - Animated shuffle effect
- 💰 **Place Bids** - Select team and enter amount
- ✅ **Finalize Sale** - Complete the transaction
- 📊 **Analytics** - View charts and insights
- 🔧 **Admin** - Reset auction, export data

## 🆘 Troubleshooting

### "Invalid Supabase credentials"

- Check your `.env` file
- Make sure you copied the correct URL and key
- Restart the dev server: `Ctrl+C` then `npm start`

### "Cannot read properties of undefined"

- Make sure you ran the SQL setup script
- Check Supabase dashboard that tables exist
- Verify sample data was inserted

### "Module not found"

- Delete `node_modules` folder
- Run `npm install` again

### Port 3000 already in use

- Kill the process using port 3000
- Or change port: `PORT=3001 npm start`

## 📚 Next Steps

1. **Add More Teams** - Go to Teams page
2. **Upload Players CSV** - Go to Players page
3. **Customize Styling** - Edit Tailwind classes
4. **Enable Auth** - Set up Supabase Auth
5. **Deploy** - Use Vercel, Netlify, or Firebase

## 🎯 Pro Tips

- **CSV Upload Format**: `name,role,base_price`
- **Roles**: Batsman, Bowler, All-Rounder, Wicket-Keeper
- **Keyboard Shortcuts**:
  - `Esc` to close modals
  - `Enter` to submit forms

## 📖 Full Documentation

- `README.md` - Complete feature documentation
- `SETUP.md` - Detailed setup instructions
- `PROJECT_STRUCTURE.md` - Code architecture guide
- `supabase-setup.sql` - Database schema

## 🤝 Need Help?

- Check the browser console for errors
- Verify Supabase tables in the dashboard
- Review the sample data in SQL Editor
- Read the full README.md

---

**Happy Auctioning! 🏏**
