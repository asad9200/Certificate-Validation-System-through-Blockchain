-- =====================================================
-- FIX FOR USER ID: 444b972c-abe4-43ac-88ae-88a40943da04
-- =====================================================

DO $$
DECLARE
    target_user_id uuid := '444b972c-abe4-43ac-88ae-88a40943da04';
    user_email text;
    target_inst_id uuid;
    inst_name text;
BEGIN
    -- 1. Get the user's email
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id;

    IF user_email IS NULL THEN
        RAISE EXCEPTION 'User % not found in auth.users!', target_user_id;
    END IF;

    RAISE NOTICE 'Found User Email: %', user_email;

    -- 2. Find the institution
    -- We'll try to find the institution created most recently, 
    -- which is almost certainly the one this user just signed up for.
    SELECT id, name INTO target_inst_id, inst_name 
    FROM institutions 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF target_inst_id IS NULL THEN
        RAISE EXCEPTION 'No institutions found in the database!';
    END IF;

    RAISE NOTICE 'Linking to latest Institution: %', inst_name;

    -- 3. Insert or Update the profile
    INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
    VALUES (
        target_user_id,
        COALESCE(split_part(user_email, '@', 1), 'System Admin'), -- Default name from email
        'institution_user',
        target_inst_id,
        'admin',
        true
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        institution_id = EXCLUDED.institution_id,
        role = 'admin',
        is_active = true;

    RAISE NOTICE '✅ SUCCESS! Profile created for user % linked to %', user_email, inst_name;
END $$;
