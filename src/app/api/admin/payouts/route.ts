import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient() as any

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { affiliateId, amount } = await request.json()

    if (!affiliateId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    // Get affiliate's paypal email
    const { data: affiliateProfile } = await admin
      .from('affiliates')
      .select('id, user_id, profiles!affiliates_user_id_fkey(paypal_email, email)')
      .eq('id', affiliateId)
      .single()

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affilié non trouvé' }, { status: 404 })
    }

    const paypalEmail = (affiliateProfile.profiles as any)?.paypal_email
    if (!paypalEmail) {
      return NextResponse.json({ error: 'L\'affilié n\'a pas configuré son PayPal' }, { status: 400 })
    }

    // Create payout record
    const { error: payoutError } = await admin.from('payouts').insert({
      admin_id: user.id,
      affiliate_id: affiliateId,
      amount,
      paypal_email: paypalEmail,
      status: 'paid',
      paid_at: new Date().toISOString(),
    })

    if (payoutError) {
      return NextResponse.json({ error: payoutError.message }, { status: 500 })
    }

    // Mark commissions as paid
    const { error: commissionError } = await admin
      .from('commissions')
      .update({ status: 'paid' })
      .eq('affiliate_id', affiliateId)
      .eq('status', 'pending')

    if (commissionError) {
      console.error('Commission update error:', commissionError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
