-- =====================================================
-- SEED DATA FOR INITIAL SETUP
-- =====================================================

-- Insert a default institution (CertChain University)
INSERT INTO institutions (id, name, email, website, address, phone, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'CertChain University',
    'admin@certchain.edu',
    'https://certchain.edu',
    '123 Blockchain Street, Tech City, TC 12345',
    '+1-555-0100',
    true
) ON CONFLICT (id) DO NOTHING;

-- Note: User profiles will be created automatically when users sign up via Supabase Auth
-- The first user to sign up should be assigned as admin of the default institution
