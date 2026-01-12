# Player Registration Form - Quick Start

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Setup

Open Supabase SQL Editor and execute:

```sql
-- File: storage-buckets-setup.sql
```

### Step 2: Start Development Server

```bash
cd app
npm start
```

### Step 3: Access the Form

Navigate to: `http://localhost:3000/register`

## ✅ What's Included

- Fully responsive registration form
- Real-time validation
- Image upload with preview
- Toast notifications
- Clean, modern UI

## 📋 Form Fields

1. Player Name (text)
2. Location (dropdown: Udumalpet, Palani, Pollachi)
3. Jersey Size (dropdown: XS-XXL)
4. Jersey Number (1-99, unique)
5. Player Role (All-rounder, Batsman, Bowler)
6. Player Photo (image upload)
7. Payment Proof (image upload)

## 🎨 Features

- Mobile-first responsive design
- Image preview before upload
- File validation (size & type)
- Inline error messages
- Loading states
- Auto-redirect after success

## 📱 Responsive Breakpoints

- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (two columns)
- Desktop: > 1024px (optimized layout)

## 🔧 Customization

Edit `src/pages/PlayerRegistration.jsx` to modify:

- Location options
- Jersey sizes
- Player roles
- Validation rules
- File size limits

For detailed documentation, see `PLAYER_REGISTRATION_GUIDE.md`
