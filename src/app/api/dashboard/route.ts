import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

/**
 * GET /api/dashboard
 * Fetch dashboard data for the authenticated affiliate
 */
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient() as any

    // Create Supabase client with cookie handling for edge runtime
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    // Check if user is admin
    if (profile.role === 'admin') {
      return NextResponse.json({ isAdmin: true, profile })
    }

    // Get affiliate record
    const { data: affiliate, error: affiliateError } = await admin
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (affiliateError || !affiliate) {
      // Return basic profile data even without affiliate record
      return NextResponse.json({
        profile,
        affiliate: null,
        stats: {
          totalEarnings: 0,
          pendingCommissions: 0,
          totalClicks: 0,
          l1Referrals: 0,
          l2Referrals: 0,
          l3Referrals: 0,
          recentSales: [],
          weeklySales: [],
        },
      })
    }

    // Get total earnings (paid commissions)
    const { data: paidCommissions } = await admin
      .from('commissions')
      .select('amount')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'paid')

    const totalEarnings = paidCommissions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0

    // Get pending commissions
    const { data: pendingCommissions } = await admin
      .from('commissions')
      .select('amount')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'pending')

    const pendingCommissionsTotal = pendingCommissions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0

    // Get total clicks
    const { count: totalClicks } = await admin
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id)

    // Get Level 1 referrals (direct)
    const { count: l1Referrals } = await admin
      .from('affiliates')
      .select('*', { count: 'exact', head: true })
      .eq('parent_affiliate_id', affiliate.id)

    // Get Level 2 referrals
    const { count: l2Referrals } = await admin
      .from('affiliates')
      .select('*', { count: 'exact', head: true })
      .eq('grandparent_affiliate_id', affiliate.id)

    // Get Level 3 referrals
    const { data: l2Affiliates } = await admin
      .from('affiliates')
      .select('id')
      .eq('grandparent_affiliate_id', affiliate.id)

    let l3Referrals = 0
    if (l2Affiliates && l2Affiliates.length > 0) {
      const l2Ids = l2Affiliates.map((a: any) => a.id)
      const { count } = await admin
        .from('affiliates')
        .select('*', { count: 'exact', head: true })
        .in('parent_affiliate_id', l2Ids)
      l3Referrals = count || 0
    }

    // Get recent sales (last 10)
    const { data: recentSales } = await admin
      .from('sales')
      .select('id, amount, status, created_at, commission_l1, customer_email')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get weekly sales data (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: weeklySalesData } = await admin
      .from('sales')
      .select('amount, created_at')
      .eq('affiliate_id', affiliate.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group sales by day
    const weeklySales: { date: string; total: number; count: number }[] = []
    const salesByDay: Record<string, { total: number; count: number }> = {}

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      salesByDay[dateStr] = { total: 0, count: 0 }
    }

    weeklySalesData?.forEach((sale: any) => {
      const dateStr = sale.created_at.split('T')[0]
      if (salesByDay[dateStr]) {
        salesByDay[dateStr].total += Number(sale.amount)
        salesByDay[dateStr].count += 1
      }
    })

    Object.entries(salesByDay).forEach(([date, data]) => {
      weeklySales.push({
        date,
        total: data.total,
        count: data.count,
      })
    })

    return NextResponse.json({
      profile,
      affiliate,
      stats: {
        totalEarnings,
        pendingCommissions: pendingCommissionsTotal,
        totalClicks: totalClicks || 0,
        l1Referrals: l1Referrals || 0,
        l2Referrals: l2Referrals || 0,
        l3Referrals,
        recentSales: recentSales || [],
        weeklySales,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
