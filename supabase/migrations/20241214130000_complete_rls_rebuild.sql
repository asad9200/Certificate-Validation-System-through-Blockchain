-- =====================================================
-- COMPLETE RLS POLICY REBUILD - NO RECURSION
-- This completely removes and rebuilds ALL policies
-- Using SECURITY DEFINER functions to avoid recursion
-- =====================================================

-- Step 1: Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- HELPER FUNCTION: Check if user is super admin
-- SECURITY DEFINER prevents recursion
-- =====================================================
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins
        WHERE id = user_id AND is_active = true
    );
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Get user's institution ID
-- SECURITY DEFINER prevents recursion
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_institution(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    inst_id uuid;
BEGIN
    SELECT institution_id INTO inst_id
    FROM user_profiles
    WHERE id = user_id;
    
    RETURN inst_id;
END;
$$;

-- =====================================================
-- SUPER ADMINS POLICIES
-- =====================================================
CREATE POLICY "super_admins_select_own"
    ON super_admins FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "super_admins_insert_own"
    ON super_admins FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- =====================================================
-- INSTITUTIONS POLICIES
-- =====================================================
CREATE POLICY "institutions_select_all"
    ON institutions FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "institutions_insert_authenticated"
    ON institutions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "institutions_update_super_admin"
    ON institutions FOR UPDATE
    TO authenticated
    USING (is_super_admin(auth.uid()));

CREATE POLICY "institutions_update_own_admin"
    ON institutions FOR UPDATE
    TO authenticated
    USING (
        id = get_user_institution(auth.uid())
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =====================================================
-- USER PROFILES POLICIES (NO RECURSION!)
-- =====================================================
CREATE POLICY "user_profiles_select_own"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "user_profiles_select_super_admin"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (is_super_admin(auth.uid()));

CREATE POLICY "user_profiles_select_same_institution"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        institution_id = get_user_institution(auth.uid())
    );

CREATE POLICY "user_profiles_insert_own"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_own"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- =====================================================
-- CERTIFICATES POLICIES
-- =====================================================
CREATE POLICY "certificates_select_all"
    ON certificates FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "certificates_insert_active_institution"
    ON certificates FOR INSERT
    TO authenticated
    WITH CHECK (
        institution_id = get_user_institution(auth.uid())
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'issuer')
        )
        AND EXISTS (
            SELECT 1 FROM institutions
            WHERE id = get_user_institution(auth.uid())
            AND status = 'active'
            AND is_active = true
        )
    );

CREATE POLICY "certificates_update_own_institution"
    ON certificates FOR UPDATE
    TO authenticated
    USING (
        institution_id = get_user_institution(auth.uid())
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'issuer')
        )
    );

CREATE POLICY "certificates_update_super_admin"
    ON certificates FOR UPDATE
    TO authenticated
    USING (is_super_admin(auth.uid()));

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================
CREATE POLICY "audit_logs_select_super_admin"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (is_super_admin(auth.uid()));

CREATE POLICY "audit_logs_select_own_institution"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        institution_id = get_user_institution(auth.uid())
    );

CREATE POLICY "audit_logs_insert_authenticated"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =====================================================
-- VERIFICATION REQUESTS POLICIES
-- =====================================================
CREATE POLICY "verification_requests_select_all"
    ON verification_requests FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "verification_requests_insert_all"
    ON verification_requests FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- =====================================================
-- GRANT EXECUTE ON HELPER FUNCTIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_institution(uuid) TO authenticated;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify policies are working:
/*
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/
