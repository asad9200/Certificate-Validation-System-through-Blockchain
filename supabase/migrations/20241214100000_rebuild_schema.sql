-- =====================================================
-- TRUST CHAIN VERIFIED - COMPLETE SCHEMA REBUILD
-- Multi-Institution Certificate System with Super Admin
-- =====================================================

-- Drop existing tables and policies
DROP POLICY IF EXISTS "Institutions are viewable by authenticated users" ON institutions;
DROP POLICY IF EXISTS "Institutions can be created by authenticated users" ON institutions;
DROP POLICY IF EXISTS "Institutions can be updated by their admins" ON institutions;
DROP POLICY IF EXISTS "User profiles are viewable by authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Certificates are viewable by everyone (public verification)" ON certificates;
DROP POLICY IF EXISTS "Certificates can be created by authenticated users" ON certificates;
DROP POLICY IF EXISTS "Certificates can be updated by institution members" ON certificates;
DROP POLICY IF EXISTS "Audit logs are viewable by institution members" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs can be created by authenticated users" ON audit_logs;
DROP POLICY IF EXISTS "Verification requests are viewable by everyone" ON verification_requests;
DROP POLICY IF EXISTS "Verification requests can be created by everyone" ON verification_requests;

DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SUPER ADMINS TABLE
-- =====================================================
CREATE TABLE super_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INSTITUTIONS TABLE
-- =====================================================
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    website TEXT,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deactivated')),
    approval_notes TEXT,
    approved_by UUID REFERENCES super_admins(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    certificate_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for institutions
CREATE INDEX idx_institutions_status ON institutions(status);
CREATE INDEX idx_institutions_email ON institutions(email);
CREATE INDEX idx_institutions_created_at ON institutions(created_at DESC);

-- =====================================================
-- USER PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('super_admin', 'institution_user')),
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    role TEXT CHECK (role IN ('admin', 'issuer', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT role_required_for_institution_user CHECK (
        user_type = 'super_admin' OR (user_type = 'institution_user' AND role IS NOT NULL)
    ),
    CONSTRAINT institution_required_for_institution_user CHECK (
        user_type = 'super_admin' OR (user_type = 'institution_user' AND institution_id IS NOT NULL)
    )
);

-- Create indexes for user profiles
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_institution_id ON user_profiles(institution_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- =====================================================
-- CERTIFICATES TABLE
-- =====================================================
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL UNIQUE,
    holder_name TEXT NOT NULL,
    holder_email TEXT NOT NULL,
    course_name TEXT NOT NULL,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    institution_name TEXT NOT NULL,
    issue_date DATE NOT NULL,
    grade TEXT,
    issuer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'suspended')),
    blockchain_tx_id TEXT,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_certificates_hash ON certificates(hash);
