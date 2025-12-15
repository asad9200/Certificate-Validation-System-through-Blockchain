-- =====================================================
-- 🔗 FORCE LINK TO INSTITUTION
-- =====================================================

DO $$
DECLARE
    target_user_id uuid := '444b972c-abe4-43ac-88ae-88a40943da04';
    latest_inst_id uuid;
    inst_name text;
BEGIN
    -- 1. Find the LATEST institution
    SELECT id, name INTO latest_inst_id, inst_name
    FROM institutions 
    ORDER BY created_at DESC 
    LIMIT 1;

    IF latest_inst_id IS NULL THEN
        RAISE EXCEPTION '❌ CRITICAL: No institutions found in database! You must sign up an institution first.';
    END IF;

    RAISE NOTICE 'Found Institution: % (%)', inst_name, latest_inst_id;

    -- 2. Force Update the User Profile
    UPDATE user_profiles
    SET 
        institution_id = latest_inst_id,
        role = 'admin',
        is_active = true
    WHERE id = target_user_id;

    -- 3. Also activate the institution just in case
    UPDATE institutions
    SET status = 'active', is_active = true
    WHERE id = latest_inst_id;

    RAISE NOTICE '✅ SUCCESS! User % linked to %', target_user_id, inst_name;
END $$;
