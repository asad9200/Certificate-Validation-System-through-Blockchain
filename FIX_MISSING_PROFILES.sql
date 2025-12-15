-- =====================================================
-- FIX: Missing user_profiles for institution admins
-- =====================================================

-- Step 1: Check which users are missing profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE 
        WHEN up.id IS NULL THEN 'MISSING PROFILE' 
        ELSE 'HAS PROFILE' 
    END as profile_status
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
WHERE au.email NOT LIKE '%super%'
ORDER BY au.created_at DESC;

-- Step 2: Find your institution ID
-- Replace 'YOUR_INSTITUTION_EMAIL' with your actual institution email
SELECT id, name, email, status 
FROM institutions 
WHERE email = 'YOUR_INSTITUTION_EMAIL';

-- Step 3: Create missing user_profiles
-- REPLACE THESE VALUES:
-- - USER_ID: The id from Step 1 (the user missing a profile)
-- - FULL_NAME: The admin's full name
-- - INSTITUTION_ID: The id from Step 2

/*
INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
VALUES (
    'USER_ID_HERE'::uuid,
    'Admin Full Name',
    'institution_user',
    'INSTITUTION_ID_HERE'::uuid,
    'admin',
    true
);
*/

-- Step 4: Verify the profile was created
SELECT 
    up.*,
    i.name as institution_name,
    i.status as institution_status
FROM user_profiles up
LEFT JOIN institutions i ON i.id = up.institution_id
WHERE up.user_type = 'institution_user';

-- =====================================================
-- AUTOMATED FIX: Create profiles for ALL missing users
-- =====================================================
-- This will create profiles for any auth users that don't have one
-- It will link them to institutions based on email domain matching

/*
DO $$
DECLARE
    r RECORD;
    inst_id UUID;
BEGIN
    FOR r IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN user_profiles up ON up.id = au.id
        WHERE up.id IS NULL
        AND au.email NOT LIKE '%cyberforceuoch%'
    LOOP
        -- Try to find matching institution by email domain
        SELECT id INTO inst_id
        FROM institutions
        WHERE email = r.email
        OR email LIKE '%' || split_part(r.email, '@', 2)
        LIMIT 1;
        
        IF inst_id IS NOT NULL THEN
            INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
            VALUES (
                r.id,
                COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)),
                'institution_user',
                inst_id,
                'admin',
                true
            );
            RAISE NOTICE 'Created profile for %', r.email;
        END IF;
    END LOOP;
END $$;
*/
