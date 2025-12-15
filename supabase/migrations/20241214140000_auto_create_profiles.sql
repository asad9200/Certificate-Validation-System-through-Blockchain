-- =====================================================
-- AUTOMATIC USER PROFILE CREATION
-- This ensures EVERY new user gets a profile automatically
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS auto_create_user_profile();

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION auto_create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_full_name TEXT;
    user_institution_id UUID;
    user_role TEXT;
    user_type TEXT;
BEGIN
    -- Extract metadata from raw_user_meta_data
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_institution_id := (NEW.raw_user_meta_data->>'institution_id')::uuid;
    user_role := NEW.raw_user_meta_data->>'role';
    user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'institution_user');

    -- Only create profile if it doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
        -- For super admins
        IF user_type = 'super_admin' THEN
            INSERT INTO user_profiles (id, full_name, user_type, is_active)
            VALUES (NEW.id, user_full_name, 'super_admin', true);
            
            RAISE NOTICE 'Created super_admin profile for: %', NEW.email;
        
        -- For institution users
        ELSIF user_type = 'institution_user' AND user_institution_id IS NOT NULL THEN
            INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
            VALUES (
                NEW.id,
                user_full_name,
                'institution_user',
                user_institution_id,
                COALESCE(user_role, 'admin'),
                true
            );
            
            RAISE NOTICE 'Created institution_user profile for: % at institution: %', NEW.email, user_institution_id;
        ELSE
            RAISE WARNING 'Could not create profile for %: missing user_type or institution_id', NEW.email;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger that fires AFTER user is created
CREATE TRIGGER auto_create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_user_profile();

-- =====================================================
-- TEST THE TRIGGER
-- =====================================================
-- This will be triggered automatically on next signup
-- You can test by creating a new institution

-- =====================================================
-- BACKFILL: Create profiles for existing users
-- =====================================================
-- Run this ONCE to fix any existing users without profiles

DO $$
DECLARE
    r RECORD;
    user_full_name TEXT;
    user_institution_id UUID;
    user_role TEXT;
    user_type TEXT;
BEGIN
    FOR r IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN user_profiles up ON up.id = au.id
        WHERE up.id IS NULL
    LOOP
        user_full_name := COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1));
        user_institution_id := (r.raw_user_meta_data->>'institution_id')::uuid;
        user_role := r.raw_user_meta_data->>'role';
        user_type := COALESCE(r.raw_user_meta_data->>'user_type', 'institution_user');

        -- For super admins
        IF user_type = 'super_admin' THEN
            INSERT INTO user_profiles (id, full_name, user_type, is_active)
            VALUES (r.id, user_full_name, 'super_admin', true);
            
            RAISE NOTICE 'BACKFILL: Created super_admin profile for: %', r.email;
        
        -- For institution users with institution_id
        ELSIF user_institution_id IS NOT NULL THEN
            INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
            VALUES (
                r.id,
                user_full_name,
                'institution_user',
                user_institution_id,
                COALESCE(user_role, 'admin'),
                true
            );
            
            RAISE NOTICE 'BACKFILL: Created profile for: % at institution: %', r.email, user_institution_id;
        ELSE
            RAISE WARNING 'BACKFILL: Could not create profile for %: missing institution_id', r.email;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- VERIFY
-- =====================================================
-- Check all users now have profiles
SELECT 
    au.id,
    au.email,
    CASE 
        WHEN up.id IS NULL THEN '❌ MISSING' 
        ELSE '✅ HAS PROFILE' 
    END as status,
    up.user_type,
    up.role,
    i.name as institution_name
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
LEFT JOIN institutions i ON i.id = up.institution_id
ORDER BY au.created_at DESC;
