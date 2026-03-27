import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getUserByAffiliateCode, trackClick } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

/**
 * GET /api/referrals
 * Get user's referrals (L1, L2, L3)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const admin = createAdminClient() as any

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get user's affiliate record
    const { data: affiliate, error: affiliateError } = await admin
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'Affilié non trouvé' }, { status: 404 })
    }

    // Get Level 1 referrals (direct)
    const { data: l1Referrals } = await admin
      .from('affiliates')
      .select(`
        id,
        total_earnings,
        total_referrals,
        created_at,
        profile:profiles!affiliates_user_id_fkey(email, full_name)
      `)
      .eq('parent_affiliate_id', affiliate.id)

    // Get Level 2 referrals
    const { data: l2Referrals } = await admin
      .from('affiliates')
      .select(`
        id,
        total_earnings,
        created_at,
        profile:profiles!affiliates_user_id_fkey(email, full_name)
      `)
      .eq('grandparent_affiliate_id', affiliate.id)

    // Get Level 3 referrals
    const l2Ids = l2Referrals?.map((r: any) => r.id) || []
    let l3Referrals = []
    if (l2Ids.length > 0) {
      const { data } = await admin
        .from('affiliates')
        .select(`
          id,
          total_earnings,
          created_at,
          profile:profiles!affiliates_user_id_fkey(email, full_name)
        `)
        .in('parent_affiliate_id', l2Ids)
      l3Referrals = data || []
    }

    return NextResponse.json({
      affiliate,
      referrals: {
        level1: l1Referrals || [],
        level2: l2Referrals || [],
        level3: l3Referrals,
      },
    })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/referrals
 * Track a referral link click
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Code de parrainage requis' }, { status: 400 })
    }

    // Find the user by affiliate code
    const { user, error: userError } = await getUserByAffiliateCode(code.toUpperCase())

    if (userError || !user) {
      return NextResponse.json({ error: 'Code de parrainage invalide' }, { status: 404 })
    }

    const admin = createAdminClient() as any

    // Get the affiliate record for this user
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!affiliate) {
      return NextResponse.json({ error: 'Affilié non actif' }, { status: 404 })
    }

    // Track the click
    const headers = request.headers
    await trackClick({
      affiliateId: affiliate.id,
      ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
      userAgent: headers.get('user-agent') || undefined,
      referrerUrl: headers.get('referer') || undefined,
      landingUrl: headers.get('x-url') || undefined,
    })

    return NextResponse.json({
      success: true,
      message: 'Click tracked successfully',
      referrer: {
        name: user.full_name,
        code: user.affiliate_code,
      },
    })
  } catch (error) {
    console.error('Error tracking referral:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
