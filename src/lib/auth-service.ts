import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type UserProfile = Tables<'user_profiles'>;
export type UserRole = 'admin' | 'issuer' | 'viewer';
export type UserType = 'super_admin' | 'institution_user';

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
}> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return {
        user: data.user,
        session: data.session,
        error,
    };
}

/**
 * Sign up institution with admin user
 */
export async function signUpInstitution(
    email: string,
    password: string,
    fullName: string,
    institutionId: string
): Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
}> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                institution_id: institutionId,
                user_type: 'institution_user',
                role: 'admin',
            },
        },
    });

    // User profile is now created automatically via Postgres Trigger
    // See: supabase/migrations/20241214130000_fix_signup_flow.sql

    return {
        user: data.user,
        session: data.session,
        error,
    };
}

/**
 * Legacy sign up - kept for compatibility
 */
export async function signUp(
    email: string,
    password: string,
    fullName: string,
    institutionId?: string,
    role: UserRole = 'issuer'
): Promise<{
    user: User | null;
    session: Session | null;
    error: AuthError | null;
}> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                institution_id: institutionId,
                user_type: 'institution_user',
                role,
            },
        },
    });

    // User profile is now created automatically via Postgres Trigger

    return {
        user: data.user,
        session: data.session,
        error,
    };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
    const profile = await getCurrentUserProfile();
    return profile?.role === 'admin';
}

/**
 * Check if the current user has permission to issue certificates
 */
export async function canIssueCertificates(): Promise<boolean> {
    const profile = await getCurrentUserProfile();
    return profile?.role === 'admin' || profile?.role === 'issuer';
}

/**
 * Update user profile
 */
export async function updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
): Promise<{ data: UserProfile | null; error: any }> {
    const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    return { error };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
    callback: (event: string, session: Session | null) => void
) {
    return supabase.auth.onAuthStateChange(callback);
}
