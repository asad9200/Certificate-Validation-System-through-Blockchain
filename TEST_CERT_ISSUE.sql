-- =====================================================
-- 🧪 TEST CERTIFICATE ISSUANCE MANUALLY
-- =====================================================

DO $$
DECLARE
    user_id uuid := '444b972c-abe4-43ac-88ae-88a40943da04';
    inst_id uuid;
    cert_id text;
    new_hash text;
BEGIN
    -- 1. Get Institution ID
    SELECT institution_id INTO inst_id FROM user_profiles WHERE id = user_id;
    
    IF inst_id IS NULL THEN
        RAISE EXCEPTION 'User has no institution!';
    END IF;

    -- 2. Generate Fake ID
    cert_id := 'TEST-' || floor(random() * 10000)::text;
    new_hash := md5(random()::text);

    RAISE NOTICE 'Attempting to insert certificate for user % and institution %...', user_id, inst_id;

    -- 3. Try Insert
    INSERT INTO certificates (
        certificate_id,
        hash,
        holder_name,
        holder_email,
        course_name,
        institution_id,
        institution_name,
        issue_date,
        issuer_id,
        status,
        blockchain_tx_id
    ) VALUES (
        cert_id,
        new_hash,
        'Test Student',
        'test@student.com',
        'Test Course',
        inst_id,
        'Test Institution',
        NOW(),
        user_id,
        'valid',
        'tx_test_123'
    );

    RAISE NOTICE '✅ SUCCESS! Certificate inserted.';
    
    -- 4. Rollback so we don't pollute DB (optional, remove ROLLBACK to keep it)
    -- ROLLBACK; 
END $$;
