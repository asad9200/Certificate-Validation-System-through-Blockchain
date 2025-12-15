export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            super_admins: {
                Row: {
                    id: string
                    email: string
                    full_name: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "super_admins_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            institutions: {
                Row: {
                    id: string
                    name: string
                    email: string
                    website: string | null
                    address: string | null
                    phone: string | null
                    logo_url: string | null
                    status: 'pending' | 'active' | 'suspended' | 'deactivated'
                    approval_notes: string | null
                    approved_by: string | null
                    approved_at: string | null
                    certificate_count: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email: string
                    website?: string | null
                    address?: string | null
                    phone?: string | null
                    logo_url?: string | null
                    status?: 'pending' | 'active' | 'suspended' | 'deactivated'
                    approval_notes?: string | null
                    approved_by?: string | null
                    approved_at?: string | null
                    certificate_count?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    website?: string | null
                    address?: string | null
                    phone?: string | null
                    logo_url?: string | null
                    status?: 'pending' | 'active' | 'suspended' | 'deactivated'
                    approval_notes?: string | null
                    approved_by?: string | null
                    approved_at?: string | null
                    certificate_count?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "institutions_approved_by_fkey"
                        columns: ["approved_by"]
                        isOneToOne: false
                        referencedRelation: "super_admins"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_profiles: {
                Row: {
                    id: string
                    full_name: string
                    user_type: 'super_admin' | 'institution_user'
                    institution_id: string | null
                    role: 'admin' | 'issuer' | 'viewer' | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name: string
                    user_type: 'super_admin' | 'institution_user'
                    institution_id?: string | null
                    role?: 'admin' | 'issuer' | 'viewer' | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    user_type?: 'super_admin' | 'institution_user'
                    institution_id?: string | null
                    role?: 'admin' | 'issuer' | 'viewer' | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_profiles_institution_id_fkey"
                        columns: ["institution_id"]
                        isOneToOne: false
                        referencedRelation: "institutions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            certificates: {
                Row: {
                    id: string
                    certificate_id: string
                    hash: string
                    holder_name: string
                    holder_email: string
                    course_name: string
                    institution_id: string
                    institution_name: string
                    issue_date: string
                    grade: string | null
                    issuer_id: string
                    status: 'valid' | 'revoked' | 'suspended'
                    blockchain_tx_id: string | null
                    revoked_at: string | null
                    revoked_by: string | null
                    revocation_reason: string | null
                    metadata: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    certificate_id: string
                    hash: string
                    holder_name: string
                    holder_email: string
                    course_name: string
                    institution_id: string
                    institution_name: string
                    issue_date: string
                    grade?: string | null
                    issuer_id: string
                    status?: 'valid' | 'revoked' | 'suspended'
                    blockchain_tx_id?: string | null
                    revoked_at?: string | null
                    revoked_by?: string | null
                    revocation_reason?: string | null
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    certificate_id?: string
                    hash?: string
                    holder_name?: string
                    holder_email?: string
                    course_name?: string
                    institution_id?: string
                    institution_name?: string
                    issue_date?: string
                    grade?: string | null
                    issuer_id?: string
                    status?: 'valid' | 'revoked' | 'suspended'
                    blockchain_tx_id?: string | null
                    revoked_at?: string | null
                    revoked_by?: string | null
                    revocation_reason?: string | null
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "certificates_institution_id_fkey"
                        columns: ["institution_id"]
                        isOneToOne: false
                        referencedRelation: "institutions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "certificates_issuer_id_fkey"
                        columns: ["issuer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "certificates_revoked_by_fkey"
                        columns: ["revoked_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            audit_logs: {
                Row: {
                    id: string
                    certificate_id: string | null
                    institution_id: string | null
                    action_type: 'certificate' | 'institution' | 'super_admin'
                    action: 'issued' | 'verified' | 'revoked' | 'suspended' | 'reactivated' | 'viewed' | 'approved' | 'rejected' | 'status_changed' | 'created' | 'updated'
                    performed_by: string | null
                    performed_by_email: string | null
                    performed_by_type: 'super_admin' | 'institution_user' | 'anonymous' | null
                    ip_address: string | null
                    user_agent: string | null
                    details: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    certificate_id?: string | null
                    institution_id?: string | null
                    action_type: 'certificate' | 'institution' | 'super_admin'
                    action: 'issued' | 'verified' | 'revoked' | 'suspended' | 'reactivated' | 'viewed' | 'approved' | 'rejected' | 'status_changed' | 'created' | 'updated'
                    performed_by?: string | null
                    performed_by_email?: string | null
                    performed_by_type?: 'super_admin' | 'institution_user' | 'anonymous' | null
                    ip_address?: string | null
                    user_agent?: string | null
                    details?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    certificate_id?: string | null
                    institution_id?: string | null
                    action_type?: 'certificate' | 'institution' | 'super_admin'
                    action?: 'issued' | 'verified' | 'revoked' | 'suspended' | 'reactivated' | 'viewed' | 'approved' | 'rejected' | 'status_changed' | 'created' | 'updated'
                    performed_by?: string | null
                    performed_by_email?: string | null
                    performed_by_type?: 'super_admin' | 'institution_user' | 'anonymous' | null
                    ip_address?: string | null
                    user_agent?: string | null
                    details?: Json
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_certificate_id_fkey"
                        columns: ["certificate_id"]
                        isOneToOne: false
                        referencedRelation: "certificates"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "audit_logs_institution_id_fkey"
                        columns: ["institution_id"]
                        isOneToOne: false
                        referencedRelation: "institutions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "audit_logs_performed_by_fkey"
                        columns: ["performed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            verification_requests: {
                Row: {
                    id: string
                    certificate_hash: string
                    certificate_id: string | null
                    verification_result: 'valid' | 'invalid' | 'revoked' | 'not_found'
                    ip_address: string | null
                    user_agent: string | null
                    location: Json | null
                    verified_at: string
                }
                Insert: {
                    id?: string
                    certificate_hash: string
                    certificate_id?: string | null
                    verification_result: 'valid' | 'invalid' | 'revoked' | 'not_found'
                    ip_address?: string | null
                    user_agent?: string | null
                    location?: Json | null
                    verified_at?: string
                }
                Update: {
                    id?: string
                    certificate_hash?: string
                    certificate_id?: string | null
                    verification_result?: 'valid' | 'invalid' | 'revoked' | 'not_found'
                    ip_address?: string | null
                    user_agent?: string | null
                    location?: Json | null
                    verified_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "verification_requests_certificate_id_fkey"
                        columns: ["certificate_id"]
                        isOneToOne: false
                        referencedRelation: "certificates"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_institution_stats: {
                Args: {
                    inst_id: string
                }
                Returns: {
                    total_certificates: number
                    valid_certificates: number
                    revoked_certificates: number
                    suspended_certificates: number
                    total_verifications: number
                }[]
            }
            get_system_stats: {
                Args: Record<string, never>
                Returns: {
                    total_institutions: number
                    active_institutions: number
                    pending_institutions: number
                    total_certificates: number
                    total_verifications: number
                }[]
            }
            generate_certificate_id: {
                Args: {
                    inst_id: string
                }
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[keyof Database]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
