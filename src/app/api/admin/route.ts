import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient() as any
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get profile
    const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    // Check role - must be admin or super_admin
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // If super_admin, redirect to super-admin page
    if (profile.role === 'super_admin') {
      return NextResponse.json({ redirect: '/super-admin' })
    }

    // Get affiliates for this admin (admin_id = current user)
    let affiliatesQuery = admin
      .from('affiliates')
      .select(`
        id,
        user_id,
        status,
        total_earnings,
        total_referrals,
        profile:profiles!affiliates_user_id_fkey(id, email, full_name, paypal_email, affiliate_code, created_at)
      `)
      .eq('user_id', user.id)

    const { data: affiliateRecords } = await affiliatesQuery

    // Get affiliate IDs
    const affiliateIds = affiliateRecords?.map((a: any) => a.id) || []

    // Get total sales for this admin's affiliates
    let totalSales = 0
    let totalRevenue = 0
    let pendingPayouts = 0

    if (affiliateIds.length > 0) {
      const { data: sales } = await admin
        .from('sales')
        .select('amount')
        .in('affiliate_id', affiliateIds)

      totalSales = sales?.length || 0
      totalRevenue = sales?.reduce((sum: number, s: any) => sum + Number(s.amount), 0) || 0

      // Get pending commissions
      const { data: commissions } = await admin
        .from('commissions')
        .select('amount')
        .in('affiliate_id', affiliateIds)
        .eq('status', 'pending')

      pendingPayouts = commissions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0
    }

    // Get paid payouts total
    const { data: paidPayouts } = await admin
      .from('payouts')
      .select('amount')
      .eq('admin_id', user.id)
      .eq('status', 'paid')

    const paidPayoutsTotal = paidPayouts?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0

    // Get pending commissions with affiliate details for payouts
    const { data: pendingCommissions } = await admin
      .from('commissions')
      .select(`
        affiliate_id,
        amount,
        affiliates(
          profiles(id, full_name, email, paypal_email)
        )
      `)
      .in('affiliate_id', affiliateIds)
      .eq('status', 'pending')

    // Aggregate by affiliate
    const aggregatedPayouts: { [key: string]: { affiliate_id: string; amount: number; profile: any } } = {}
    pendingCommissions?.forEach((c: any) => {
      const affId = c.affiliate_id
      if (!aggregatedPayouts[affId]) {
        aggregatedPayouts[affId] = {
          affiliate_id: affId,
          amount: 0,
          profile: c.affiliates?.profiles || null,
        }
      }
      aggregatedPayouts[affId].amount += Number(c.amount)
    })

    // Get recent sales
    const { data: recentSales } = affiliateIds.length > 0
      ? await admin
          .from('sales')
          .select('id, amount, status, created_at, commission_l1, customer_email')
          .in('affiliate_id', affiliateIds)
          .order('created_at', { ascending: false })
          .limit(20)
      : { data: [] }

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        paypal_email: profile.paypal_email,
        affiliate_code: profile.affiliate_code,
        subdomain: profile.subdomain,
      },
      stats: {
        totalAffiliates: affiliateRecords?.length || 0,
        totalSales,
        totalRevenue,
        pendingPayouts,
        paidPayouts: paidPayoutsTotal,
      },
      affiliates: affiliateRecords || [],
      recentSales: recentSales || [],
      pendingCommissions: Object.values(aggregatedPayouts),
    })
  } catch (error) {
    console.error('Admin error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
