import { createClient } from '@supabase/supabase-js'

// Simple type to avoid database type issues
type AnyClient = any

/**
 * Supabase Admin Client
 * Uses service role key - SERVER SIDE ONLY!
 */
export function createAdminClient(): AnyClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Helper function to get a user by their affiliate code
 */
export async function getUserByAffiliateCode(code: string) {
  const admin = createAdminClient()
  
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('affiliate_code', code)
    .single()

  if (error) {
    return { user: null, error }
  }

  return { user: data, error: null }
}

/**
 * Helper function to get an affiliate by their link
 */
export async function getAffiliateByLink(link: string) {
  const admin = createAdminClient()
  
  const { data, error } = await admin
    .from('affiliates')
    .select(`
      *,
      profile:profiles!affiliates_user_id_fkey(*),
      program:programs(*)
    `)
    .eq('affiliate_link', link)
    .eq('status', 'active')
    .single()

  if (error) {
    return { affiliate: null, error }
  }

  return { affiliate: data, error: null }
}

/**
 * Create a sale and distribute commissions across 3 levels
 */
export async function createSaleWithCommissions(params: {
  affiliateId: string
  programId: string
  externalOrderId: string
  amount: number
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, unknown>
}) {
  const admin = createAdminClient()
  
  // Get program commission rates
  const { data: program } = await admin
    .from('programs')
    .select('commission_l1, commission_l2, commission_l3')
    .eq('id', params.programId)
    .single()

  if (!program) {
    return { sale: null, commissions: null, error: new Error('Program not found') }
  }

  // Get affiliate with parent info
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, parent_affiliate_id, grandparent_affiliate_id')
    .eq('id', params.affiliateId)
    .single()

  if (!affiliate) {
    return { sale: null, commissions: null, error: new Error('Affiliate not found') }
  }

  // Calculate commissions
  const commissionL1 = (params.amount * program.commission_l1) / 100
  const commissionL2 = (params.amount * program.commission_l2) / 100
  const commissionL3 = (params.amount * program.commission_l3) / 100

  // Create the sale
  const { data: sale, error: saleError } = await admin
    .from('sales')
    .insert({
      affiliate_id: params.affiliateId,
      program_id: params.programId,
      external_order_id: params.externalOrderId,
      amount: params.amount,
      commission_l1: commissionL1,
      commission_l2: commissionL2,
      commission_l3: commissionL3,
      customer_email: params.customerEmail,
      customer_name: params.customerName,
      metadata: params.metadata || {},
      status: 'pending',
    })
    .select()
    .single()

  if (saleError || !sale) {
    return { sale: null, commissions: null, error: saleError }
  }

  // Create commission records
  const commissions = []

  commissions.push({
    sale_id: sale.id,
    affiliate_id: params.affiliateId,
    level: 1,
    amount: commissionL1,
    status: 'pending',
  })

  if (affiliate.parent_affiliate_id) {
    commissions.push({
      sale_id: sale.id,
      affiliate_id: affiliate.parent_affiliate_id,
      level: 2,
      amount: commissionL2,
      status: 'pending',
    })
  }

  if (affiliate.grandparent_affiliate_id) {
    commissions.push({
      sale_id: sale.id,
      affiliate_id: affiliate.grandparent_affiliate_id,
      level: 3,
      amount: commissionL3,
      status: 'pending',
    })
  }

  const { data: insertedCommissions, error: commissionsError } = await admin
    .from('commissions')
    .insert(commissions)
    .select()

  if (commissionsError) {
    return { sale, commissions: null, error: commissionsError }
  }

  return { sale, commissions: insertedCommissions, error: null }
}

/**
 * Track a click on an affiliate link
 */
export async function trackClick(params: {
  affiliateId: string
  visitorId?: string
  ipAddress?: string
  userAgent?: string
  referrerUrl?: string
  landingUrl?: string
}) {
  const admin = createAdminClient()
  
  const { data, error } = await admin
    .from('clicks')
    .insert({
      affiliate_id: params.affiliateId,
      visitor_id: params.visitorId,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      referrer_url: params.referrerUrl,
      landing_url: params.landingUrl,
    })
    .select()
    .single()

  return { click: data, error }
}

/**
 * Get dashboard stats for an affiliate
 */
export async function getAffiliateStats(affiliateId: string) {
  const admin = createAdminClient()
  
  const { data: affiliate } = await admin
    .from('affiliates')
    .select(`
      *,
      profile:profiles(*),
      program:programs(*)
    `)
    .eq('id', affiliateId)
    .single()

  if (!affiliate) {
    return { stats: null, error: new Error('Affiliate not found') }
  }

  const { data: pendingCommissions } = await admin
    .from('commissions')
    .select('amount')
    .eq('affiliate_id', affiliateId)
    .eq('status', 'pending')

  const pendingTotal = pendingCommissions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0

  const { count: clickCount } = await admin
    .from('clicks')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)

  const { data: recentSales } = await admin
    .from('sales')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .limit(10)

  const { count: downlineCount } = await admin
    .from('affiliates')
    .select('*', { count: 'exact', head: true })
    .eq('parent_affiliate_id', affiliateId)

  return {
    stats: {
      affiliate,
      pendingCommissions: pendingTotal,
      totalClicks: clickCount || 0,
      recentSales: recentSales || [],
      downlineCount: downlineCount || 0,
    },
    error: null,
  }
}
