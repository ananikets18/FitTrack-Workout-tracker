-- Fix: Create profiles for existing users who don't have them
-- Run this in Supabase SQL Editor if you have users without profiles

-- 1. Check which users are missing profiles
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'name' as name,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. Create missing profiles (run this if any users are missing profiles)
INSERT INTO profiles (id, name, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name,
  u.created_at,
  NOW()
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Verify all users now have profiles
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.id) as users_with_profiles,
  COUNT(DISTINCT u.id) - COUNT(DISTINCT p.id) as missing_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

-- 4. Check the trigger function definition (verify it exists)
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 5. Check if RLS is preventing inserts (should return policies)
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Grant necessary permissions (if needed)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- 7. Verify the trigger is enabled
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  CASE 
    WHEN tgenabled = 'O' THEN 'ENABLED'
    WHEN tgenabled = 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
