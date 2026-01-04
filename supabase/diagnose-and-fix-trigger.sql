-- DIAGNOSTIC & FIX: Profile Auto-Creation Issue
-- Run these queries one by one in Supabase SQL Editor

-- ===== STEP 1: Check if any users exist in auth.users =====
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'name' as name
FROM auth.users
ORDER BY created_at DESC;
-- If this returns users but profiles table is empty, the trigger is not working


-- ===== STEP 2: Check if trigger exists and is enabled =====
SELECT 
  t.tgname as trigger_name,
  CASE 
    WHEN t.tgenabled = 'O' THEN 'ENABLED'
    WHEN t.tgenabled = 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';
-- Should show ENABLED


-- ===== STEP 3: Check function security type =====
SELECT 
  proname as function_name,
  CASE 
    WHEN prosecdef THEN 'SECURITY DEFINER (GOOD - Can bypass RLS)'
    ELSE 'SECURITY INVOKER (BAD - RLS blocks it)'
  END as security_type
FROM pg_proc
WHERE proname = 'handle_new_user';


-- ===== STEP 4: Drop and recreate the trigger function with proper settings =====
-- This is the FIX - run this to properly configure the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER  -- This allows it to bypass RLS policies
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;


-- ===== STEP 5: Recreate the trigger =====
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();


-- ===== STEP 6: Backfill profiles for existing users =====
-- Run this to create profiles for any users that already exist
INSERT INTO public.profiles (id, name, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;


-- ===== STEP 7: Verify everything is working =====
-- Check profile count matches user count
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
    THEN '✅ PROFILES MATCH USERS - WORKING!'
    ELSE '❌ MISMATCH - TRIGGER NOT WORKING'
  END as status;


-- ===== STEP 8: Test the trigger with a new signup =====
-- After running steps 4-6, sign up a new user in your app
-- Then run this to verify the profile was created:
SELECT 
  u.email,
  u.created_at as user_created,
  p.name as profile_name,
  p.created_at as profile_created,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ PROFILE EXISTS'
    ELSE '❌ PROFILE MISSING'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
