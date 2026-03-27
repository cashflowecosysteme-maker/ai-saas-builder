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
 * Creates a new user account with affiliate profile
 */
export async function POST(request: Request) {
  try {
    const { email, password, fullName, referralCode } = await request.json()

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, mot de passe et nom complet sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    const admin = createAdminClient() as any

    // Check if user already exists
    const { data: existingUser } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 400 }
      )
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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Erreur lors de la création du compte' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

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

    // Create or update profile (upsert in case trigger already created it)
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: 'affiliate',
        affiliate_code: affiliateCode,
        parent_id: parentId,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Try to clean up auth user
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil: ' + profileError.message },
        { status: 500 }
      )
    }

    // Create affiliate record if program exists
    if (program) {
      const { error: affiliateError } = await admin
        .from('affiliates')
        .insert({
          program_id: program.id,
          user_id: userId,
          affiliate_link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://affiliationpro.publication-web.com'}/r/${affiliateCode}`,
          parent_affiliate_id: parentAffiliateId,
          grandparent_affiliate_id: grandparentAffiliateId,
          status: 'active',
        })

      if (affiliateError) {
        console.error('Affiliate error:', affiliateError)
        // Non-critical error, continue
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
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
