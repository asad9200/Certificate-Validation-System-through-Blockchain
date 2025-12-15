import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { generateCertificateHash } from './certificate-utils';
import { getCurrentUser } from './auth-service';

export type Certificate = Tables<'certificates'>;
export type CertificateInsert = TablesInsert<'certificates'>;
export type CertificateUpdate = TablesUpdate<'certificates'>;
export type AuditLog = Tables<'audit_logs'>;
export type VerificationRequest = Tables<'verification_requests'>;

/**
 * Get all certificates for the current user's institution
 */
export async function getCertificates(): Promise<Certificate[]> {
    const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get a certificate by its hash
 */
export async function getCertificateByHash(hash: string): Promise<Certificate | null> {
    const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('hash', hash)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null;
        }
        console.error('Error fetching certificate:', error);
        throw error;
    }

    return data;
}

/**
 * Get a certificate by its ID
 */
export async function getCertificateById(id: string): Promise<Certificate | null> {
    const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching certificate:', error);
        throw error;
    }

    return data;
}

/**
 * Get certificates by holder email
 */
export async function getCertificatesByHolder(email: string): Promise<Certificate[]> {
    const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('holder_email', email)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create a new certificate
 */
export async function createCertificate(
    certificateData: {
        holderName: string;
        holderEmail: string;
        courseName: string;
        institutionId: string;
        institutionName: string;
        issueDate: string;
        grade?: string;
    }
): Promise<Certificate> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Generate certificate hash
    const hash = generateCertificateHash({
        holderName: certificateData.holderName,
        holderEmail: certificateData.holderEmail,
        courseName: certificateData.courseName,
        institutionName: certificateData.institutionName,
        issueDate: certificateData.issueDate,
        issuerId: user.id,
    });

    // Generate certificate ID using database function
    const { data: certId, error: certIdError } = await supabase
        .rpc('generate_certificate_id', { inst_id: certificateData.institutionId });

    if (certIdError) {
        console.error('Error generating certificate ID:', certIdError);
        throw certIdError;
    }

    // Simulate blockchain transaction (in real implementation, this would call actual blockchain)
    const blockchainTxId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newCertificate: CertificateInsert = {
        certificate_id: certId,
        hash,
        holder_name: certificateData.holderName,
        holder_email: certificateData.holderEmail,
        course_name: certificateData.courseName,
        institution_id: certificateData.institutionId,
        institution_name: certificateData.institutionName,
        issue_date: certificateData.issueDate,
        grade: certificateData.grade || null,
        issuer_id: user.id,
        status: 'valid',
        blockchain_tx_id: blockchainTxId,
    };

    const { data, error } = await supabase
        .from('certificates')
        .insert(newCertificate)
        .select();

    if (error) {
        console.error('Error creating certificate:', error);
        throw error;
    }

    // Handle case where RLS might hide the returned row
    if (!data || data.length === 0) {
        console.warn('Certificate created but returned no data (likely RLS). Returning local object.');
        // Return a constructed object so the UI can proceed
        return {
            ...newCertificate,
            id: 'pending_id_' + Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            revoked_at: null,
            revoked_by: null,
            revocation_reason: null
        } as Certificate;
    }

    return data[0];
}

/**
 * Revoke a certificate
 */
export async function revokeCertificate(
    certificateId: string,
    reason?: string
): Promise<Certificate> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const update: CertificateUpdate = {
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revocation_reason: reason || null,
    };

    const { data, error } = await supabase
        .from('certificates')
        .update(update)
        .eq('id', certificateId)
        .select()
        .single();

    if (error) {
        console.error('Error revoking certificate:', error);
        throw error;
    }

    return data;
}

/**
 * Verify a certificate and log the verification attempt
 */
export async function verifyCertificate(hash: string): Promise<{
    certificate: Certificate | null;
    isValid: boolean;
    message: string;
}> {
    const certificate = await getCertificateByHash(hash);

    let result: 'valid' | 'invalid' | 'revoked' | 'not_found';
    let message: string;
    let isValid = false;

    if (!certificate) {
        result = 'not_found';
        message = 'Certificate not found in the database';
    } else if (certificate.status === 'revoked') {
        result = 'revoked';
        message = 'This certificate has been revoked';
    } else if (certificate.status === 'suspended') {
        result = 'invalid';
        message = 'This certificate is currently suspended';
    } else if (certificate.hash === hash) {
        result = 'valid';
        message = 'Certificate is valid and verified';
        isValid = true;
    } else {
        result = 'invalid';
        message = 'Certificate hash mismatch - possible tampering detected';
    }

    // Log verification request
    await logVerificationRequest(hash, certificate?.id || null, result);

    return {
        certificate,
        isValid,
        message,
    };
}

/**
 * Log a verification request
 */
async function logVerificationRequest(
    hash: string,
    certificateId: string | null,
    result: 'valid' | 'invalid' | 'revoked' | 'not_found'
): Promise<void> {
    const verificationData: TablesInsert<'verification_requests'> = {
        certificate_hash: hash,
        certificate_id: certificateId,
        verification_result: result,
        ip_address: null, // Could be populated from request headers
        user_agent: navigator.userAgent,
    };

    const { error } = await supabase
        .from('verification_requests')
        .insert(verificationData);

    if (error) {
        console.error('Error logging verification request:', error);
    }
}

/**
 * Get audit logs for a certificate
 */
export async function getAuditLogs(certificateId: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('certificate_id', certificateId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get verification requests for a certificate
 */
export async function getVerificationRequests(
    certificateId: string
): Promise<VerificationRequest[]> {
    const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('certificate_id', certificateId)
        .order('verified_at', { ascending: false });

    if (error) {
        console.error('Error fetching verification requests:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get certificate statistics
 */
export async function getCertificateStats(): Promise<{
    total: number;
    valid: number;
    revoked: number;
    suspended: number;
}> {
    const certificates = await getCertificates();

    return {
        total: certificates.length,
        valid: certificates.filter(c => c.status === 'valid').length,
        revoked: certificates.filter(c => c.status === 'revoked').length,
        suspended: certificates.filter(c => c.status === 'suspended').length,
    };
}

/**
 * Subscribe to certificate changes (real-time)
 */
export function subscribeToCertificates(
    callback: (payload: any) => void
) {
    return supabase
        .channel('certificates-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'certificates',
            },
            callback
        )
        .subscribe();
}
