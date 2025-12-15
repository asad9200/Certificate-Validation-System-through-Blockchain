-- =====================================================
-- DIAGNOSTIC: Find out EXACTLY what's wrong
-- Run these queries ONE BY ONE and tell me the results
-- =====================================================

-- Query 1: Who are you logged in as?
SELECT 
    current_user as postgresql_user,
    auth.uid() as your_user_id,
    auth.email() as your_email;

-- Query 2: Does YOUR auth user exist?
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
WHERE id = auth.uid();

-- Query 3: Does YOUR profile exist?
SELECT * FROM user_profiles WHERE id = auth.uid();

-- Query 4: Can you see ANY profiles at all?
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Query 5: Check RLS policies on user_profiles
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- =====================================================
-- Based on results, we'll know if:
-- - Query 1: Shows your ID
-- - Query 2: Shows "null" = You're not logged into Supabase dashboard properly
-- - Query 3: Shows "no rows" = Profile doesn't exist
-- - Query 4: Shows "0" = No profiles exist at all OR RLS blocking all reads
-- - Query 5: Shows what policies are active
-- =====================================================
