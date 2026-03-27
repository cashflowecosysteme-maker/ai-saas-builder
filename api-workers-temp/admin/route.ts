import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin
 * Fetch admin dashboard data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const supabase = await createClient()
    const admin = createAdminClient() as any

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
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Get total affiliates count
    const { count: totalAffiliates } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'affiliate')

    // Get active affiliates this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newAffiliatesThisMonth } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'affiliate')
      .gte('created_at', startOfMonth.toISOString())

    // Get total sales this month
    const { data: monthlySales } = await admin
      .from('sales')
      .select('amount')
      .gte('created_at', startOfMonth.toISOString())

    const monthlySalesTotal = monthlySales?.reduce((sum: number, s: any) => sum + Number(s.amount), 0) || 0

    // Get pending commissions total
    const { data: pendingCommissions } = await admin
      .from('commissions')
      .select('amount')
      .eq('status', 'pending')

    const pendingCommissionsTotal = pendingCommissions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0

    // Get total sales ever
    const { count: totalSalesCount } = await admin
      .from('sales')
      .select('*', { count: 'exact', head: true })

    // Get total revenue
    const { data: allSales } = await admin
      .from('sales')
      .select('amount')

    const totalRevenue = allSales?.reduce((sum: number, s: any) => sum + Number(s.amount), 0) || 0

    // Get affiliates list with search
    let affiliatesResult
    if (search) {
      affiliatesResult = await admin
        .from('profiles')
        .select('id, email, full_name, affiliate_code, created_at')
        .eq('role', 'affiliate')
        .or(`email.ilike.%${search}%,full_name.ilike.%${search}%,affiliate_code.ilike.%${search}%`)
        .order('created_at', { ascending: false })
        .limit(50)
    } else {
      affiliatesResult = await admin
        .from('profiles')
        .select('id, email, full_name, affiliate_code, created_at')
        .eq('role', 'affiliate')
        .order('created_at', { ascending: false })
        .limit(50)
    }

    const affiliates = affiliatesResult.data

    // Get recent sales with affiliate info
    const { data: recentSales } = await admin
      .from('sales')
      .select('id, amount, status, created_at, commission_l1, customer_email')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get programs count
    const { count: totalPrograms } = await admin
      .from('programs')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      stats: {
        totalAffiliates: totalAffiliates || 0,
        newAffiliatesThisMonth: newAffiliatesThisMonth || 0,
        monthlySales: monthlySalesTotal,
        pendingCommissions: pendingCommissionsTotal,
        totalSalesCount: totalSalesCount || 0,
        totalRevenue,
        totalPrograms: totalPrograms || 0,
      },
      affiliates: affiliates || [],
      recentSales: recentSales || [],
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/admin
 * Export data as CSV
 */
export async function POST(request: Request) {
  try {
    const { type } = await request.json()

    const supabase = await createClient()
    const admin = createAdminClient() as any

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    if (type === 'affiliates') {
      const { data: affiliates } = await admin
        .from('profiles')
        .select('id, email, full_name, affiliate_code, created_at')
        .eq('role', 'affiliate')
        .order('created_at', { ascending: false })

      // Convert to CSV
      const headers = ['ID', 'Email', 'Nom', 'Code Affiliation', 'Date inscription']
      const rows = affiliates?.map((a: any) => [
        a.id,
        a.email,
        a.full_name || '',
        a.affiliate_code || '',
        a.created_at,
      ]) || []

      const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="affiliates.csv"',
        },
      })
    }

    if (type === 'sales') {
      const { data: sales } = await admin
        .from('sales')
        .select('id, amount, status, commission_l1, commission_l2, commission_l3, customer_email, created_at')
        .order('created_at', { ascending: false })

      const headers = ['ID', 'Montant', 'Commission L1', 'Commission L2', 'Commission L3', 'Client', 'Statut', 'Date']
      const rows = sales?.map((s: any) => [
        s.id,
        s.amount,
        s.commission_l1 || 0,
        s.commission_l2 || 0,
        s.commission_l3 || 0,
        s.customer_email || '',
        s.status,
        s.created_at,
      ]) || []

      const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="sales.csv"',
        },
      })
    }

    return NextResponse.json({ error: 'Type d\'export invalide' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'export' }, { status: 500 })
  }
}
