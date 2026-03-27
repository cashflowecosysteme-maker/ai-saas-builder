import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/referrals - Get user's referrals
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's affiliate info
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (affiliateError && affiliateError.code !== 'PGRST116') {
      throw affiliateError
    }

    // Get referrals (level 1)
    const { data: level1Referrals, error: referralsError } = await supabase
      .from('affiliates')
      .select(`
        id,
        level,
        total_earnings,
        total_referrals,
        created_at,
        users!affiliates_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq('parent_id', affiliate?.id || '')

    if (referralsError) {
      throw referralsError
    }

    // Get level 2 referrals (referrals of referrals)
    const level1Ids = level1Referrals?.map(r => r.id) || []
    const { data: level2Referrals } = await supabase
      .from('affiliates')
      .select(`
        id,
        level,
        total_earnings,
        created_at,
        users!affiliates_user_id_fkey (
          email,
          full_name
        )
      `)
      .in('parent_id', level1Ids)

    // Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('affiliate_id', affiliate?.id || '')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      affiliate,
      referrals: {
        level1: level1Referrals || [],
        level2: level2Referrals || [],
        level3: [], // Would need additional query for level 3
      },
      transactions: transactions || [],
    })
  } catch (error: any) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}

// POST /api/referrals - Track a referral click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, visitorId } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find affiliate by code
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // Track the click (could store in a clicks table)
    // For now, we'll just return success
    // In production, you'd want to track:
    // - IP address
    // - User agent
    // - Visitor ID
    // - Timestamp
    // - Referrer URL

    return NextResponse.json({ 
      success: true,
      affiliateId: user.id,
    })
  } catch (error: any) {
    console.error('Error tracking referral:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to track referral' },
      { status: 500 }
    )
  }
}
