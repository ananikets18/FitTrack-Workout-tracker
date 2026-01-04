# FitTrack Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 16+ installed
- Supabase account (free tier works)
- Git installed

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd Workout-tracker
npm install
```

### 3. Supabase Setup

#### A. Create Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details and wait for setup

#### B. Run Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and click "Run"
4. Verify all tables are created (profiles, workouts, exercises, sets, templates)

#### C. Configure Environment Variables
1. Copy `.env.example` to `.env.development` and `.env.production`
```bash
cp .env.example .env.development
cp .env.example .env.production
```

2. Get your credentials from Supabase:
   - Go to Project Settings → API
   - Copy the `Project URL` and `anon/public` key

3. Update `.env.development`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### D. Configure Authentication
1. In Supabase Dashboard, go to Authentication → URL Configuration
2. Add Site URL: `http://localhost:3000` (for development)
3. Add Redirect URLs:
   - `http://localhost:3000/**`
   - `https://your-production-domain.netlify.app/**`

#### E. Verify Trigger Setup
Run this SQL in Supabase SQL Editor to verify the profile trigger exists:
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

If it doesn't exist, run the trigger creation part of `schema.sql` again.

### 4. Local Development

```bash
# Start development server
npm run dev

# Open browser at http://localhost:3000
```

### 5. Deploy to Production

#### Netlify Setup
1. Connect your GitHub repo to Netlify
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Environment variables:
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
4. Deploy!

#### Post-Deployment
1. Add production URL to Supabase Redirect URLs
2. Test authentication flow
3. Verify workouts are being saved

---

## 🔧 Troubleshooting

### Issue: "Profile not found" error on login
**Solution**: The profile trigger might not be working.

1. Check if trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. Manually create profile for existing user:
```sql
INSERT INTO profiles (id, name)
VALUES ('user-id-here', 'User Name')
ON CONFLICT (id) DO NOTHING;
```

3. Verify RLS policies:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'profiles';
```

### Issue: Workouts not saving
**Checklist**:
1. ✅ User is authenticated (check Network tab)
2. ✅ Profile exists in profiles table
3. ✅ RLS policies are enabled
4. ✅ user_id matches auth.uid()

**Debug Query**:
```sql
-- Check if your profile exists
SELECT * FROM profiles WHERE id = auth.uid();

-- Check RLS policies
SELECT * FROM workouts; -- Should only show your workouts
```

### Issue: "400 Bad Request" on login
**Solution**: This was fixed - make sure you have the latest code where `signInWithPassword` doesn't include `options` parameter.

### Issue: Rate limiting blocking legitimate users
**Solution**: Clear rate limiter from browser console:
```javascript
// In browser console
import { loginRateLimiter } from '/src/utils/rateLimiter.js';
loginRateLimiter.clear();
```

Or clear localStorage:
```javascript
localStorage.clear();
```

---

## 🧪 Testing

### Test User Creation
1. Sign up with a new email
2. Check Supabase → Authentication → Users (should show new user)
3. Check Supabase → Table Editor → profiles (should have entry)

### Test Workout Creation
1. Log a new workout
2. Check Supabase → Table Editor → workouts
3. Verify user_id matches your auth ID

### Test Profile Validation
1. Delete your profile from profiles table
2. Try to login
3. Should show "profile not found" error
4. Should auto sign out

---

## 📊 Database Structure

```
auth.users (Supabase managed)
  ↓
profiles (your data)
  id → auth.users.id
  name
  avatar_url
  
workouts
  id
  user_id → auth.users.id
  type (workout/rest_day)
  name, date, duration, notes
  
exercises
  id
  workout_id → workouts.id
  name, category, notes, order
  
sets
  id
  exercise_id → exercises.id
  reps, weight, completed, order
  
rest_day_activities
  id
  workout_id → workouts.id
  activity, recovery_quality
  
templates
  id
  user_id → auth.users.id
  name, duration, exercises (JSONB)
```

---

## 🔒 Security Checklist

Before going to production:
- [ ] `.env` files are in `.gitignore`
- [ ] Real credentials are in `.env.production` (not in repo)
- [ ] RLS policies are enabled on all tables
- [ ] Profile trigger is working
- [ ] Rate limiting is configured
- [ ] CSP headers are correct in `netlify.toml`
- [ ] HTTPS is enforced
- [ ] Password requirements are 8+ chars with complexity

---

## 📝 Important Notes

1. **Profile Creation**: Profiles are created automatically via database trigger when users sign up. The app also tries to create it in code as a backup.

2. **RLS Security**: Row Level Security ensures users can only access their own data. Never disable RLS in production!

3. **Rate Limiting**: Current implementation is client-side only. For production, enable server-side rate limiting in Supabase settings.

4. **Email Verification**: Currently disabled for easier testing. Enable in production via Supabase → Authentication → Settings.

---

## 🆘 Need Help?

1. Check the [SECURITY.md](SECURITY.md) file for security details
2. Review Supabase logs: Dashboard → Logs
3. Check browser console for errors
4. Verify network requests in DevTools

---

**Last Updated**: January 4, 2026
