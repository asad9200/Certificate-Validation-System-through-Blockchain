-- =====================================================
-- NUCLEAR OPTION: Create profile with actual values
-- REPLACE THE VALUES BELOW, then run this
-- =====================================================

-- Step 1: Find your actual user ID and institution ID
-- Run this first:
SELECT 
    au.id as user_id,
    au.email as user_email,
    i.id as institution_id,
    i.name as institution_name,
    i.email as institution_email
FROM auth.users au
CROSS JOIN institutions i
WHERE au.email ILIKE '%YOUR_EMAIL_DOMAIN%'  -- Replace with part of your email
AND i.email ILIKE '%YOUR_INSTITUTION_DOMAIN%'  -- Replace with part of institution email
LIMIT 5;

-- =====================================================
-- Step 2: Copy the UUIDs from above and paste below
-- Then run this INSERT
-- =====================================================

-- PASTE YOUR VALUES HERE:
-- user_id: 
-- institution_id: 

INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
VALUES (
    'PASTE_USER_ID_HERE'::uuid,      -- From Step 1: user_id
    'Your Full Name',                  -- Your actual name
    'institution_user',
    'PASTE_INSTITUTION_ID_HERE'::uuid, --From Step 1: institution_id
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE 
SET 
    full_name = EXCLUDED.full_name,
    user_type = EXCLUDED.user_type,
    institution_id = EXCLUDED.institution_id,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- =====================================================
-- Step 3: Verify it worked
-- =====================================================

SELECT 
    up.id,
    up.full_name,
    up.user_type,
    up.role,
    i.name as institution_name,
    i.status as institution_status
FROM user_profiles up
JOIN institutions i ON i.id = up.institution_id
WHERE up.user_type = 'institution_user'
ORDER BY up.created_at DESC;

-- You should see YOUR profile in the results above
