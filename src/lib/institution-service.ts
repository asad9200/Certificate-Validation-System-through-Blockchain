import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Institution = Tables<'institutions'>;
export type InstitutionInsert = TablesInsert<'institutions'>;
export type InstitutionUpdate = TablesUpdate<'institutions'>;

/**
 * Get all institutions
 */
export async function getInstitutions(): Promise<Institution[]> {
    const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching institutions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get an institution by ID
 */
export async function getInstitutionById(id: string): Promise<Institution | null> {
    const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching institution:', error);
        throw error;
    }

    return data;
}

/**
 * Create a new institution
 */
export async function createInstitution(
    institutionData: {
        name: string;
        email: string;
        website?: string | null;
        address?: string | null;
        phone?: string | null;
        status?: 'pending' | 'active' | 'suspended' | 'deactivated';
    }
): Promise<{ data: Institution | null; error: any }> {
    const newInstitution: InstitutionInsert = {
        name: institutionData.name,
        email: institutionData.email,
        website: institutionData.website || null,
        address: institutionData.address || null,
        phone: institutionData.phone || null,
        status: institutionData.status || 'pending', // Default to pending
    };

    const { data, error } = await supabase
        .from('institutions')
        .insert(newInstitution)
        .select()
        .single();

    if (error) {
        console.error('Error creating institution:', error);
        return { data: null, error };
    }

    return { data, error: null };
}

/**
 * Update an institution
 */
export async function updateInstitution(
    id: string,
    updates: Partial<InstitutionUpdate>
): Promise<Institution> {
    const { data, error } = await supabase
        .from('institutions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating institution:', error);
        throw error;
    }

    return data;
}

/**
 * Get institution statistics
 */
export async function getInstitutionStats(institutionId: string): Promise<{
    total_certificates: number;
    valid_certificates: number;
    revoked_certificates: number;
    suspended_certificates: number;
    total_verifications: number;
}> {
    const { data, error } = await supabase
        .rpc('get_institution_stats', { inst_id: institutionId });

    if (error) {
        console.error('Error fetching institution stats:', error);
        throw error;
    }

    return data[0] || {
        total_certificates: 0,
        valid_certificates: 0,
        revoked_certificates: 0,
        suspended_certificates: 0,
        total_verifications: 0,
    };
}

/**
 * Get the default institution (CertChain University)
 */
export async function getDefaultInstitution(): Promise<Institution> {
    const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('email', 'admin@certchain.edu')
        .single();

    if (error) {
        console.error('Error fetching default institution:', error);
        throw error;
    }

    return data;
}
