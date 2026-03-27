export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          referral_code: string
          referred_by: string | null
          subscription_status: 'free' | 'active' | 'cancelled'
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          referral_code?: string
          referred_by?: string | null
          subscription_status?: 'free' | 'active' | 'cancelled'
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          referral_code?: string
          referred_by?: string | null
          subscription_status?: 'free' | 'active' | 'cancelled'
          stripe_customer_id?: string | null
        }
      }
      affiliates: {
        Row: {
          id: string
          user_id: string
          parent_id: string | null
          level: number
          commission_rate: number
          total_earnings: number
          total_referrals: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_id?: string | null
          level?: number
          commission_rate?: number
          total_earnings?: number
          total_referrals?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_id?: string | null
          level?: number
          commission_rate?: number
          total_earnings?: number
          total_referrals?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          affiliate_id: string
          amount: number
          commission: number
          status: 'pending' | 'paid' | 'cancelled'
          source: string
          metadata: Json | null
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          affiliate_id: string
          amount: number
          commission: number
          status?: 'pending' | 'paid' | 'cancelled'
          source: string
          metadata?: Json | null
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          affiliate_id?: string
          amount?: number
          commission?: number
          status?: 'pending' | 'paid' | 'cancelled'
          source?: string
          metadata?: Json | null
          created_at?: string
          paid_at?: string | null
        }
      }
      payouts: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          payment_method: string
          payment_details: Json | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          payment_method: string
          payment_details?: Json | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          payment_method?: string
          payment_details?: Json | null
          created_at?: string
          processed_at?: string | null
        }
      }
      sites: {
        Row: {
          id: string
          user_id: string
          name: string
          subdomain: string
          custom_domain: string | null
          config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          subdomain: string
          custom_domain?: string | null
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subdomain?: string
          custom_domain?: string | null
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
