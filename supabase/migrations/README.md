# User Preferences Database Setup

## Overview
This migration adds a `user_preferences` table to store personalized workout settings for each user.

## Features
- **Training Split**: User's preferred workout split (PPL, Upper/Lower, Bro Split, Full Body, or Custom)
- **Weekly Frequency**: How many days per week the user works out
- **Volume Targets**: Customizable set targets for each muscle group
- **Setup Status**: Tracks whether the user has completed the onboarding wizard

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `create_user_preferences.sql`
5. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

## Table Schema

```sql
user_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    split VARCHAR(50),
    weekly_frequency INTEGER,
    volume_targets JSONB,
    has_completed_setup BOOLEAN,
    setup_completed_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

## Security
- Row Level Security (RLS) is enabled
- Users can only access their own preferences
- Automatic `updated_at` timestamp updates

## Integration
The app automatically:
- Loads preferences from Supabase when user logs in
- Syncs preferences to Supabase when updated
- Falls back to localStorage if offline
- Migrates localStorage preferences to Supabase on first login

## Testing
After applying the migration, test by:
1. Logging in to the app
2. Completing the setup wizard (if you have 2+ workouts)
3. Logging out and back in
4. Verify preferences are persisted
