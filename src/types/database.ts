/**
 * AffiliationPro Database Types
 * 
 * TypeScript types generated from the Supabase schema.
 * These types match the SQL schema in supabase/schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// ENUMS
// =====================================================

export type UserRole = 'super_admin' | 'admin' | 'affiliate'

export type AffiliateStatus = 'active' | 'pending' | 'paused'

export type SaleStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export type CommissionStatus = 'pending' | 'paid' | 'cancelled'

export type PayoutStatus = 'pending' | 'paid' | 'failed'

export type CommissionLevel = 1 | 2 | 3

// =====================================================
// TABLE ROWS
// =====================================================

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  affiliate_code: string
  parent_id: string | null
  paypal_email: string | null
  subdomain: string | null
  admin_id: string | null
  created_at: string
  updated_at: string
}

export interface Program {
  id: string
  name: string
  description: string | null
  commission_l1: number // Level 1 commission percentage (default: 25%)
  commission_l2: number // Level 2 commission percentage (default: 10%)
  commission_l3: number // Level 3 commission percentage (default: 5%)
  owner_id: string
  is_active: boolean
  created_at: string
}

export interface Affiliate {
  id: string
  program_id: string
  user_id: string
  affiliate_link: string
  parent_affiliate_id: string | null // Level 1 up
  grandparent_affiliate_id: string | null // Level 2 up
  total_earnings: number
  total_referrals: number
  status: AffiliateStatus
  created_at: string
}

export interface Sale {
  id: string
  affiliate_id: string
  program_id: string
  external_order_id: string | null // ID from Systeme.io
  amount: number
  commission_l1: number
  commission_l2: number
  commission_l3: number
  status: SaleStatus
  customer_email: string | null
  customer_name: string | null
  metadata: Json
  created_at: string
  paid_at: string | null
}

export interface Commission {
  id: string
  sale_id: string
  affiliate_id: string
  level: CommissionLevel
  amount: number
  status: CommissionStatus
  paid_at: string | null
  created_at: string
}

export interface Payout {
  id: string
  admin_id: string
  affiliate_id: string
  amount: number
  status: PayoutStatus
  paypal_email: string | null
  created_at: string
  paid_at: string | null
}

export interface Click {
  id: string
  affiliate_id: string
  visitor_id: string | null
  ip_address: string | null
  user_agent: string | null
  referrer_url: string | null
  landing_url: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string | null
  subject: string
  content: string
  is_broadcast: boolean
  read_at: string | null
  created_at: string
  sender?: Profile
  recipient?: Profile
}

// =====================================================
// TABLE INSERT TYPES (for creating records)
// =====================================================

export interface ProfileInsert {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  role?: UserRole
  affiliate_code?: string
  parent_id?: string | null
  paypal_email?: string | null
  subdomain?: string | null
  admin_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProgramInsert {
  id?: string
  name: string
  description?: string | null
  commission_l1?: number
  commission_l2?: number
  commission_l3?: number
  owner_id: string
  is_active?: boolean
  created_at?: string
}

export interface AffiliateInsert {
  id?: string
  program_id: string
  user_id: string
  affiliate_link?: string
  parent_affiliate_id?: string | null
  grandparent_affiliate_id?: string | null
  total_earnings?: number
  total_referrals?: number
  status?: AffiliateStatus
  created_at?: string
}

export interface SaleInsert {
  id?: string
  affiliate_id: string
  program_id: string
  external_order_id?: string | null
  amount: number
  commission_l1?: number
  commission_l2?: number
  commission_l3?: number
  status?: SaleStatus
  customer_email?: string | null
  customer_name?: string | null
  metadata?: Json
  created_at?: string
  paid_at?: string | null
}

export interface CommissionInsert {
  id?: string
  sale_id: string
  affiliate_id: string
  level: CommissionLevel
  amount: number
  status?: CommissionStatus
  paid_at?: string | null
  created_at?: string
}

export interface PayoutInsert {
  id?: string
  admin_id: string
  affiliate_id: string
  amount: number
  status?: PayoutStatus
  paypal_email?: string | null
  created_at?: string
  paid_at?: string | null
}

export interface ClickInsert {
  id?: string
  affiliate_id: string
  visitor_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
  referrer_url?: string | null
  landing_url?: string | null
  created_at?: string
}

export interface MessageInsert {
  id?: string
  sender_id: string
  recipient_id?: string | null
  subject: string
  content: string
  is_broadcast?: boolean
  read_at?: string | null
  created_at?: string
}

// =====================================================
// TABLE UPDATE TYPES
// =====================================================

export type ProfileUpdate = Partial<ProfileInsert>

export type ProgramUpdate = Partial<Omit<ProgramInsert, 'id'>>

export type AffiliateUpdate = Partial<Omit<AffiliateInsert, 'id'>>

export type SaleUpdate = Partial<Omit<SaleInsert, 'id'>>

export type CommissionUpdate = Partial<Omit<CommissionInsert, 'id'>>

export type PayoutUpdate = Partial<Omit<PayoutInsert, 'id'>>

export type MessageUpdate = Partial<Omit<MessageInsert, 'id'>>

// =====================================================
// RELATIONAL TYPES (for joins)
// =====================================================

export interface AffiliateWithProfile extends Affiliate {
  profile: Profile
}

export interface AffiliateWithProgram extends Affiliate {
  program: Program
}

export interface AffiliateWithHierarchy extends Affiliate {
  profile: Profile
  program: Program
  parent: (Affiliate & { profile: Profile }) | null
  grandparent: (Affiliate & { profile: Profile }) | null
}

export interface SaleWithAffiliate extends Sale {
  affiliate: Affiliate
  program: Program
}

export interface CommissionWithSale extends Commission {
  sale: Sale
  affiliate: Affiliate
}

export interface CommissionWithDetails extends Commission {
  sale: Sale & {
    program: Program
  }
  affiliate: Affiliate & {
    profile: Profile
  }
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface AffiliateStats {
  affiliate_id: string
  user_id: string
  program_id: string
  program_name: string
  total_earnings: number
  total_referrals: number
  pending_commissions: number
  total_sales: number
  total_clicks: number
  created_at: string
}

// =====================================================
// DATABASE INTERFACE (for Supabase client)
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      programs: {
        Row: Program
        Insert: ProgramInsert
        Update: ProgramUpdate
      }
      affiliates: {
        Row: Affiliate
        Insert: AffiliateInsert
        Update: AffiliateUpdate
      }
      sales: {
        Row: Sale
        Insert: SaleInsert
        Update: SaleUpdate
      }
      commissions: {
        Row: Commission
        Insert: CommissionInsert
        Update: CommissionUpdate
      }
      payouts: {
        Row: Payout
        Insert: PayoutInsert
        Update: PayoutUpdate
      }
      clicks: {
        Row: Click
        Insert: ClickInsert
        Update: Partial<ClickInsert>
      }
      messages: {
        Row: Message
        Insert: MessageInsert
        Update: MessageUpdate
      }
    }
    Views: {
      affiliate_stats: {
        Row: AffiliateStats
      }
    }
    Functions: {
      get_affiliate_tree: {
        Args: { affiliate_uuid: string }
        Returns: Array<{
          id: string
          user_id: string
          email: string
          full_name: string
          level: number
          total_earnings: number
          total_referrals: number
        }>
      }
      get_pending_commissions: {
        Args: { affiliate_uuid: string }
        Returns: number
      }
      get_global_stats: {
        Args: Record<string, never>
        Returns: {
          total_users: number
          total_admins: number
          total_affiliates: number
          total_sales: number
          total_revenue: number
          pending_payouts: number
          total_payouts: number
        }
      }
      get_admin_stats: {
        Args: { admin_uuid: string }
        Returns: {
          total_affiliates: number
          total_sales: number
          total_revenue: number
          pending_payouts: number
        }
      }
    }
    Enums: {
      user_role: UserRole
      affiliate_status: AffiliateStatus
      sale_status: SaleStatus
      commission_status: CommissionStatus
      payout_status: PayoutStatus
    }
  }
}

// =====================================================
// UTILITY TYPES
// =====================================================

// Type helper to extract table names
export type TableName = keyof Database['public']['Tables']

// Type helper for table rows
export type Tables<T extends TableName> = Database['public']['Tables'][T]['Row']

// Type helper for table inserts
export type TablesInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']

// Type helper for table updates
export type TablesUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

export interface PaginatedResponse<T> {
  data: T[]
  error: Error | null
  count: number | null
  hasMore: boolean
}

// =====================================================
// DASHBOARD STATS TYPES
// =====================================================

export interface DashboardStats {
  affiliate: AffiliateWithProgram & { profile: Profile }
  pendingCommissions: number
  totalClicks: number
  recentSales: Sale[]
  downlineCount: number
}

export interface AdminDashboardStats {
  totalAffiliates: number
  totalPrograms: number
  totalSales: number
  totalCommissions: number
  pendingPayouts: number
  recentActivity: Array<Sale | Payout>
}