CREATE INDEX idx_certificates_holder_email ON certificates(holder_email);
CREATE INDEX idx_certificates_institution_id ON certificates(institution_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_issue_date ON certificates(issue_date DESC);
CREATE INDEX idx_certificates_certificate_id ON certificates(certificate_id);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('certificate', 'institution', 'super_admin')),
    action TEXT NOT NULL CHECK (action IN ('issued', 'verified', 'revoked', 'suspended', 'reactivated', 'viewed', 'approved', 'rejected', 'status_changed', 'created', 'updated')),
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    performed_by_email TEXT,
    performed_by_type TEXT CHECK (performed_by_type IN ('super_admin', 'institution_user', 'anonymous')),
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_certificate_id ON audit_logs(certificate_id);
CREATE INDEX idx_audit_logs_institution_id ON audit_logs(institution_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- VERIFICATION REQUESTS TABLE
-- =====================================================
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_hash TEXT NOT NULL,
    certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
    verification_result TEXT NOT NULL CHECK (verification_result IN ('valid', 'invalid', 'revoked', 'not_found')),
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for verification requests
CREATE INDEX idx_verification_requests_certificate_hash ON verification_requests(certificate_hash);
CREATE INDEX idx_verification_requests_certificate_id ON verification_requests(certificate_id);
CREATE INDEX idx_verification_requests_verified_at ON verification_requests(verified_at DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON super_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutions_updated_at
    BEFORE UPDATE ON institutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment certificate count
CREATE OR REPLACE FUNCTION increment_certificate_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE institutions 
    SET certificate_count = certificate_count + 1
    WHERE id = NEW.institution_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for certificate count
CREATE TRIGGER increment_certificate_count_trigger
    AFTER INSERT ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION increment_certificate_count();

-- Function to create audit log on certificate changes
CREATE OR REPLACE FUNCTION log_certificate_change()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_type TEXT;
BEGIN
    -- Get user email and type
    SELECT email INTO user_email FROM auth.users WHERE id = COALESCE(NEW.issuer_id, NEW.revoked_by);
    SELECT user_profiles.user_type INTO user_type FROM user_profiles WHERE id = COALESCE(NEW.issuer_id, NEW.revoked_by);

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (certificate_id, institution_id, action_type, action, performed_by, performed_by_email, performed_by_type, details)
        VALUES (
            NEW.id,
            NEW.institution_id,
            'certificate',
            'issued',
            NEW.issuer_id,
            user_email,
            user_type,
            jsonb_build_object('certificate_id', NEW.certificate_id, 'holder_email', NEW.holder_email)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO audit_logs (certificate_id, institution_id, action_type, action, performed_by, performed_by_email, performed_by_type, details)
            VALUES (
                NEW.id,
                NEW.institution_id,
                'certificate',
                NEW.status,
                NEW.revoked_by,
                user_email,
                user_type,
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'reason', NEW.revocation_reason)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for certificate audit logging
CREATE TRIGGER certificate_audit_trigger
    AFTER INSERT OR UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION log_certificate_change();

-- Function to log institution status changes
CREATE OR REPLACE FUNCTION log_institution_change()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (institution_id, action_type, action, performed_by_type, details)
        VALUES (
            NEW.id,
            'institution',
            'created',
            'institution_user',
            jsonb_build_object('institution_name', NEW.name, 'status', NEW.status)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            SELECT email INTO user_email FROM super_admins WHERE id = NEW.approved_by;
            INSERT INTO audit_logs (institution_id, action_type, action, performed_by, performed_by_email, performed_by_type, details)
            VALUES (
                NEW.id,
                'institution',
                'status_changed',
                NEW.approved_by,
                user_email,
                'super_admin',
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'notes', NEW.approval_notes)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for institution audit logging
CREATE TRIGGER institution_audit_trigger
    AFTER INSERT OR UPDATE ON institutions
    FOR EACH ROW
    EXECUTE FUNCTION log_institution_change();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - SIMPLIFIED
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUPER ADMINS POLICIES
-- =====================================================
CREATE POLICY "Super admins can view their own profile"
    ON super_admins FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Super admins can be created during signup"
    ON super_admins FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- =====================================================
-- INSTITUTIONS POLICIES
-- =====================================================
-- Anyone can view all institutions (for public display)
CREATE POLICY "Institutions are viewable by everyone"
    ON institutions FOR SELECT
    TO authenticated, anon
    USING (true);

-- Authenticated users can create institutions (during signup)
CREATE POLICY "Institutions can be created during signup"
    ON institutions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Super admins can update any institution
CREATE POLICY "Super admins can update institutions"
    ON institutions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Institution admins can update their own institution (limited fields)
CREATE POLICY "Institution admins can update their institution"
    ON institutions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() 
            AND institution_id = institutions.id
            AND role = 'admin'
            AND user_type = 'institution_user'
        )
    );

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Institution admins can view profiles from their institution
CREATE POLICY "Institution admins can view their institution users"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.institution_id = user_profiles.institution_id
            AND up.role = 'admin'
            AND up.user_type = 'institution_user'
        )
    );

-- Users can create their own profile (during signup)
CREATE POLICY "Users can create their own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- =====================================================
-- CERTIFICATES POLICIES
-- =====================================================
-- Everyone can view certificates (public verification)
CREATE POLICY "Certificates are publicly viewable"
    ON certificates FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only users from ACTIVE institutions with admin/issuer role can create certificates
