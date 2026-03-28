import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient() as any
    const { searchParams } = new URL(request.url)
    const rawSearch = searchParams.get('search') || ''
    // Sanitize search input to prevent SQL injection
    const search = rawSearch.replace(/[%'\\]/g, '')

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

    // Check if super admin
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Get global stats
    const { count: totalUsers } = await admin.from('profiles').select('*', { count: 'exact', head: true })
    const { count: totalAdmins } = await admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
    const { count: totalAffiliates } = await admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'affiliate')
    const { count: totalSales } = await admin.from('sales').select('*', { count: 'exact', head: true })
    const { data: revenueData } = await admin.from('sales').select('amount')
    const totalRevenue = revenueData?.reduce((sum: number, s: any) => sum + Number(s.amount), 0) || 0
    const { data: pendingData } = await admin.from('commissions').select('amount').eq('status', 'pending')
    const pendingPayouts = pendingData?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0
    const { data: paidData } = await admin.from('payouts').select('amount').eq('status', 'paid')
    const totalPayouts = paidData?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0

    // Get all admins
    const adminsQuery = admin
      .from('profiles')
      .select('id, email, full_name, affiliate_code, role, paypal_email, subdomain, parent_id, webhook_secret, created_at')
      .eq('role', 'admin')
    if (search) {
      adminsQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    const { data: admins } = await adminsQuery.order('created_at', { ascending: false })

    // Build teams structure: Admin -> Level 2 (their affiliates) -> Level 3
    const teams = []
    
    for (const adminUser of (admins || [])) {
      // Get level 2 affiliates (parent_id = admin.id)
      const level2Query = admin
        .from('profiles')
        .select('id, email, full_name, affiliate_code, role, paypal_email, parent_id, created_at')
        .eq('parent_id', adminUser.id)
      if (search) {
        level2Query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      }
      const { data: level2 } = await level2Query

      // For each L2, get their L3 members
      const level2WithL3 = []
      for (const l2 of (level2 || [])) {
        const { data: level3 } = await admin
          .from('profiles')
          .select('id, email, full_name, affiliate_code, role, paypal_email, parent_id, created_at')
          .eq('parent_id', l2.id)

        level2WithL3.push({
          ...l2,
          level3: level3 || [],
        })
      }

      teams.push({
        admin: adminUser,
        level2: level2WithL3,
        level3Count: level2WithL3.reduce((sum: number, l2: any) => sum + (l2.level3?.length || 0), 0),
      })
    }

    // Get recent sales
    const { data: recentSales } = await admin
      .from('sales')
      .select('id, amount, status, created_at, commission_l1, customer_email, affiliates(id, user_id, profile:profiles(full_name, email, role))')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get messages
    const messagesQuery = admin
      .from('messages')
      .select('id, subject, content, sender_id, recipient_id, is_broadcast, created_at, read_at, sender:profiles!messages_sender_id_fkey(full_name, email), recipient:profiles!messages_recipient_id_fkey(full_name, email)')
    if (search) {
      messagesQuery.or(`subject.ilike.%${search}%,content.ilike.%${search}%`)
    }
    const { data: messages } = await messagesQuery.order('created_at', { ascending: false }).limit(50)

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalAdmins: totalAdmins || 0,
        totalAffiliates: totalAffiliates || 0,
        totalSales: totalSales || 0,
        totalRevenue,
        pendingPayouts,
        totalPayouts,
      },
      admins: admins || [],
      teams,
      recentSales: recentSales || [],
      messages: messages || [],
    })
  } catch (error) {
    console.error('Super admin error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
