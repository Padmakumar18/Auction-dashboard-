# Deployment Guide

Complete guide to deploy your Cricket Auction app to production.

---

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   cd app
   vercel
   ```

4. **Add Environment Variables** in Vercel Dashboard:

   - Go to your project settings
   - Add `REACT_APP_SUPABASE_URL`
   - Add `REACT_APP_SUPABASE_ANON_KEY`

5. **Redeploy**:
   ```bash
   vercel --prod
   ```

**Done!** Your app is live at `your-app.vercel.app`

---

### Option 2: Netlify

1. **Install Netlify CLI**:

   ```bash
   npm install -g netlify-cli
   ```

2. **Build the app**:

   ```bash
   cd app
   npm run build
   ```

3. **Deploy**:

   ```bash
   netlify deploy --prod --dir=build
   ```

4. **Add Environment Variables** in Netlify Dashboard:
   - Go to Site Settings → Environment Variables
   - Add `REACT_APP_SUPABASE_URL`
   - Add `REACT_APP_SUPABASE_ANON_KEY`

**Done!** Your app is live at `your-app.netlify.app`

---

### Option 3: Firebase Hosting

1. **Install Firebase CLI**:

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:

   ```bash
   firebase login
   ```

3. **Initialize Firebase**:

   ```bash
   cd app
   firebase init hosting
   ```

   - Select "Use an existing project" or create new
   - Set public directory to `build`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. **Build the app**:

   ```bash
   npm run build
   ```

5. **Deploy**:
   ```bash
   firebase deploy
   ```

**Note**: Firebase doesn't support environment variables in the same way. You'll need to use Firebase Config or hardcode values (not recommended for production).

---

## 🔧 Pre-Deployment Checklist

### 1. Environment Setup

- [ ] Create production Supabase project
- [ ] Run `supabase-setup.sql` in production database
- [ ] Copy production URL and keys
- [ ] Update `.env` with production values
- [ ] Test locally with production database

### 2. Security

- [ ] Enable Supabase Auth
- [ ] Update RLS policies (see supabase-setup.sql)
- [ ] Remove sample data (optional)
- [ ] Set up admin user in Supabase Auth
- [ ] Enable HTTPS (automatic on Vercel/Netlify)
- [ ] Configure CORS in Supabase

### 3. Code Optimization

- [ ] Remove console.logs
- [ ] Run `npm run build` to test
- [ ] Check bundle size
- [ ] Test all features locally
- [ ] Fix any warnings

### 4. Database

- [ ] Verify all tables exist
- [ ] Check indexes are created
- [ ] Enable realtime on all tables
- [ ] Test RLS policies
- [ ] Backup database

---

## 🔐 Production Security Setup

### Update Supabase RLS Policies

Replace the development policies with production ones:

```sql
-- 1. Create admin role check function
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

-- 2. Update Teams policies
DROP POLICY IF EXISTS "Allow all operations on teams" ON teams;
CREATE POLICY "Admin can modify teams"
  ON teams FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY "Everyone can view teams"
  ON teams FOR SELECT
  USING (true);

-- 3. Update Players policies
DROP POLICY IF EXISTS "Allow all operations on players" ON players;
CREATE POLICY "Admin can modify players"
  ON players FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY "Everyone can view players"
  ON players FOR SELECT
  USING (true);

-- 4. Update Auction Logs policies
DROP POLICY IF EXISTS "Allow all operations on auction_logs" ON auction_logs;
CREATE POLICY "Admin can modify logs"
  ON auction_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY "Everyone can view logs"
  ON auction_logs FOR SELECT
  USING (true);
