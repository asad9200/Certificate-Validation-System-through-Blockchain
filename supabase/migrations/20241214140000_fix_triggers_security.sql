-- =====================================================
-- FIX: Permission Denied for auth.users in Triggers
-- Problem: The trigger 'log_certificate_change' accesses 'auth.users' table
--          to get the email. Normal users cannot read 'auth.users'.
-- Solution: Add SECURITY DEFINER to the function so it runs with admin privileges.
-- =====================================================

-- 1. Update log_certificate_change to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_certificate_change()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_type TEXT;
BEGIN
    -- Get user email and type
    -- Accessing auth.users requires SECURITY DEFINER
    SELECT email INTO user_email FROM auth.users WHERE id = COALESCE(NEW.issuer_id, NEW.revoked_by);
    
    -- Accessing user_profiles
    SELECT user_profiles.user_type INTO user_type FROM public.user_profiles WHERE id = COALESCE(NEW.issuer_id, NEW.revoked_by);

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (certificate_id, institution_id, action_type, action, performed_by, performed_by_email, performed_by_type, details)
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
            INSERT INTO public.audit_logs (certificate_id, institution_id, action_type, action, performed_by, performed_by_email, performed_by_type, details)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update log_institution_change to use SECURITY DEFINER (Good Practice)
CREATE OR REPLACE FUNCTION log_institution_change()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (institution_id, action_type, action, performed_by_type, details)
        VALUES (
            NEW.id,
            'institution',
            'created',
            'institution_user',
            jsonb_build_object('institution_name', NEW.name, 'status', NEW.status)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            SELECT email INTO user_email FROM public.super_admins WHERE id = NEW.approved_by;
            INSERT INTO public.audit_logs (institution_id, action_type, action, performed_by, performed_by_email, performed_by_type, details)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
