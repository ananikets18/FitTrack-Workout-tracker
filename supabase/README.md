# Supabase Setup Guide for FitTrack

This guide will walk you through setting up Supabase for your FitTrack application.

## Prerequisites

- A Supabase account (free tier works fine)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project Name**: FitTrack (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project" and wait 1-2 minutes

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. In your project root, create a `.env` file (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Never commit `.env` to version control. It should already be in `.gitignore`.

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (database icon)
2. Click "New query"
3. Open `supabase/schema.sql` from this project
4. Copy the entire SQL content and paste it into the Supabase SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned" - this means all tables were created!

### What This Creates:

- **profiles** - User profile information
- **workouts** - Workout records (supports both regular workouts and rest days)
- **exercises** - Exercise details within workouts
- **sets** - Individual sets for each exercise
- **rest_day_activities** - Activities logged on rest days
- **templates** - Saved workout templates
- **Indexes** - For fast queries
- **RLS Policies** - Security rules so users can only access their own data

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. **Email** provider should be enabled by default
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation and password reset emails (optional)

### Optional: Enable Social Login

If you want Google, GitHub, etc. login:

1. Go to **Authentication** → **Providers**
2. Enable your preferred provider(s)
3. Follow the setup instructions for each provider
4. Update the `Login.jsx` component to include these providers

## Step 6: Install Dependencies

Run in your project directory:

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-ui-react` - Pre-built auth components
- `@supabase/auth-ui-shared` - Shared auth utilities

## Step 7: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your app (usually `http://localhost:5173`)

3. You should see the login page

4. Try creating an account:
   - Click "Sign Up" tab
   - Enter an email and password
   - Check your email for confirmation (or disable email confirmation in Supabase settings for testing)

5. Once logged in, you should be redirected to the home page!

## Verification Checklist

- [ ] Supabase project created
- [ ] API keys added to `.env` file
- [ ] Database schema executed successfully
- [ ] Email authentication configured
- [ ] npm packages installed
- [ ] Can access login page
- [ ] Can create an account
- [ ] Can log in successfully

## Next Steps

### Phase 2: Migrate Existing Data

If you have existing workout data in localStorage:

1. A migration tool will be created to transfer your data
2. This will allow you to keep all your existing workout history

### Phase 3: Update App to Use Supabase

The following components will be updated to use Supabase:

- `WorkoutContext.jsx` - Replace localStorage with Supabase queries
- `TemplateContext.jsx` - Use Supabase for templates
- Add real-time sync capabilities
- Add offline support with local caching

## Troubleshooting

### "Missing Supabase environment variables"

- Check that your `.env` file exists in the project root
- Verify the variable names start with `VITE_`
- Restart your dev server after adding environment variables

### SQL Error When Running Schema

- Make sure you're running the query in the SQL Editor
- Check that you copied the entire schema file
- Try running each section separately if you get errors

### Can't Create Account

- Check that email authentication is enabled in Supabase
- Look for email confirmation requirements
- Check Supabase logs: **Authentication** → **Logs**

### Login Page Shows 404

- Make sure you ran `npm install`
- Check that `Login.jsx` exists in `src/pages/`
- Restart your dev server

## Support

For more help:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Security Notes

🔒 **Row Level Security (RLS)** is enabled on all tables, meaning:
- Users can only access their own data
- All queries are automatically filtered by user ID
- No user can see or modify another user's workouts

🔑 **Never expose your service_role key** - only use the `anon` key in your frontend code.
