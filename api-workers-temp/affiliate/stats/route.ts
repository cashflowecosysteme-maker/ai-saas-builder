import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Affiliate Stats API
 * GET /api/affiliate/stats
 */

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = createAdminClient() as any
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the user's affiliate record(s)
    const { data: affiliates, error: affiliateError } = await admin
      .from('affiliates')
      .select('id, affiliate_link, total_earnings, total_referrals, status, created_at')
      .eq('user_id', user.id)
    
    if (affiliateError) {
      console.error('[Stats API] Error fetching affiliates:', affiliateError)
      return NextResponse.json({ error: 'Failed to fetch affiliate data' }, { status: 500 })
    }
    
    // If no affiliate record, return empty stats
    if (!affiliates || affiliates.length === 0) {
      return NextResponse.json({
        has_affiliate_account: false,
        stats: null,
      })
    }
    
    // Get stats for each affiliate record
    const affiliateStats = await Promise.all(
      affiliates.map(async (affiliate: any) => {
        const affiliateId = affiliate.id
        
        // Get pending commissions
        const { data: pendingCommissions } = await admin
          .from('commissions')
          .select('amount')
          .eq('affiliate_id', affiliateId)
          .eq('status', 'pending')
        
        const pendingTotal = pendingCommissions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0
        
        // Get recent sales (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: recentSales } = await admin
          .from('sales')
          .select('id, amount, status, customer_email, created_at')
          .eq('affiliate_id', affiliateId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10)
        
        // Get click stats
        const { count: totalClicks } = await admin
          .from('clicks')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', affiliateId)
        
        // Get clicks in last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { count: clicksLast7Days } = await admin
          .from('clicks')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', affiliateId)
          .gte('created_at', sevenDaysAgo.toISOString())
        
        // Get referral counts by level
        const { count: l1Referrals } = await admin
          .from('affiliates')
          .select('*', { count: 'exact', head: true })
          .eq('parent_affiliate_id', affiliateId)
        
        const { count: l2Referrals } = await admin
          .from('affiliates')
          .select('*', { count: 'exact', head: true })
          .eq('grandparent_affiliate_id', affiliateId)
        
        return {
          affiliate_id: affiliateId,
          affiliate_link: affiliate.affiliate_link,
          status: affiliate.status,
          created_at: affiliate.created_at,
          total_earnings: Number(affiliate.total_earnings) || 0,
          pending_commissions: pendingTotal,
          total_referrals: affiliate.total_referrals || 0,
          referrals_by_level: {
            l1: l1Referrals || 0,
            l2: l2Referrals || 0,
            l3: 0,
          },
          click_stats: {
            total: totalClicks || 0,
            last_7_days: clicksLast7Days || 0,
          },
          recent_sales: recentSales || [],
        }
      })
    )
    
    // Calculate totals across all programs
    const totals = affiliateStats.reduce(
      (acc: any, stat: any) => {
        acc.total_earnings += stat.total_earnings
        acc.pending_commissions += stat.pending_commissions
        acc.total_referrals += stat.total_referrals
        acc.total_clicks += stat.click_stats.total
        return acc
      },
      {
        total_earnings: 0,
        pending_commissions: 0,
        total_referrals: 0,
        total_clicks: 0,
      }
    )
    
    return NextResponse.json({
      has_affiliate_account: true,
      totals,
      programs: affiliateStats,
    })
    
  } catch (error) {
    console.error('[Stats API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
