# Authentication Guide - Admin Users

## ✅ What Was Implemented

Your Cricket Auction app now uses a custom `admin_users` table for authentication instead of Supabase Auth.

---

## 🗄️ Database Setup

### Admin Users Table Structure

```sql
admin_users
├── id (UUID, Primary Key)
├── email (TEXT, Unique)
├── password_hash (TEXT) - Currently plain text, should be hashed
├── full_name (TEXT)
├── role (TEXT) - 'superadmin' or 'admin'
├── is_active (BOOLEAN)
├── last_login (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Setup Instructions

1. **Run the SQL script**:

   - Open Supabase SQL Editor
   - Copy contents of `admin-users-setup.sql`
   - Run the script

2. **Verify the table**:

   ```sql
   SELECT * FROM admin_users;
   ```

3. **Demo user created**:
   - Email: `padmakumarc187@gmail.com`
   - Password: `Admin@123`
   - Role: `superadmin`

---

## 🔐 How Authentication Works

### Login Flow

1. User enters email and password
2. App queries `admin_users` table
3. Checks if user exists and is active
4. Compares password (plain text for now)
5. Updates `last_login` timestamp
6. Stores user in localStorage
7. Redirects to dashboard

### Code Implementation

**API Layer** (`src/services/api.js`):

```javascript
export const authAPI = {
  login: async (email, password) => {
    // Query admin_users table
    const { data: users, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (error || !users) {
      throw new Error("Invalid email or password");
    }

    // Check password
    if (users.password_hash !== password) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", users.id);

    // Store in localStorage
    localStorage.setItem("admin_user", JSON.stringify(users));

    return { user: users };
  },

  logout: async () => {
    localStorage.removeItem("admin_user");
  },

  getCurrentUser: async () => {
    const userStr = localStorage.getItem("admin_user");
    return userStr ? JSON.parse(userStr) : null;
  },
};
```

**Login Page** (`src/pages/Login.jsx`):

- Shows email and password fields
- Displays demo credentials
- Shows toast notifications
- Redirects on success

**Layout Component** (`src/components/Layout.jsx`):

- Shows logged-in user's name
- Shows user role
- Logout button

---

## 🎨 UI Updates

### Login Page

- ✅ Email input field
- ✅ Password input field
- ✅ Demo credentials display
- ✅ Error messages
- ✅ Loading state
- ✅ Toast notifications

### Sidebar

- ✅ User info card showing:
  - Full name
  - Email
  - Role (superadmin/admin)
- ✅ Logout button

---

## 🔒 Security Considerations

### ⚠️ CURRENT SETUP (Development Only)

**Issues:**

1. **Plain text passwords** - Passwords stored as plain text
2. **localStorage** - User data stored in browser
3. **No encryption** - Data not encrypted
4. **No session timeout** - User stays logged in forever
5. **No password requirements** - Any password accepted

### ✅ PRODUCTION RECOMMENDATIONS

#### 1. Implement Password Hashing

**Install bcrypt**:

```bash
npm install bcryptjs
```

**Hash passwords** (Backend/Supabase Function):

```javascript
const bcrypt = require("bcryptjs");

// When creating user
const hashedPassword = await bcrypt.hash(password, 10);

// When verifying
const isValid = await bcrypt.compare(password, user.password_hash);
```

**Update SQL**:

```sql
-- Hash existing passwords (run once)
UPDATE admin_users
SET password_hash = crypt('Admin@123', gen_salt('bf'))
WHERE email = 'padmakumarc187@gmail.com';
```

#### 2. Use Supabase Edge Functions

Create a Supabase Edge Function for authentication:

```javascript
// supabase/functions/admin-login/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

serve(async (req) => {
  const { email, password } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  // Get user
  const { data: user } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .eq("is_active", true)
    .single();

  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
    });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
    });
  }

  // Update last login
  await supabase
    .from("admin_users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", user.id);

  return new Response(JSON.stringify({ user }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

#### 3. Implement JWT Tokens

```javascript
// Generate JWT on login
const jwt = require("jsonwebtoken");

const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "24h" }
);

// Store token instead of user data
localStorage.setItem("auth_token", token);

// Verify token on each request
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### 4. Add Session Management

```javascript
// Set session timeout (e.g., 1 hour)
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

// Store login time
localStorage.setItem("login_time", Date.now());

// Check on each page load
const loginTime = localStorage.getItem("login_time");
if (Date.now() - loginTime > SESSION_TIMEOUT) {
  // Session expired, logout
  logout();
}
```

#### 5. Add Password Requirements

```javascript
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  if (password.length < minLength) {
    return "Password must be at least 8 characters";
  }
  if (!hasUpperCase) {
    return "Password must contain uppercase letter";
  }
  if (!hasLowerCase) {
    return "Password must contain lowercase letter";
  }
  if (!hasNumbers) {
    return "Password must contain number";
  }
  if (!hasSpecialChar) {
    return "Password must contain special character";
  }
  return null;
};
```

---

## 👥 User Management

### Add New Admin User

```sql
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES ('newadmin@example.com', 'password123', 'New Admin', 'admin');
```

### Update User Password

```sql
UPDATE admin_users
SET password_hash = 'newpassword'
WHERE email = 'user@example.com';
```

### Deactivate User

```sql
UPDATE admin_users
SET is_active = false
WHERE email = 'user@example.com';
```

### View All Users

```sql
SELECT id, email, full_name, role, is_active, last_login, created_at
FROM admin_users
ORDER BY created_at DESC;
```

---

## 🧪 Testing

### Test Login

1. Go to http://localhost:3000/login
2. Enter credentials:
   - Email: `padmakumarc187@gmail.com`
   - Password: `Admin@123`
3. Click Login
4. Should see success toast and redirect to dashboard
5. Check sidebar for user info

### Test Logout

1. Click Logout button in sidebar
2. Should redirect to login page
3. Try accessing dashboard - should redirect to login

### Test Invalid Credentials

1. Enter wrong email or password
2. Should see error toast
3. Should stay on login page

---

## 🔧 Troubleshooting

### Issue: "Invalid email or password"

**Causes:**

- Email doesn't exist in database
- Password doesn't match
- User is inactive (`is_active = false`)

**Fix:**

```sql
-- Check if user exists
SELECT * FROM admin_users WHERE email = 'your@email.com';

-- Check if active
SELECT is_active FROM admin_users WHERE email = 'your@email.com';

-- Reset password
UPDATE admin_users SET password_hash = 'Admin@123' WHERE email = 'your@email.com';
```

### Issue: "Table doesn't exist"

**Fix:**

- Run `admin-users-setup.sql` in Supabase SQL Editor
- Check table exists: `SELECT * FROM admin_users;`

### Issue: User stays logged in after closing browser

**Cause:** localStorage persists across sessions

**Fix:** Implement session timeout or use sessionStorage instead

### Issue: Can't see user info in sidebar

**Cause:** User object not in store

**Fix:** Check localStorage has user data:

```javascript
console.log(localStorage.getItem("admin_user"));
```

---

## 📝 Next Steps

### Immediate (Development):

- ✅ Test login with demo credentials
- ✅ Verify user info shows in sidebar
- ✅ Test logout functionality

### Short-term (Before Production):

- [ ] Implement password hashing with bcrypt
- [ ] Add password requirements
- [ ] Implement session timeout
- [ ] Add "Remember me" option
- [ ] Add "Forgot password" feature

### Long-term (Production):

- [ ] Use Supabase Edge Functions
- [ ] Implement JWT tokens
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Add audit logging
- [ ] Implement rate limiting
- [ ] Add CAPTCHA for login

---

## 📚 Resources

- **Supabase Docs**: https://supabase.com/docs
- **bcrypt.js**: https://github.com/dcodeIO/bcrypt.js
- **JWT**: https://jwt.io/
- **OWASP Password Guidelines**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

**Status**: ✅ Basic authentication implemented
**Security Level**: 🟡 Development only (needs hardening for production)
**Last Updated**: December 2024
