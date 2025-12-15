-- =====================================================
-- IMMEDIATE FIX: Create Your Profile NOW
-- Copy and paste this into Supabase SQL Editor
-- =====================================================

-- Step 1: See your user info and find what's missing
SELECT 
    au.id as user_id,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.raw_user_meta_data->>'institution_id' as institution_id,
    au.raw_user_meta_data->>'role' as role,
    CASE WHEN up.id IS NULL THEN '❌ NO PROFILE' ELSE '✅ HAS PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
WHERE au.email = auth.email()  -- This gets YOUR current email
LIMIT 1;

-- =====================================================
-- Step 2: CREATE YOUR PROFILE
-- This will insert YOUR profile automatically
-- =====================================================

INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    COALESCE(au.raw_user_meta_data->>'user_type', 'institution_user') as user_type,
    (au.raw_user_meta_data->>'institution_id')::uuid as institution_id,
    COALESCE(au.raw_user_meta_data->>'role', 'admin') as role,
    true as is_active
FROM auth.users au
WHERE au.email = auth.email()
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = au.id);

-- =====================================================
-- Step 3: VERIFY IT WORKED
-- =====================================================

SELECT 
    up.*,
    i.name as institution_name,
    i.status as institution_status
FROM user_profiles up
LEFT JOIN institutions i ON i.id = up.institution_id
WHERE up.id IN (SELECT id FROM auth.users WHERE email = auth.email());

-- =====================================================
-- RESULT: You should see your profile with your name,
-- institution, and role = 'admin'
-- =====================================================
