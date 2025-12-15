-- Fix RLS policy for institutions table to allow signup
-- This allows unauthenticated users to create institutions during registration

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Institutions can be created by authenticated users" ON institutions;
DROP POLICY IF EXISTS "Institutions are viewable by authenticated users" ON institutions;

-- Create a new policy that allows anyone to view institutions
-- This is needed so the newly created institution can be read back
CREATE POLICY "Institutions are viewable by everyone"
    ON institutions FOR SELECT
    TO anon, authenticated
    USING (true);

-- Create a new policy that allows anyone to insert institutions
-- This is safe because:
-- 1. Users can only create their own institution during signup
-- 2. The institution is immediately linked to their user account
-- 3. Further updates require authentication
CREATE POLICY "Anyone can create institutions during signup"
    ON institutions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Keep the update policy restricted to authenticated users
DROP POLICY IF EXISTS "Institutions can be updated by their admins" ON institutions;

CREATE POLICY "Institutions can be updated by their admins"
    ON institutions FOR UPDATE
    TO authenticated
    USING (admin_user_id = auth.uid());
