import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient() as any
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'users'

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

    // Verify super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    let csv = ''

    if (type === 'users') {
      const { data: users } = await admin
        .from('profiles')
        .select('email, full_name, role, affiliate_code, paypal_email, subdomain, created_at')
        .order('created_at', { ascending: false })

      csv = 'Email,Nom,Rôle,Code Affiliation,PayPal,Sous-domaine,Date inscription\n'
      users?.forEach((u: any) => {
        csv += `"${u.email}","${u.full_name || ''}","${u.role}","${u.affiliate_code}","${u.paypal_email || ''}","${u.subdomain || ''}","${u.created_at}"\n`
      })
    } else if (type === 'sales') {
      const { data: sales } = await admin
        .from('sales')
        .select('amount, status, commission_l1, commission_l2, commission_l3, customer_email, created_at, affiliates(profiles(email, full_name))')
        .order('created_at', { ascending: false })

      csv = 'Montant,Statut,Commission L1,Commission L2,Commission L3,Client Email,Affilié,Date\n'
      sales?.forEach((s: any) => {
        const affiliateEmail = s.affiliates?.profiles?.email || ''
        const affiliateName = s.affiliates?.profiles?.full_name || ''
        csv += `"${s.amount}","${s.status}","${s.commission_l1}","${s.commission_l2}","${s.commission_l3}","${s.customer_email || ''}","${affiliateName} (${affiliateEmail})","${s.created_at}"\n`
      })
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
