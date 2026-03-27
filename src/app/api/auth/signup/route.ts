import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

/**
 * Generate a unique affiliate code
 */
function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * POST /api/auth/signup
 * Creates profile and affiliate record for a new user
 */
export async function POST(request: Request) {
  try {
    const { email, password, fullName, referralCode, userId } = await request.json()

    // Validate input
    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email et nom complet sont requis' },
        { status: 400 }
      )
    }

    const admin = createAdminClient() as any
    const targetUserId = userId

    // Check if profile already exists
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, affiliate_code')
      .eq('id', targetUserId)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        user: {
          id: targetUserId,
          email,
          full_name: fullName,
          affiliate_code: existingProfile.affiliate_code,
        },
      })
    }

    // Find parent by referral code if provided
    let parentId: string | null = null
    let parentAffiliateId: string | null = null
    let grandparentAffiliateId: string | null = null

    if (referralCode) {
      const { data: parentProfile } = await admin
        .from('profiles')
        .select('id, affiliate_code')
        .eq('affiliate_code', referralCode.toUpperCase())
        .single()

      if (parentProfile) {
        parentId = parentProfile.id

        // Get the parent's affiliate record to find grandparent
        const { data: parentAffiliate } = await admin
          .from('affiliates')
          .select('id, parent_affiliate_id')
          .eq('user_id', parentProfile.id)
          .single()

        if (parentAffiliate) {
          parentAffiliateId = parentAffiliate.id
          grandparentAffiliateId = parentAffiliate.parent_affiliate_id
        }
      }
    }

    // Generate unique affiliate code
    let affiliateCode = generateAffiliateCode()
    let codeExists = true
    let attempts = 0

    while (codeExists && attempts < 10) {
      const { data: existingCode } = await admin
        .from('profiles')
        .select('affiliate_code')
        .eq('affiliate_code', affiliateCode)
        .single()

      if (!existingCode) {
        codeExists = false
      } else {
        affiliateCode = generateAffiliateCode()
        attempts++
      }
    }

    // Get the default program
    const { data: program } = await admin
      .from('programs')
      .select('id')
      .eq('is_active', true)
      .single()

    // Create profile
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: targetUserId,
        email,
        full_name: fullName,
        role: 'affiliate',
        affiliate_code: affiliateCode,
        parent_id: parentId,
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil: ' + profileError.message },
        { status: 500 }
      )
    }

    // Create affiliate record if program exists
    if (program) {
      await admin
        .from('affiliates')
        .insert({
          program_id: program.id,
          user_id: targetUserId,
          affiliate_link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://affiliationpro.publication-web.com'}/r/${affiliateCode}`,
          parent_affiliate_id: parentAffiliateId,
          grandparent_affiliate_id: grandparentAffiliateId,
          status: 'active',
        })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: targetUserId,
        email,
        full_name: fullName,
        affiliate_code: affiliateCode,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
