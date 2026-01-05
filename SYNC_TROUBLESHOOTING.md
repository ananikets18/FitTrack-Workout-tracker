# Workout Sync Issue - Desktop to Mobile

## Problem
Workouts added on desktop are not visible on mobile, even though both devices are logged in with the same account.

## Root Cause
Your app uses an **offline-first architecture** with the following structure:

1. **Local Storage (IndexedDB)**: Each device has its own local database
2. **Cloud Storage (Supabase)**: Central database for all devices
3. **Sync Manager**: Syncs data between IndexedDB ↔ Supabase

### How It Works:
```
Desktop IndexedDB ←→ Supabase ←→ Mobile IndexedDB
```

When you add a workout:
1. It's saved to your device's IndexedDB immediately
2. The sync manager should push it to Supabase (debounced, 2 seconds delay)
3. Other devices should pull it from Supabase when they load

## Possible Issues

### 1. Sync Not Happening
- The sync is debounced (2 second delay) and rate-limited (minimum 10 seconds between syncs)
- If you're offline, workouts queue for later sync
- Sync might fail silently

### 2. User ID Mismatch
- Workouts are tied to `userId`
- If the user ID is different between devices, they won't sync

### 3. Sync Status Stuck on "Pending"
- Workouts have a `syncStatus` field: `pending`, `synced`, or `error`
- If stuck on `pending`, they haven't been pushed to Supabase yet

## How to Diagnose

### Step 1: Access the Debug Page
Navigate to: **`/debug/sync`** in your app

This will show you:
- ✅ Online status
- ✅ Last sync time
- ✅ Number of pending/synced/error workouts
- ✅ Your user ID
- ✅ All workouts in local database with their sync status

### Step 2: Check on Both Devices

**On Desktop:**
1. Go to `/debug/sync`
2. Click "Check Status"
3. Note:
   - How many workouts are "Pending"
   - How many are "Synced"
   - Your User ID
   - Last sync time

**On Mobile:**
1. Go to `/debug/sync`
2. Click "Check Status"
3. Verify:
   - Same User ID as desktop
   - Last sync time
   - Total workouts (should match desktop after sync)

### Step 3: Force Manual Sync

**On Desktop:**
1. Go to `/debug/sync`
2. Click "Force Sync Now"
3. Wait for completion
4. Check the result (pushed/pulled counts)

**On Mobile:**
1. Go to `/debug/sync`
2. Click "Force Sync Now"
3. This should pull workouts from Supabase
4. Navigate to home page to see workouts

## Quick Fix Steps

### Option 1: Manual Sync (Recommended)
1. On desktop: Go to `/debug/sync` → Click "Force Sync Now"
2. Wait for success message
3. On mobile: Go to `/debug/sync` → Click "Force Sync Now"
4. Refresh the home page

### Option 2: Wait for Auto-Sync
- Auto-sync runs every 5 minutes when online
- Just wait and it should sync automatically

### Option 3: Add Sync Button to UI
You can add a manual sync button to the main UI for easier access.

## Verification

After syncing, verify:
1. ✅ Desktop shows workouts as "Synced" (not "Pending")
2. ✅ Mobile pulls the same workouts from Supabase
3. ✅ Both devices show the same total workout count
4. ✅ Same User ID on both devices

## Common Issues & Solutions

### Issue: Different User IDs
**Solution**: Log out and log back in on both devices with the same account

### Issue: Workouts Stuck on "Pending"
**Solution**: 
1. Check internet connection
2. Force sync manually
3. Check browser console for errors

### Issue: Workouts Show "Error" Status
**Solution**:
1. Check the debug page for error details
2. Look at browser console for error messages
3. The workout might have invalid data

### Issue: Sync Says "Offline"
**Solution**: Check your internet connection and try again

## Technical Details

### Sync Timing
- **Debounce**: 2 seconds after any change
- **Rate Limit**: Minimum 10 seconds between syncs
- **Auto-Sync**: Every 5 minutes (when logged in)

### Sync Process
1. Process offline queue
2. Push local changes (pending workouts) to Supabase
3. Pull remote changes from Supabase
4. Resolve conflicts (last-write-wins)
5. Update sync status

### Files Involved
- `src/lib/syncManager.js` - Handles all sync logic
- `src/lib/indexedDB.js` - Local database
- `src/lib/supabase.js` - Cloud database
- `src/context/WorkoutContext.jsx` - Manages workout state
- `src/components/debug/SyncDebug.jsx` - Debug UI

## Prevention

To avoid this issue in the future:
1. Always wait a few seconds after adding a workout before closing the app
2. Ensure you're online when adding workouts
3. Check the sync status occasionally
4. Use the same account on all devices

## Need More Help?

If the issue persists:
1. Open browser console (F12)
2. Look for errors related to "sync" or "Supabase"
3. Check the Network tab for failed API calls
4. Share the console errors for further debugging
