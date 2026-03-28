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

    // Check if user is super_admin or admin - redirect accordingly
    if (profile.role === 'super_admin') {
      return NextResponse.json({ isSuperAdmin: true, profile })
    }

    if (profile.role === 'admin') {
      return NextResponse.json({ isAdmin: true, profile })
    }

    // Get affiliate record with program info (commissions rates)
    const { data: affiliate, error: affiliateError } = await admin
      .from('affiliates')
      .select(`
        *,
        programs (
          name,
          commission_l1,
          commission_l2,
          commission_l3
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (affiliateError || !affiliate) {
      // Return basic profile data even without affiliate record
      return NextResponse.json({
        profile,
        affiliate: null,
        team: [],
        messages: [],
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

    // --- 1. FETCH TEAM MEMBERS (L1, L2, L3) ---
    const team: any[] = []

    // Fetch Level 1 (Direct referrals)
    const { data: l1Data } = await admin
      .from('affiliates')
      .select('id, created_at, profiles(full_name, email)')
      .eq('parent_affiliate_id', affiliate.id)

    const l1Ids: string[] = []
    
    if (l1Data) {
      l1Data.forEach((m: any) => {
        l1Ids.push(m.id)
        team.push({
          id: m.id,
          full_name: m.profiles?.full_name || 'Nouveau',
          email: m.profiles?.email || 'Non renseigné',
          level: 1,
          created_at: m.created_at
        })
      })
    }

    // Fetch Level 2
    const { data: l2Data } = await admin
      .from('affiliates')
      .select('id, created_at, profiles(full_name, email)')
      .eq('grandparent_affiliate_id', affiliate.id)

    const l2Ids: string[] = []

    if (l2Data) {
      l2Data.forEach((m: any) => {
        l2Ids.push(m.id)
        team.push({
          id: m.id,
          full_name: m.profiles?.full_name || 'Nouveau',
          email: m.profiles?.email || 'Non renseigné',
          level: 2,
          created_at: m.created_at
        })
      })
    }

    // Fetch Level 3 (Children of L2)
    if (l2Ids.length > 0) {
      const { data: l3Data } = await admin
        .from('affiliates')
        .select('id, created_at, profiles(full_name, email)')
        .in('parent_affiliate_id', l2Ids)

      if (l3Data) {
        l3Data.forEach((m: any) => {
          team.push({
            id: m.id,
            full_name: m.profiles?.full_name || 'Nouveau',
            email: m.profiles?.email || 'Non renseigné',
            level: 3,
            created_at: m.created_at
          })
        })
      }
    }

    // --- 2. FETCH MESSAGES FROM SUPER ADMIN ---
    // On cherche les messages adressés à tout le monde (broadcast) ou à cet utilisateur spécifiquement
    const { data: messages } = await admin
      .from('messages')
      .select('id, subject, content, created_at, read')
      .or(`user_id.eq.${user.id},is_broadcast.eq.true`)
      .order('created_at', { ascending: false })
      .limit(5)

    // --- 3. CALCULATE STATS ---
    
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

    // Get counts for referrals
    const l1Count = l1Data?.length || 0
    const l2Count = l2Data?.length || 0
    
    let l3Count = 0
    if (l2Ids.length > 0) {
        const { count } = await admin
          .from('affiliates')
          .select('*', { count: 'exact', head: true })
          .in('parent_affiliate_id', l2Ids)
        l3Count = count || 0
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
      affiliate: {
        ...affiliate,
        // On aide le frontend en aplatissant les données du programme
        program: affiliate.programs || affiliate.program 
      },
      team, // Nouvelle donnée
      messages: messages || [], // Nouvelle donnée
      stats: {
        totalEarnings,
        pendingCommissions: pendingCommissionsTotal,
        totalClicks: totalClicks || 0,
        l1Referrals: l1Count,
        l2Referrals: l2Count,
        l3Referrals: l3Count,
        recentSales: recentSales || [],
        weeklySales,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