CREATE POLICY "Active institution users can create certificates"
    ON certificates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN institutions i ON i.id = up.institution_id
            WHERE up.id = auth.uid()
            AND up.role IN ('admin', 'issuer')
            AND up.user_type = 'institution_user'
            AND i.id = certificates.institution_id
            AND i.status = 'active'
            AND i.is_active = true
        )
    );

-- Institution users can update their own institution's certificates
CREATE POLICY "Institution users can update their certificates"
    ON certificates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND institution_id = certificates.institution_id
            AND role IN ('admin', 'issuer')
            AND user_type = 'institution_user'
        )
    );

-- Super admins can update any certificate
CREATE POLICY "Super admins can update any certificate"
    ON certificates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================
-- Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Institution users can view audit logs for their institution
CREATE POLICY "Institution users can view their audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND institution_id = audit_logs.institution_id
            AND user_type = 'institution_user'
        )
    );

-- Anyone authenticated can create audit logs
CREATE POLICY "Authenticated users can create audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =====================================================
-- VERIFICATION REQUESTS POLICIES
-- =====================================================
-- Everyone can view verification requests
CREATE POLICY "Verification requests are publicly viewable"
    ON verification_requests FOR SELECT
    TO authenticated, anon
    USING (true);

-- Everyone can create verification requests
CREATE POLICY "Anyone can create verification requests"
    ON verification_requests FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get institution statistics
CREATE OR REPLACE FUNCTION get_institution_stats(inst_id UUID)
RETURNS TABLE (
    total_certificates BIGINT,
    valid_certificates BIGINT,
    revoked_certificates BIGINT,
    suspended_certificates BIGINT,
    total_verifications BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_certificates,
        COUNT(*) FILTER (WHERE status = 'valid')::BIGINT as valid_certificates,
        COUNT(*) FILTER (WHERE status = 'revoked')::BIGINT as revoked_certificates,
        COUNT(*) FILTER (WHERE status = 'suspended')::BIGINT as suspended_certificates,
        (SELECT COUNT(*)::BIGINT FROM verification_requests vr 
         JOIN certificates c ON vr.certificate_id = c.id 
         WHERE c.institution_id = inst_id) as total_verifications
    FROM certificates
    WHERE institution_id = inst_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system-wide statistics (super admin only)
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
    total_institutions BIGINT,
    active_institutions BIGINT,
    pending_institutions BIGINT,
    total_certificates BIGINT,
    total_verifications BIGINT
) AS $$
BEGIN
    -- Check if caller is super admin
    IF NOT EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid() AND is_active = true) THEN
        RAISE EXCEPTION 'Unauthorized: Only super admins can access system statistics';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::BIGINT FROM institutions) as total_institutions,
        (SELECT COUNT(*)::BIGINT FROM institutions WHERE status = 'active') as active_institutions,
        (SELECT COUNT(*)::BIGINT FROM institutions WHERE status = 'pending') as pending_institutions,
        (SELECT COUNT(*)::BIGINT FROM certificates) as total_certificates,
        (SELECT COUNT(*)::BIGINT FROM verification_requests) as total_verifications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate certificate ID
CREATE OR REPLACE FUNCTION generate_certificate_id(inst_id UUID)
RETURNS TEXT AS $$
DECLARE
    inst_code TEXT;
    year_code TEXT;
    sequence_num INTEGER;
    cert_id TEXT;
BEGIN
    -- Get institution code (first 3 letters of name, uppercase)
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
    INTO inst_code
    FROM institutions
    WHERE id = inst_id;
    
    IF inst_code IS NULL OR inst_code = '' THEN
        inst_code := 'INS';
    END IF;
    
    -- Get current year
    year_code := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence number for this institution and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_id FROM '\\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM certificates
    WHERE institution_id = inst_id
    AND certificate_id LIKE inst_code || '-' || year_code || '-%';
    
    -- Generate certificate ID
    cert_id := inst_code || '-' || year_code || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN cert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
