-- =====================================================
-- MANUAL FIX: Create profile without needing auth.uid()
-- Since you're not authenticated in SQL Editor, we use emails
-- =====================================================

-- Step 1: Find ALL users and institutions
-- Look for YOUR email in the results
SELECT 
    'USER' as type,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 10;

SELECT 
    'INSTITUTION' as type,
    i.id,
    i.name,
    i.email,
    i.status
FROM institutions i
ORDER BY i.created_at DESC
LIMIT 10;

-- =====================================================
-- Step 2: REPLACE the email addresses below and run
-- This will show you the exact IDs you need
-- =====================================================

SELECT 
    au.id as user_id,
    au.email as user_email,
    i.id as institution_id,
    i.name as institution_name
FROM auth.users au
CROSS JOIN institutions i
WHERE au.email = 'REPLACE_WITH_YOUR_EMAIL@example.com'
AND i.email = 'REPLACE_WITH_INSTITUTION_EMAIL@example.com';

-- =====================================================
-- Step 3: Copy the UUIDs from Step 2 and paste below
-- =====================================================

INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
VALUES (
    'PASTE_USER_ID_HERE'::uuid,
    'Your Full Name',
    'institution_user',
    'PASTE_INSTITUTION_ID_HERE'::uuid,
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE 
SET 
    institution_id = EXCLUDED.institution_id,
    role = EXCLUDED.role;

-- =====================================================
-- Step 4: VERIFY
-- =====================================================

SELECT 
    up.id,
    up.full_name,
    up.role,
    i.name as institution_name,
    i.status as institution_status
FROM user_profiles up
JOIN institutions i ON i.id = up.institution_id
WHERE up.user_type = 'institution_user';

-- Should show your profile with admin role
