import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Organization = Tables<'institutions'>;
export type SystemStats = {
    total_institutions: number;
    active_institutions: number;
    pending_institutions: number;
    total_certificates: number;
    total_verifications: number;
};

/**
 * Sign in as a super admin
 * Verifies credentials and checks if user has super_admin role
 */
export async function signInSuperAdmin(email: string, password: string) {
    try {
        // Sign in with Supabase Auth
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            return { user: null, error: signInError };
        }

        if (!data.user) {
            return {
                user: null,
                error: { message: 'Authentication failed' }
            };
        }

        // Check if user is a super admin
        const { data: superAdmin, error: superAdminError } = await supabase
            .from('super_admins')
            .select('id, is_active')
            .eq('id', data.user.id)
            .eq('is_active', true)
            .single();

        if (superAdminError || !superAdmin) {
            // Sign out if not a super admin
            await supabase.auth.signOut();
            return {
                user: null,
                error: { message: 'Unauthorized: Super admin access required' }
            };
        }

        return { user: data.user, error: null };
    } catch (err: any) {
        return {
            user: null,
            error: { message: err.message || 'An unexpected error occurred' }
        };
    }
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        const { data: superAdmin } = await supabase
            .from('super_admins')
            .select('id, is_active')
            .eq('id', user.id)
            .eq('is_active', true)
            .single();

        return !!superAdmin;
    } catch {
        return false;
    }
}

/**
 * Get all organizations with optional filters
 */
export async function getAllOrganizations(filters?: {
    status?: 'pending' | 'active' | 'suspended' | 'deactivated';
    search?: string;
}): Promise<Organization[]> {
    let query = supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

/**
 * Get system-wide statistics (super admin only)
 */
export async function getSystemStats(): Promise<SystemStats> {
    const { data, error } = await supabase.rpc('get_system_stats');

    if (error) throw error;

    // The RPC returns an array with one object
    return data[0] as SystemStats;
}

/**
 * Approve an organization
 */
export async function approveOrganization(
    organizationId: string,
    approvalNotes?: string
) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Verify super admin
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
        throw new Error('Unauthorized: Only super admins can approve organizations');
    }

    const { data, error } = await supabase
        .from('institutions')
        .update({
            status: 'active',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: approvalNotes || null,
        })
        .eq('id', organizationId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Reject an organization
 */
export async function rejectOrganization(
    organizationId: string,
    rejectionNotes: string
) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Verify super admin
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
        throw new Error('Unauthorized: Only super admins can reject organizations');
    }

    const { data, error } = await supabase
        .from('institutions')
        .update({
            status: 'deactivated',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: rejectionNotes,
        })
        .eq('id', organizationId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Suspend an organization
 */
export async function suspendOrganization(
    organizationId: string,
    reason: string
) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Verify super admin
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
        throw new Error('Unauthorized: Only super admins can suspend organizations');
    }

    const { data, error } = await supabase
        .from('institutions')
        .update({
            status: 'suspended',
            approval_notes: reason,
        })
        .eq('id', organizationId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Activate/Reactivate an organization
 */
export async function activateOrganization(
    organizationId: string,
    notes?: string
) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Verify super admin
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
        throw new Error('Unauthorized: Only super admins can activate organizations');
    }

    const { data, error } = await supabase
        .from('institutions')
        .update({
            status: 'active',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes || null,
        })
        .eq('id', organizationId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Sign out the current user
 */
export async function signOutSuperAdmin() {
    const { error } = await supabase.auth.signOut();
    return { error };
}
