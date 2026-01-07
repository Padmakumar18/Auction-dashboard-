# Cricket Tournament Auction Web Application

A modern, production-ready React frontend for managing cricket team auctions with real-time updates, analytics, and comprehensive admin controls.

## 🚀 Features

- **Team Management**: Add teams, set budgets, track spending
- **Player Management**: Add players manually or via CSV upload
- **Live Auction**: Random player picker with animated shuffle, real-time bidding
- **Analytics Dashboard**: Charts and insights on spending, player distribution
- **Admin Console**: Reset auction, export data, lock/unlock bidding
- **Real-time Updates**: Powered by Supabase subscriptions
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## 📦 Tech Stack

- **React 19** - UI framework
- **Tailwind CSS** - Styling (via CDN)
- **Zustand** - State management
- **React Router** - Navigation
- **Supabase** - Backend & real-time database
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Framer Motion** - Animations

## 🛠️ Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure Supabase**:

   - Create a Supabase project at https://supabase.com
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     REACT_APP_SUPABASE_URL=your_project_url
     REACT_APP_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Set up database**:
   Run the following SQL in your Supabase SQL editor:

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

   -- Create policies (allow all for demo - customize for production)
   CREATE POLICY "Allow all operations" ON teams FOR ALL USING (true);
   CREATE POLICY "Allow all operations" ON players FOR ALL USING (true);
   CREATE POLICY "Allow all operations" ON auction_logs FOR ALL USING (true);
   ```

4. **Start the development server**:

   ```bash
   npm start
   ```

   The app will open at http://localhost:3000

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Select.jsx
│   ├── Modal.jsx
│   ├── Table.jsx
│   ├── Loader.jsx
│   └── Layout.jsx
├── pages/           # Main application pages
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Teams.jsx
│   ├── Players.jsx
│   ├── Auction.jsx
│   ├── Analytics.jsx
│   └── Admin.jsx
├── store/           # Zustand state management
│   └── useStore.js
├── services/        # Supabase API layer
│   └── api.js
├── utils/           # Helper functions
│   └── helpers.js
├── hooks/           # Custom React hooks
│   └── useRealtime.js
├── config/          # Configuration files
│   └── supabase.js
└── App.jsx          # Main app with routing
```

## 🎯 Usage Guide

### 1. Login

- Use Supabase Auth for admin login
- Demo: Configure auth in Supabase dashboard

### 2. Teams Management

- Add teams with name and total points budget
- View real-time spending and remaining points
- Edit or delete teams

### 3. Players Management

- Add players manually or upload CSV
- CSV format: `name,role,base_price`
- Filter by role and status
- Edit or delete players

### 4. Live Auction

- Click "Pick Random Player" for animated shuffle
- Select team and enter bid amount
- System shows recommended max bid per team
- Finalize sale or mark as unsold
- Real-time updates across all clients

### 5. Analytics

- View spending charts
- Role distribution pie charts
- Team-wise player count
- Detailed statistics table

### 6. Admin Console

- Lock/unlock auction
- Reset entire auction
- Export results to CSV
- View complete team rosters

## 🔧 Configuration

### Tailwind CSS

Tailwind is loaded via CDN in `public/index.html`. For production, consider installing it locally:

```bash
npm install -D tailwindcss
npx tailwindcss init
```

### Environment Variables

- `REACT_APP_SUPABASE_URL`: Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 🚀 Deployment

### Build for production:

```bash
npm run build
```

### Deploy to:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop `build` folder
- **Firebase**: `firebase deploy`

## 📝 CSV Upload Format

Players CSV should have these columns:

```csv
name,role,base_price
Virat Kohli,Batsman,150000
Jasprit Bumrah,Bowler,120000
Hardik Pandya,All-Rounder,130000
MS Dhoni,Wicket-Keeper,140000
```

## 🔐 Security Notes

For production:

1. Enable proper Row Level Security (RLS) policies in Supabase
2. Set up authentication with email/password or OAuth
3. Restrict API access to authenticated users only
4. Use environment variables for sensitive data
5. Enable HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for your tournaments!

## 🆘 Support

For issues or questions:

- Check Supabase documentation: https://supabase.com/docs
- React documentation: https://react.dev
- Open an issue in the repository

---

Built with ❤️ for cricket enthusiasts
