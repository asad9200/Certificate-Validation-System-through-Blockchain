-- =====================================================
-- RUN THESE QUERIES IN YOUR ACTUAL SUPABASE PROJECT
-- Project ID: ntlahppqoqihrwfvgdhj
-- URL: https://ntlahppqoqihrwfvgdhj.supabase.co
-- =====================================================

-- 1. CHECK: Does super_admins table exist?
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'super_admins'
) as super_admins_exists;
-- If FALSE: You need to run the migration on this project

-- 2. CHECK: List all your tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
-- Should include: super_admins, institutions, user_profiles, certificates, etc.

-- 3. CHECK: Do you have ANY auth users?
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;
-- This shows ALL users in your project

-- 4. CHECK: Do you have the super admin user?
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'cyberforceuoch@gmail.com';
-- Should return 1 row

-- 5. CHECK: Super admin records
SELECT * FROM super_admins;
-- Should show at least 1 super admin

-- 6. CHECK: User profiles
SELECT * FROM user_profiles WHERE user_type = 'super_admin';
-- Should show at least 1 profile

-- =====================================================
-- COMPLETE CONNECTION TEST
-- =====================================================
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    sa.email as super_admin_email,
    sa.is_active as sa_active,
    up.user_type,
    up.is_active as profile_active
FROM auth.users au
LEFT JOIN super_admins sa ON sa.id = au.id
LEFT JOIN user_profiles up ON up.id = au.id
WHERE au.email = 'cyberforceuoch@gmail.com';

-- =====================================================
-- IF NOTHING EXISTS, CREATE EVERYTHING FROM SCRATCH:
-- =====================================================

-- STEP 1: Go to Supabase Dashboard > Authentication > Users
-- Click "Add User" > "Create new user"
-- Email: cyberforceuoch@gmail.com
-- Password: [YOUR_PASSWORD]
-- Auto Confirm: ✅ YES
-- Click Create

-- STEP 2: Get the user ID
-- SELECT id FROM auth.users WHERE email = 'cyberforceuoch@gmail.com';

-- STEP 3: Insert records (REPLACE the UUID below with actual one from STEP 2)
/*
INSERT INTO super_admins (id, email, full_name, is_active)
VALUES (
    'PASTE_ACTUAL_UUID_HERE'::uuid,
    'cyberforceuoch@gmail.com',
    'Super Admin',
    true
);

INSERT INTO user_profiles (id, full_name, user_type, is_active)
VALUES (
    'PASTE_ACTUAL_UUID_HERE'::uuid,
    'Super Admin',
    'super_admin',
    true
);
*/
