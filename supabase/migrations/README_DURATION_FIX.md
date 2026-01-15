# Fix: Missing Duration Field for Cardio Exercises

## Problem Identified

The cardio exercise duration was not being saved to Supabase because:

1. ❌ **Database Schema**: The `sets` table was missing a `duration` column
2. ❌ **Insert Operations**: The `createWorkout` function wasn't including `duration` when inserting sets
3. ❌ **Update Operations**: The `updateWorkout` function wasn't including `duration` when updating sets
4. ❌ **Data Retrieval**: The `transformWorkoutFromDB` function wasn't mapping the `duration` field

## Files Fixed

### 1. Created Migration File
- **File**: `supabase/migrations/add_duration_to_sets.sql`
- **Purpose**: Adds the `duration` column to the `sets` table in Supabase

### 2. Updated Supabase Functions
- **File**: `src/lib/supabase.js`
- **Changes**:
  - Added `duration: set.duration` to the `createWorkout` function (line ~112)
  - Added `duration: set.duration` to the `updateWorkout` function (line ~169)
  - Added `duration: set.duration` to the `transformWorkoutFromDB` function (line ~371)

## How to Apply the Fix

### Step 1: Run the Database Migration

You need to add the `duration` column to your Supabase database.

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your FitTrack project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/add_duration_to_sets.sql`
6. Click **Run** to execute the migration

#### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd d:\Portfolio-Projects\Workout-tracker

# Run the migration
supabase db push
```

### Step 2: Verify the Migration

After running the migration, verify it was successful:

1. In Supabase Dashboard, go to **Table Editor**
2. Select the `sets` table
3. Confirm that a new column `duration` (INTEGER, nullable) exists

### Step 3: Test the Fix

1. **Clear your browser cache** (or use incognito mode)
2. Log in to your FitTrack app
3. Create a new workout with a cardio exercise
4. Add a duration (e.g., 30 minutes)
5. Save the workout
6. Check the History page to confirm the duration is displayed correctly

### Step 4: Verify in Database

To confirm data is being saved:

1. In Supabase Dashboard, go to **Table Editor**
2. Select the `sets` table
3. Find the cardio exercise sets you just created
4. Confirm the `duration` column has the correct value

## What This Fixes

✅ Cardio exercise duration is now saved to Supabase  
✅ Duration is preserved when updating workouts  
✅ Duration is correctly displayed in workout history  
✅ Duration data is properly transformed when loading from database  

## Migration SQL

```sql
-- Migration: Add duration column to sets table for cardio exercises
-- This allows tracking duration (in minutes) for cardio exercises

-- Add duration column to sets table
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN sets.duration IS 'Duration in minutes for cardio exercises. NULL for weight training exercises.';
```

## Notes

- The `duration` column is **nullable** because it's only used for cardio exercises
- Weight training exercises will have `NULL` for duration
- Existing data is not affected (old sets will have `NULL` duration)
- The migration is **safe to run** and won't break existing functionality

## Rollback (If Needed)

If you need to rollback this migration:

```sql
ALTER TABLE sets DROP COLUMN IF EXISTS duration;
```

⚠️ **Warning**: This will delete all duration data permanently!
