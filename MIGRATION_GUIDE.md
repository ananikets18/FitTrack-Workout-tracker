# Migrating Existing IndexedDB Data to Supabase

## Problem
You have workout data in IndexedDB (local browser storage) but your Supabase database is empty. You need to push this data to Supabase so it syncs across all your devices.

## Solution Overview

The sync system works like this:
```
IndexedDB (local) → Sync Manager → Supabase (cloud) → Other Devices
```

Each workout has a `syncStatus` field:
- **`pending`** - Needs to be synced to Supabase
- **`synced`** - Already in Supabase
- **`error`** - Failed to sync

## Step-by-Step Migration

### Step 1: Check Current Status

1. Open your app
2. Navigate to `/debug/sync`
3. Click "Check Status"
4. Look at the numbers:
   - **Pending**: Workouts waiting to sync
   - **Synced**: Workouts already in Supabase
   - **Total**: All workouts in IndexedDB

### Step 2: Mark Data as Pending (If Needed)

If you see **0 pending** but have workouts locally, you need to mark them as pending:

**Option A: Use Browser Console**
1. Open browser console (F12)
2. Copy the script from `scripts/migrate-to-supabase.js`
3. Paste and press Enter
4. Wait for "Migration complete" message

**Option B: Manual Method**
1. Open browser DevTools (F12)
2. Go to Application → IndexedDB → FitTrackDB → workouts
3. Check if workouts have `syncStatus: 'pending'`
4. If not, use the script above

### Step 3: Trigger Sync

**Method 1: Click Sync Button**
1. Click the sync status indicator (anywhere in the app)
2. Watch it change to "Syncing..."
3. Wait for toast: "Synced! ↑X ↓Y"
4. Check Supabase - data should now be there!

**Method 2: Use Debug Page**
1. Go to `/debug/sync`
2. Click "Force Sync Now"
3. Wait for completion
4. Check the results

**Method 3: Wait for Auto-Sync**
- Auto-sync runs every 5 minutes
- Just wait and it will sync automatically

### Step 4: Verify in Supabase

1. Open Supabase dashboard
2. Go to Table Editor
3. Check these tables:
   - `workouts` - Should have your workouts
   - `exercises` - Should have exercises for each workout
   - `sets` - Should have sets for each exercise
   - `rest_day_activities` - If you have rest days

### Step 5: Test on Another Device

1. Open the app on your mobile device
2. Log in with the **same account**
3. The app will automatically pull data from Supabase
4. You should see all your workouts!

## How Sync Works Across Devices

### Initial Setup (First Device):
```
Device A: Add workout → IndexedDB → Supabase
```

### Other Devices:
```
Device B: Open app → Load from IndexedDB (empty) → Pull from Supabase → IndexedDB
```

### Ongoing Sync:
```
Device A: Add workout → IndexedDB + Supabase (immediate)
Device B: Auto-sync (5 min) → Pull from Supabase → IndexedDB
```

## Important: User-Specific Data

All workouts are tied to your `user_id`:
- ✅ Only YOUR workouts sync to YOUR account
- ✅ Other users can't see your data
- ✅ Each user has their own isolated data

**How it works:**
1. When you log in, you get a unique `user_id`
2. All workouts are saved with `user_id: "your-id"`
3. Supabase filters by `user_id` automatically
4. Only your data syncs to your devices

## Troubleshooting

### Issue 1: Workouts Not Syncing

**Check:**
1. Are you logged in? (Check `/debug/sync`)
2. Are you online? (Check sync indicator)
3. Is `syncStatus` set to `pending`? (Use migration script)
4. Any errors in console? (F12 → Console)

**Fix:**
```javascript
// Run in browser console
localStorage.removeItem('supabase-migrated');
// Then refresh page and sync again
```

### Issue 2: Duplicate Workouts

**Cause:** Same workout synced multiple times

**Fix:**
1. Go to `/debug/sync`
2. Check for duplicates
3. Delete duplicates from Supabase manually
4. Or clear IndexedDB and re-sync

### Issue 3: Different User IDs

**Cause:** Logged in with different accounts on different devices

**Fix:**
1. Log out from all devices
2. Log in with the **same account** everywhere
3. Force sync on each device

### Issue 4: Sync Status Stuck on "Pending"

**Check:**
1. Open browser console (F12)
2. Look for errors
3. Check network tab for failed requests

**Fix:**
```javascript
// Force sync in console
import { syncManager } from './src/lib/syncManager';
syncManager.forceSyncNow('your-user-id');
```

## Monitoring Sync

### Real-Time Monitoring:
1. Watch the sync status indicator
2. Colors show current state:
   - 🟢 Green = Synced
   - 🔵 Blue = Syncing
   - 🟡 Yellow = Pending
   - 🔴 Red = Errors
   - 🟠 Orange = Offline

### Debug Page:
- Go to `/debug/sync`
- Shows detailed stats
- Lists all workouts with sync status
- Allows manual sync

### Browser Console:
- Open DevTools (F12)
- Watch for sync logs:
  - ✅ "Workout saved to cloud immediately"
  - 🔄 "Starting sync..."
  - ✅ "Sync complete"

## Best Practices

### 1. Always Log In
- Sync only works when logged in
- Use the same account on all devices

### 2. Check Sync Status
- Glance at the sync indicator
- Green = good to go
- Yellow/Red = needs attention

### 3. Manual Sync When Needed
- Before switching devices
- After adding important workouts
- When you see "pending" status

### 4. Monitor First Sync
- First time on a new device
- Watch the sync indicator
- Verify data appears

### 5. Keep App Updated
- Auto-sync runs every 5 minutes
- Don't close app immediately after adding data
- Wait for "Synced" status

## Migration Checklist

- [ ] Check current sync status (`/debug/sync`)
- [ ] Mark existing data as pending (if needed)
- [ ] Trigger manual sync
- [ ] Verify data in Supabase
- [ ] Test on another device
- [ ] Confirm same `user_id` everywhere
- [ ] Monitor sync indicator
- [ ] Check for errors in console

## Summary

**To migrate existing data:**
1. Run migration script (if needed)
2. Click sync button
3. Wait for "Synced!" toast
4. Check Supabase
5. Test on other devices

**For ongoing sync:**
- Hybrid mode syncs immediately when online
- Auto-sync runs every 5 minutes
- Manual sync available anytime
- All data is user-specific

Your workouts will now sync across all your devices automatically! 🚀
