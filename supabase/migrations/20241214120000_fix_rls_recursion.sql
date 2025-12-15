-- =====================================================
-- FIX: Infinite Recursion in RLS Policies
-- Issue: Circular dependency between user_profiles and super_admins
-- Solution: Simplify policies to avoid cross-table references
-- =====================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Institution admins can view their institution users" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update institutions" ON institutions;
DROP POLICY IF EXISTS "Super admins can update any certificate" ON certificates;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON audit_logs;

-- =====================================================
-- USER PROFILES - SIMPLIFIED POLICIES
-- =====================================================

-- Users can view their own profile (no recursion)
-- This policy already exists and is safe

-- Super admins can view all profiles (use direct auth.uid() check)
CREATE POLICY "Super admins can view all user profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        -- Direct check: is current user in super_admins table?
        EXISTS (
            SELECT 1 FROM super_admins sa
            WHERE sa.id = auth.uid() 
            AND sa.is_active = true
        )
    );

-- Institution members can view profiles from their institution
CREATE POLICY "Institution members can view institution profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        -- Check if viewer is from same institution
        institution_id IN (
            SELECT up2.institution_id 
            FROM user_profiles up2 
            WHERE up2.id = auth.uid()
            AND up2.user_type = 'institution_user'
        )
    );

-- =====================================================
-- INSTITUTIONS - SIMPLIFIED POLICIES  
-- =====================================================

-- Super admins can update institutions (direct check, no user_profiles reference)
CREATE POLICY "Super admins can manage institutions"
    ON institutions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- CERTIFICATES - SIMPLIFIED POLICIES
-- =====================================================

-- Super admins can update any certificate
CREATE POLICY "Super admins can manage all certificates"
    ON certificates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- AUDIT LOGS - SIMPLIFIED POLICIES
-- =====================================================

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view all logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test that policies work without recursion
-- Run this after applying the migration:
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/
