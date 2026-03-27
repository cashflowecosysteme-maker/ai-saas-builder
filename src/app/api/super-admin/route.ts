import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient() as any
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Create Supabase client with cookie handling
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

    // Get admins
    let adminsQuery = admin
      .from('profiles')
      .select('id, email, full_name, affiliate_code, role, paypal_email, subdomain, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (search) {
      adminsQuery = adminsQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,affiliate_code.ilike.%${search}%`)
    }

    const { data: admins } = await adminsQuery.limit(50)

    // Get affiliates
    let affiliatesQuery = admin
      .from('profiles')
      .select('id, email, full_name, affiliate_code, role, paypal_email, subdomain, created_at, admin_id, admin:profiles!profiles_admin_id_fkey(full_name, email)')
      .eq('role', 'affiliate')
      .order('created_at', { ascending: false })

    if (search) {
      affiliatesQuery = affiliatesQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data: affiliates } = await affiliatesQuery.limit(100)

    // Get recent sales
    const { data: recentSales } = await admin
      .from('sales')
      .select('id, amount, status, created_at, commission_l1, customer_email, affiliates(id, user_id, profile:profiles(full_name, email, role))')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get messages
    const { data: messages } = await admin
      .from('messages')
      .select('id, subject, content, sender_id, recipient_id, is_broadcast, created_at, read_at, sender:profiles!messages_sender_id_fkey(full_name, email), recipient:profiles!messages_recipient_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50)

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
      affiliates: affiliates || [],
      recentSales: recentSales || [],
      messages: messages || [],
    })
  } catch (error) {
    console.error('Super admin error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
