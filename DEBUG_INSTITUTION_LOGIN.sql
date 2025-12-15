-- =====================================================
-- DEBUG: Check why institution login is failing
-- Run these queries in Supabase SQL Editor
-- =====================================================

-- 1. Check if you have any institution users
SELECT 
    up.id,
    up.full_name,
    up.user_type,
    up.role,
    up.institution_id,
    i.name as institution_name,
    i.status as institution_status
FROM user_profiles up
LEFT JOIN institutions i ON i.id = up.institution_id
WHERE up.user_type = 'institution_user'
ORDER BY up.created_at DESC;

-- 2. Check RLS policies on user_profiles
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_profiles'
ORDER BY policyname;

-- 3. Test if you can query institutions table
SELECT id, name, email, status, created_at
FROM institutions
ORDER BY created_at DESC;

-- 4. Check if the helper functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('is_super_admin', 'get_user_institution');

-- 5. Test the get_user_institution function
-- Replace USER_ID_HERE with your actual institution user ID from query 1
/*
SELECT get_user_institution('USER_ID_HERE'::uuid);
*/

-- =====================================================
-- POTENTIAL FIX: If RLS is still blocking access
-- =====================================================

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "user_profiles_select_same_institution" ON user_profiles;

-- Create a simpler policy that doesn't use the helper function
CREATE POLICY "user_profiles_select_same_institution"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        institution_id IN (
            SELECT institution_id 
            FROM user_profiles 
            WHERE id = auth.uid()
            LIMIT 1
        )
    );

-- =====================================================
-- ALTERNATIVE: Temporarily disable RLS for debugging
-- =====================================================
-- WARNING: Only use this for testing!
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE institutions DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
