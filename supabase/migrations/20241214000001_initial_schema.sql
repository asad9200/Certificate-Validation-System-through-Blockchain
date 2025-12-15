-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'issuer', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CERTIFICATES TABLE
-- =====================================================
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id TEXT NOT NULL UNIQUE, -- Human-readable ID like CERT-2024-001
    hash TEXT NOT NULL UNIQUE, -- SHA-256 hash for blockchain verification
    holder_name TEXT NOT NULL,
    holder_email TEXT NOT NULL,
    course_name TEXT NOT NULL,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    institution_name TEXT NOT NULL, -- Denormalized for display
    issue_date DATE NOT NULL,
    grade TEXT,
    issuer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'suspended')),
    blockchain_tx_id TEXT, -- Transaction ID from blockchain
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    metadata JSONB DEFAULT '{}', -- Additional flexible data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_certificates_hash ON certificates(hash);
CREATE INDEX idx_certificates_holder_email ON certificates(holder_email);
CREATE INDEX idx_certificates_institution_id ON certificates(institution_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_issue_date ON certificates(issue_date DESC);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('issued', 'verified', 'revoked', 'suspended', 'reactivated', 'viewed')),
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    performed_by_email TEXT, -- Store email in case user is deleted
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_certificate_id ON audit_logs(certificate_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
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
    location JSONB, -- Store geolocation data if available
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

-- Function to create audit log on certificate changes
CREATE OR REPLACE FUNCTION log_certificate_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (certificate_id, action, performed_by, performed_by_email, details)
        VALUES (NEW.id, 'issued', NEW.issuer_id, NEW.holder_email, jsonb_build_object('certificate_id', NEW.certificate_id));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO audit_logs (certificate_id, action, performed_by, performed_by_email, details)
            VALUES (
                NEW.id, 
                NEW.status, 
                NEW.revoked_by,
                NEW.holder_email,
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Institutions Policies
CREATE POLICY "Institutions are viewable by authenticated users"
    ON institutions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Institutions can be created by authenticated users"
    ON institutions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Institutions can be updated by their admins"
    ON institutions FOR UPDATE
    TO authenticated
    USING (admin_user_id = auth.uid());

-- User Profiles Policies
CREATE POLICY "User profiles are viewable by authenticated users"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- Certificates Policies
CREATE POLICY "Certificates are viewable by everyone (public verification)"
    ON certificates FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Certificates can be created by authenticated users"
    ON certificates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'issuer')
        )
    );

CREATE POLICY "Certificates can be updated by institution members"
    ON certificates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() 
            AND institution_id = certificates.institution_id
            AND role IN ('admin', 'issuer')
        )
    );

-- Audit Logs Policies
CREATE POLICY "Audit logs are viewable by institution members"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM certificates c
            JOIN user_profiles up ON up.institution_id = c.institution_id
            WHERE c.id = audit_logs.certificate_id
            AND up.id = auth.uid()
        )
    );

CREATE POLICY "Audit logs can be created by authenticated users"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Verification Requests Policies
CREATE POLICY "Verification requests are viewable by everyone"
    ON verification_requests FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Verification requests can be created by everyone"
    ON verification_requests FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get certificate statistics for an institution
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

-- Function to generate next certificate ID for an institution
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
    
    -- Get current year
    year_code := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence number for this institution and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_id FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM certificates
    WHERE institution_id = inst_id
    AND certificate_id LIKE inst_code || '-' || year_code || '-%';
    
    -- Generate certificate ID
    cert_id := inst_code || '-' || year_code || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN cert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
