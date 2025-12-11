# Authentication Troubleshooting Guide

## 🔴 Error: 406 (Not Acceptable)

This error means Supabase is blocking access to the `admin_users` table due to Row Level Security (RLS) policies.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Run the Updated SQL Script

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `admin-users-setup.sql`
4. Click **Run**

This will:

- Create the table (if not exists)
- Set up proper RLS policies
- Insert demo user
- Enable access for development

### Step 2: Verify Table Access

Run this query in SQL Editor:

```sql
SELECT * FROM admin_users;
```

You should see your user:

```
email: padmakumarc187@gmail.com
full_name: System Administrator
role: superadmin
```

### Step 3: Test Login

1. Refresh your app
2. Try logging in again
3. Should work now!

---

## 🔍 Detailed Troubleshooting

### Check 1: Table Exists

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'admin_users';
```

**Expected:** Should return `admin_users`

**If empty:** Run the setup script

---

### Check 2: RLS Policies

```sql
SELECT * FROM pg_policies WHERE tablename = 'admin_users';
```

**Expected:** Should show 4 policies:

- Enable read access for all users
- Enable insert for all users
- Enable update for all users
- Enable delete for all users

**If empty or different:** Run the setup script again

---

### Check 3: User Exists

```sql
SELECT * FROM admin_users WHERE email = 'padmakumarc187@gmail.com';
```

**Expected:** Should return your user

**If empty:** Insert user:

```sql
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES ('padmakumarc187@gmail.com', 'Admin@123', 'System Administrator', 'superadmin');
```

---

### Check 4: RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'admin_users';
```

**Expected:** `rowsecurity` should be `true`

**If false:** Enable it:

```sql
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

---

## 🚨 Emergency Fix: Temporarily Disable RLS

**⚠️ Use only for testing!**

```sql
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
```

Try logging in. If it works, the issue is with RLS policies.

**Don't forget to re-enable:**

```sql
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

Then run the setup script to create proper policies.

---

## 🔧 Common Issues & Solutions

### Issue 1: "Database error. Please check your Supabase setup."

**Cause:** RLS policies blocking access

**Solution:**

1. Run `admin-users-setup.sql`
2. Verify policies exist
3. Check browser console for detailed error

---

### Issue 2: "Invalid email or password" (but credentials are correct)

**Cause:** User doesn't exist or is inactive

**Solution:**

```sql
-- Check if user exists
SELECT * FROM admin_users WHERE email = 'padmakumarc187@gmail.com';

-- Check if active
SELECT is_active FROM admin_users WHERE email = 'padmakumarc187@gmail.com';

-- Activate user if needed
UPDATE admin_users SET is_active = true WHERE email = 'padmakumarc187@gmail.com';
```

---

### Issue 3: "Cannot read properties of null"

**Cause:** API returning null instead of user object

**Solution:**

1. Check browser console for errors
2. Verify Supabase URL and key in `.env`
3. Check network tab for API response

---

### Issue 4: CORS Error

**Cause:** Supabase project settings

**Solution:**

1. Go to Supabase Dashboard
2. Settings → API
3. Check "Allowed Origins"
4. Add `http://localhost:3000`

---

## 🔍 Debug Mode

Add this to your login function to see detailed errors:

```javascript
// In src/services/api.js
login: async (email, password) => {
  console.log("Attempting login for:", email);

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();

  console.log("Supabase response:", { data, error });

  // ... rest of code
};
```

Check browser console for output.

---

## 📊 Verify Supabase Connection

Test your Supabase connection:

```javascript
// In browser console
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient("YOUR_SUPABASE_URL", "YOUR_SUPABASE_ANON_KEY");

// Test query
const { data, error } = await supabase.from("admin_users").select("count");

console.log({ data, error });
```

---

## 🔐 Check Environment Variables

Verify your `.env` file:

```bash
# Should have these values
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:**

- No quotes around values
- No spaces
- Restart dev server after changing

---

## 📝 Step-by-Step Verification

Run these in order:

```sql
-- 1. Check table exists
SELECT COUNT(*) FROM admin_users;

-- 2. Check user exists
SELECT * FROM admin_users WHERE email = 'padmakumarc187@gmail.com';

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'admin_users';

-- 4. Check policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'admin_users';

-- 5. Test direct query
SELECT * FROM admin_users WHERE email = 'padmakumarc187@gmail.com' AND is_active = true;
```

All should return results.

---

## 🆘 Still Not Working?

### Option 1: Start Fresh

```sql
-- Drop everything and start over
DROP TABLE IF EXISTS admin_users CASCADE;

-- Then run admin-users-setup.sql again
```

### Option 2: Use Supabase Auth Instead

If you can't get custom auth working, you can use Supabase's built-in auth:

1. Go to Supabase Dashboard → Authentication
2. Enable Email provider
3. Create a user
4. Use the original auth code (see git history)

### Option 3: Check Supabase Status

- Go to https://status.supabase.com/
- Check if there are any outages

---

## 📞 Get Help

If still stuck:

1. **Check browser console** - Look for error messages
2. **Check network tab** - See actual API responses
3. **Check Supabase logs** - Dashboard → Logs
4. **Share error details** - Include:
   - Error message
   - Browser console output
   - Network response
   - SQL query results

---

## ✅ Success Checklist

- [ ] Table `admin_users` exists
- [ ] User exists in table
- [ ] User is active (`is_active = true`)
- [ ] RLS is enabled
- [ ] 4 RLS policies exist
- [ ] `.env` file has correct values
- [ ] Dev server restarted after `.env` changes
- [ ] No errors in browser console
- [ ] Can query table directly in SQL Editor

If all checked, login should work!

---

## 🎯 Expected Behavior

**When login works:**

1. Enter email and password
2. Click Login
3. See toast: "Welcome back, System Administrator!"
4. Redirect to dashboard
5. See user info in sidebar
6. No errors in console

---

**Last Updated:** December 2024
**Status:** Troubleshooting guide for 406 errors