```

### Create Admin User

In Supabase Dashboard:

1. Go to Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Click "Create User"
5. Edit user metadata and add:
   ```json
   {
     "role": "admin"
   }
   ```

---

## 🌐 Custom Domain Setup

### Vercel

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

### Netlify

1. Go to Domain Settings
2. Add custom domain
3. Update DNS records
4. Enable HTTPS (automatic)

### Firebase

1. Go to Hosting → Add custom domain
2. Follow verification steps
3. Update DNS records
4. SSL is automatic

---

## 📊 Monitoring & Analytics

### Add Google Analytics (Optional)

1. Create GA4 property
2. Get Measurement ID
3. Add to `public/index.html`:
   ```html
   <script
     async
     src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
   ></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag() {
       dataLayer.push(arguments);
     }
     gtag("js", new Date());
     gtag("config", "G-XXXXXXXXXX");
   </script>
   ```

### Supabase Monitoring

- Check Database → Logs for errors
- Monitor API usage in Project Settings
- Set up email alerts for issues

---

## 🔄 Continuous Deployment

### GitHub + Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Connect repository
4. Add environment variables
5. Deploy automatically on push

### GitHub + Netlify

1. Push code to GitHub
2. New site from Git in Netlify
3. Connect repository
4. Add environment variables
5. Deploy automatically on push

---

## 🐛 Troubleshooting Deployment

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

- Restart build after adding variables
- Check variable names start with `REACT_APP_`
- Verify no typos in variable names

### Supabase Connection Issues

- Check URL and key are correct
- Verify Supabase project is active
- Check CORS settings in Supabase
- Ensure RLS policies allow access

### 404 on Refresh

Add `_redirects` file in `public/` folder:

```
/*    /index.html   200
```

Or for Vercel, add `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 📈 Performance Optimization

### Before Deployment

1. **Optimize Images**: Use WebP format
2. **Code Splitting**: Implement React.lazy
3. **Bundle Analysis**:
   ```bash
   npm install --save-dev webpack-bundle-analyzer
   npm run build
   ```
4. **Lighthouse Audit**: Check performance score

### After Deployment

1. Enable CDN (automatic on Vercel/Netlify)
2. Enable compression (automatic)
3. Monitor Core Web Vitals
4. Set up caching headers

---

## 🔒 Security Best Practices

1. **Never commit `.env` file**
2. **Use environment variables** for all secrets
3. **Enable RLS** on all Supabase tables
4. **Implement rate limiting** in Supabase
5. **Regular security audits**: `npm audit`
6. **Keep dependencies updated**: `npm update`
7. **Use HTTPS only** (automatic on platforms)
8. **Implement CSP headers** (optional)

---

## 📱 Mobile App (Future)

To create a mobile version:

1. **React Native**:

   ```bash
   npx react-native init CricketAuction
   ```

   - Reuse components and logic
   - Adapt UI for mobile

2. **Capacitor** (Easier):
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add ios
   npx cap add android
   ```
   - Use existing React app
   - Build native apps

---

## 🆘 Support After Deployment

### Common Issues

**Issue**: App loads but shows no data

- **Fix**: Check Supabase connection, verify RLS policies

**Issue**: Login doesn't work

- **Fix**: Enable Email auth in Supabase, create test user

**Issue**: Real-time not working

- **Fix**: Enable realtime on tables, check subscriptions

**Issue**: CSV upload fails

- **Fix**: Check file format, verify bulk insert permissions

---

## 📞 Getting Help

- **Vercel**: https://vercel.com/support
- **Netlify**: https://www.netlify.com/support/
- **Supabase**: https://supabase.com/docs
- **React**: https://react.dev

---

## ✅ Post-Deployment Checklist

- [ ] App is accessible via URL
- [ ] All pages load correctly
- [ ] Login works
- [ ] Teams can be added
- [ ] Players can be added
- [ ] CSV upload works
- [ ] Auction flow works
- [ ] Charts display correctly
- [ ] Export functions work
- [ ] Real-time updates work
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain (if applicable)
- [ ] Analytics tracking (if applicable)
- [ ] Error monitoring setup

---

## 🎉 You're Live!

Congratulations! Your Cricket Auction app is now live and ready for tournaments!

**Share your app**: `https://your-app.vercel.app`

---

**Need help?** Check the troubleshooting section or reach out to the community.
