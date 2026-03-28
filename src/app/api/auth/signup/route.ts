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
    const { email, fullName, referralCode, userId } = await request.json()

    if (!userId || !email || !fullName) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase env vars')
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if profile already exists (trigger may have created it)
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, affiliate_code, parent_id')
      .eq('id', userId)
      .maybeSingle()

    // Find parent by referral code
    let parentId: string | null = null
    let parentAffiliateId: string | null = null
    let grandparentAffiliateId: string | null = null

    if (referralCode) {
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('id, affiliate_code, admin_id')
        .eq('affiliate_code', referralCode.toUpperCase())
        .maybeSingle()

      if (parentProfile) {
        parentId = parentProfile.id
        const { data: parentAff } = await supabase
          .from('affiliates')
          .select('id, parent_affiliate_id')
          .eq('user_id', parentProfile.id)
          .maybeSingle()
        if (parentAff) {
          parentAffiliateId = parentAff.id
          grandparentAffiliateId = parentAff.parent_affiliate_id
        }
      }
    }

    // Generate unique affiliate code
    let affiliateCode = existingProfile?.affiliate_code || generateAffiliateCode()
    if (!existingProfile?.affiliate_code) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const { data: dup } = await supabase
          .from('profiles')
          .select('affiliate_code')
          .eq('affiliate_code', affiliateCode)
          .maybeSingle()
        if (!dup) break
        affiliateCode = generateAffiliateCode()
      }
    }

    // Create or update profile
    if (existingProfile) {
      // UPDATE existing profile (created by trigger)
      const updateData: Record<string, any> = {
        email,
        full_name: fullName,
        affiliate_code: affiliateCode,
      }
      if (parentId && !existingProfile.parent_id) {
        updateData.parent_id = parentId
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (updateErr) {
        console.error('Profile update error:', updateErr.message)
      }
    } else {
      // INSERT new profile (trigger may not exist)
      const profileData: Record<string, any> = {
        id: userId,
        email,
        full_name: fullName,
        role: 'affiliate',
        affiliate_code: affiliateCode,
        parent_id: parentId,
      }

      const { error: insertErr } = await supabase
        .from('profiles')
        .insert(profileData)

      if (insertErr) {
        console.error('Profile insert error:', insertErr.message)
        // Try without optional fields that might not exist
        if (insertErr.message?.includes('column') || insertErr.message?.includes('does not exist')) {
          const minimal: Record<string, any> = {
            id: userId,
            email,
            full_name: fullName,
            role: 'affiliate',
            affiliate_code: affiliateCode,
          }
          const retry = await supabase.from('profiles').insert(minimal)
          if (retry.error) {
            console.error('Profile retry error:', retry.error.message)
          }
        }
      }

      // Try admin_id separately (might not exist in schema)
      if (parentId) {
        try {
          const adminId = await getAdminId(supabase, parentId)
          if (adminId) {
            await supabase.from('profiles').update({ admin_id: adminId }).eq('id', userId)
          }
        } catch {
          // Skip if column doesn't exist
        }
      }
    }

    // Create affiliate record if program exists
    const { data: program } = await supabase
      .from('programs')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()

    if (program) {
      const { data: existingAff } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', userId)
        .eq('program_id', program.id)
        .maybeSingle()

      if (!existingAff) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://affiliation-pro.cashflowecosysteme.workers.dev'
        const { error: affErr } = await supabase.from('affiliates').insert({
          program_id: program.id,
          user_id: userId,
          affiliate_link: `${siteUrl}/r/${affiliateCode}`,
          parent_affiliate_id: parentAffiliateId,
          grandparent_affiliate_id: grandparentAffiliateId,
          status: 'active',
        })
        if (affErr) {
          console.error('Affiliate record error:', affErr.message)
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, email, full_name: fullName, affiliate_code: affiliateCode },
    })
  } catch (error: any) {
    console.error('Signup API error:', error?.message || error)
    return NextResponse.json(
      { error: 'Erreur serveur: ' + (error?.message || 'Veuillez réessayer.') },
      { status: 500 }
    )
  }
}

async function getAdminId(supabase: any, profileId: string): Promise<string | null> {
  let currentId = profileId
  for (let i = 0; i < 5; i++) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, parent_id, admin_id')
      .eq('id', currentId)
      .maybeSingle()
    if (!profile) return null
    if (profile.role === 'admin') return profile.id
    if (profile.admin_id) return profile.admin_id
    if (!profile.parent_id) return null
    currentId = profile.parent_id
  }
  return null
}
