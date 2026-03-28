import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName, referralCode, userId } = await request.json()

    if (!email || !fullName || !password) {
      return NextResponse.json({ error: 'Email, nom complet et mot de passe sont requis' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing env:', { url: !!supabaseUrl, key: !!serviceRoleKey })
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let targetUserId = userId || null

    // Step 1: Create auth user if userId not provided
    if (!targetUserId) {
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email verification for testing
        user_metadata: { full_name: fullName },
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        // Check if user already exists
        if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
          return NextResponse.json({ error: 'Cet email est déjà utilisé. Connecte-toi plutôt.' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Erreur création compte: ' + authError.message }, { status: 500 })
      }

      targetUserId = authData.user.id
    }

    // Step 2: Check if profile already exists (created by trigger on auth.users)
    let existingProfile = null
    try {
      const result = await admin
        .from('profiles')
        .select('id, affiliate_code, parent_id')
        .eq('id', targetUserId)
        .single()
      existingProfile = result.data
    } catch (e) {
      // Table might not exist yet or other issue
      console.warn('Profile check error:', e)
    }

    // Step 3: Find parent by referral code
    let parentId: string | null = null
    let parentAffiliateId: string | null = null
    let grandparentAffiliateId: string | null = null

    if (referralCode) {
      try {
        const { data: parentProfile } = await admin
          .from('profiles')
          .select('id, affiliate_code, admin_id')
          .eq('affiliate_code', referralCode.toUpperCase())
          .single()

        if (parentProfile) {
          parentId = parentProfile.id

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
      } catch (e) {
        console.warn('Referral code lookup error:', e)
      }
    }

    // Step 4: Generate unique affiliate code
    let affiliateCode = existingProfile?.affiliate_code || generateAffiliateCode()
    
    if (!existingProfile?.affiliate_code) {
      let codeExists = true
      let attempts = 0
      while (codeExists && attempts < 10) {
        try {
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
        } catch {
          codeExists = false
        }
      }
    }

    // Step 5: Get active program
    let program = null
    try {
      const result = await admin
        .from('programs')
        .select('id')
        .eq('is_active', true)
        .single()
      program = result.data
    } catch (e) {
      console.warn('Program lookup error:', e)
    }

    // Step 6: Create or update profile
    if (existingProfile) {
      // Profile already exists (created by trigger) - UPDATE it with additional fields
      const updateData: Record<string, any> = {
        email,
        full_name: fullName,
        affiliate_code: affiliateCode,
      }
      if (parentId && !existingProfile.parent_id) {
        updateData.parent_id = parentId
      }

      const { error: updateError } = await admin
        .from('profiles')
        .update(updateData)
        .eq('id', targetUserId)

      if (updateError) {
        console.error('Profile update error:', updateError)
      }
    } else {
      // Profile doesn't exist - CREATE it
      const profileData: Record<string, any> = {
        id: targetUserId,
        email,
        full_name: fullName,
        role: 'affiliate',
        affiliate_code: affiliateCode,
        parent_id: parentId,
      }

      const { error: profileError } = await admin
        .from('profiles')
        .insert(profileData)

      if (profileError) {
        console.error('Profile insert error:', profileError)
        // If insert fails (e.g. column doesn't exist), try without parent_id
        if (profileError.message?.includes('column') || profileError.message?.includes('relation')) {
          const minimalData: Record<string, any> = {
            id: targetUserId,
            email,
            full_name: fullName,
            role: 'affiliate',
            affiliate_code: affiliateCode,
          }
          const retry = await admin.from('profiles').insert(minimalData)
          if (retry.error) {
            console.error('Profile retry error:', retry.error)
            return NextResponse.json({ error: 'Erreur profil: ' + retry.error.message }, { status: 500 })
          }
        } else {
          return NextResponse.json({ error: 'Erreur profil: ' + profileError.message }, { status: 500 })
        }
      }

      // Try to set admin_id separately (column may not exist from migration)
      try {
        const adminId = parentId ? await getAdminId(admin, parentId) : null
        if (adminId) {
          await admin.from('profiles').update({ admin_id: adminId }).eq('id', targetUserId)
        }
      } catch (e) {
        // admin_id column might not exist, skip it
        console.log('admin_id set skipped:', e)
      }
    }

    // Step 7: Create affiliate record if program exists
    if (program) {
      try {
        const { data: existingAffiliate } = await admin
          .from('affiliates')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('program_id', program.id)
          .single()

        if (!existingAffiliate) {
          const { error: affError } = await admin.from('affiliates').insert({
            program_id: program.id,
            user_id: targetUserId,
            affiliate_link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://affiliationpro.publication-web.com'}/r/${affiliateCode}`,
            parent_affiliate_id: parentAffiliateId,
            grandparent_affiliate_id: grandparentAffiliateId,
            status: 'active',
          })
          if (affError) {
            console.error('Affiliate record error:', affError)
          }
        }
      } catch (e) {
        console.warn('Affiliate creation error:', e)
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: targetUserId, email, full_name: fullName, affiliate_code: affiliateCode },
    })
  } catch (error: any) {
    console.error('Signup error:', error?.message || error)
    return NextResponse.json({ error: 'Erreur serveur: ' + (error?.message || 'Veuillez réessayer.') }, { status: 500 })
  }
}

// Helper: get the admin_id for a profile (walk up the parent chain)
async function getAdminId(admin: any, profileId: string): Promise<string | null> {
  let currentId = profileId
  for (let i = 0; i < 5; i++) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, role, parent_id, admin_id')
      .eq('id', currentId)
      .single()

    if (!profile) return null
    if (profile.role === 'admin') return profile.id
    if (profile.admin_id) return profile.admin_id
    if (!profile.parent_id) return null
    currentId = profile.parent_id
  }
  return null
}
