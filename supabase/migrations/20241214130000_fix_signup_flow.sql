-- =====================================================
-- FIX: Automate User Profile Creation & Repair Broken State
-- =====================================================

-- 1. Create a secure function to handle new user registration from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
      id, 
      full_name, 
      user_type, 
      institution_id, 
      role, 
      is_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'institution_user'),
    (NEW.raw_user_meta_data->>'institution_id')::uuid, -- Cast to UUID
    NEW.raw_user_meta_data->>'role',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    user_type = EXCLUDED.user_type,
    institution_id = EXCLUDED.institution_id,
    role = EXCLUDED.role,
    updated_at = NOW();
  return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Immediate Fix: Repair the specific user from the previous failed attempt
DO $$
DECLARE
    target_user_id uuid := '444b972c-abe4-43ac-88ae-88a40943da04';
    latest_inst_id uuid;
    found_email text;
BEGIN
    -- Find the latest institution created
    SELECT id INTO latest_inst_id FROM institutions ORDER BY created_at DESC LIMIT 1;
    
    -- Check if the target user actually exists in auth.users
    SELECT email INTO found_email FROM auth.users WHERE id = target_user_id;

    IF latest_inst_id IS NOT NULL AND found_email IS NOT NULL THEN
        RAISE NOTICE 'Fixing user % linked to institution %', target_user_id, latest_inst_id;

        -- Upsert profile for this user
        INSERT INTO public.user_profiles (id, full_name, user_type, institution_id, role, is_active)
        VALUES (
            target_user_id,
            'Institution Admin', 
            'institution_user',
            latest_inst_id,
            'admin',
            true
        )
        ON CONFLICT (id) DO UPDATE
        SET
            institution_id = EXCLUDED.institution_id,
            role = EXCLUDED.role,
            is_active = true;
            
        -- Also ensure the institution is active so they can login
        UPDATE institutions SET status = 'active', is_active = true WHERE id = latest_inst_id;
    ELSE
        RAISE NOTICE 'Skipping user fix: User or Institution not found.';
    END IF;
END $$;
