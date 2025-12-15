-- =====================================================
-- 🛠️ UNIVERSAL FIX: Create Missing Profiles
-- distinct from specific user ID fixes
-- =====================================================

DO $$
DECLARE
    r RECORD;
    inst_id UUID;
BEGIN
    -- Loop through ALL users who don't have a profile yet
    FOR r IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN user_profiles up ON up.id = au.id
        WHERE up.id IS NULL
    LOOP
        RAISE NOTICE 'Fixing user: %', r.email;

        -- 1. Try to find institution ID from metadata
        inst_id := (r.raw_user_meta_data->>'institution_id')::uuid;

        -- 2. If not in metadata, try to find by matching email domain or specific email
        IF inst_id IS NULL THEN
            SELECT id INTO inst_id FROM institutions 
            WHERE email = r.email 
            OR email LIKE '%' || split_part(r.email, '@', 2)
            ORDER BY created_at DESC LIMIT 1;
        END IF;

        -- 3. If still null, just use the LATEST institution (Desperate fallback)
        IF inst_id IS NULL THEN
             SELECT id INTO inst_id FROM institutions ORDER BY created_at DESC LIMIT 1;
             RAISE NOTICE '  -> Fallback to latest institution: %', inst_id;
        END IF;

        -- 4. Create the profile
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
            RAISE NOTICE '  -> ✅ Created profile linked to institution %', inst_id;
        ELSE
            RAISE WARNING '  -> ❌ Could not find any institution to link to!';
        END IF;
        
    END LOOP;
END $$;
