-- =====================================================
-- SUPER ADMIN SETUP VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to debug login issues
-- =====================================================

-- Step 1: Check if super_admins table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'super_admins'
);
-- Expected: true

-- Step 2: Check if migration ran successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: should see super_admins, institutions, user_profiles, certificates, etc.

-- Step 3: Check auth users (find your super admin user)
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'cyberforceuoch@gmail.com';
-- Expected: Should return 1 row with your user ID and confirmed email
-- If this returns NOTHING, you need to create the user in Authentication > Users

-- Step 4: Check super_admins table
SELECT id, email, full_name, is_active, created_at
FROM super_admins;
-- Expected: Should show your super admin record
-- If EMPTY, you need to run the INSERT statement in Step 2.2 of setup guide

-- Step 5: Check user_profiles table
SELECT id, full_name, user_type, is_active
FROM user_profiles
WHERE user_type = 'super_admin';
-- Expected: Should show your profile with user_type = 'super_admin'
-- If EMPTY, you need to run the INSERT statement in Step 2.2 of setup guide

-- =====================================================
-- TROUBLESHOOTING STEPS
-- =====================================================

-- If Step 3 returns NOTHING:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create new user"
-- 3. Email: cyberforceuoch@gmail.com
-- 4. Password: [YOUR STRONG PASSWORD]
-- 5. Auto Confirm User: ✅ Check this box
-- 6. Click "Create User"
-- 7. Copy the user ID (UUID) from the users list
-- 8. Then proceed to create super_admins and user_profiles records

-- If Step 4 or Step 5 returns EMPTY (but Step 3 has a user):
-- Run these INSERT statements (replace USER_ID_HERE with actual UUID from Step 3):

/*
-- Get the user ID first
SELECT id FROM auth.users WHERE email = 'cyberforceuoch@gmail.com';

-- Then insert super admin record (replace USER_ID_HERE)
INSERT INTO super_admins (id, email, full_name, is_active)
VALUES (
    'USER_ID_HERE'::uuid,
    'cyberforceuoch@gmail.com',
    'Super Admin',
    true
);

-- Insert user profile (replace USER_ID_HERE)
INSERT INTO user_profiles (id, full_name, user_type, is_active)
VALUES (
    'USER_ID_HERE'::uuid,
    'Super Admin',
    'super_admin',
    true
);
*/

-- =====================================================
-- VERIFICATION: Test if everything is connected
-- =====================================================

-- This should return 1 row showing everything is connected
SELECT 
    au.id,
    au.email as "Auth Email",
    sa.email as "Super Admin Email",
    sa.is_active as "SA Active",
    up.user_type as "User Type",
    up.is_active as "Profile Active"
FROM auth.users au
LEFT JOIN super_admins sa ON sa.id = au.id
LEFT JOIN user_profiles up ON up.id = au.id
WHERE au.email = 'cyberforceuoch@gmail.com';

-- Expected result:
-- id | Auth Email | Super Admin Email | SA Active | User Type | Profile Active
-- [UUID] | cyberforceuoch@gmail.com | cyberforceuoch@gmail.com | true | super_admin | true

-- If any column is NULL, that part is missing and needs to be created
