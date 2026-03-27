import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

// Generate affiliate code
function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

// Verify super admin
async function verifySuperAdmin(request: NextRequest) {
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
  if (authError || !user) return { authorized: false }

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') return { authorized: false }

  return { authorized: true, admin }
}

// CREATE USER
export async function POST(request: NextRequest) {
  try {
    const verification = await verifySuperAdmin(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    const admin = verification.admin

    const { email, password, fullName, role, subdomain, adminId } = await request.json()

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Check if email exists
    const { data: existing } = await admin.from('profiles').select('id').eq('email', email).single()
    if (existing) {
      return NextResponse.json({ error: 'Un compte avec cet email existe déjà' }, { status: 400 })
    }

    // Create user in Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Erreur création' }, { status: 400 })
    }

    const userId = authData.user.id
    const affiliateCode = generateAffiliateCode()

    // Create profile
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      role,
      affiliate_code: affiliateCode,
      subdomain: subdomain || null,
      admin_id: role === 'affiliate' ? adminId : null,
    }, { onConflict: 'id' })

    if (profileError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erreur profil: ' + profileError.message }, { status: 500 })
    }

    // Get default program and create affiliate record for admins
    if (role === 'admin') {
      const { data: program } = await admin.from('programs').select('id').eq('is_active', true).single()
      if (program) {
        await admin.from('affiliates').insert({
          program_id: program.id,
          user_id: userId,
          affiliate_link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://affiliationpro.publication-web.com'}/r/${affiliateCode}`,
          status: 'active',
        })
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// UPDATE SUBDOMAIN
export async function PUT(request: NextRequest) {
  try {
    const verification = await verifySuperAdmin(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    const admin = verification.admin

    const { userId, subdomain } = await request.json()

    // Check if subdomain is taken
    if (subdomain) {
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('subdomain', subdomain.toLowerCase())
        .neq('id', userId)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Ce sous-domaine est déjà utilisé' }, { status: 400 })
      }
    }

    const { error } = await admin
      .from('profiles')
      .update({ subdomain: subdomain?.toLowerCase() || null })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update subdomain error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// RESET PASSWORD
export async function PATCH(request: NextRequest) {
  try {
    const verification = await verifySuperAdmin(request)
    if (!verification.authorized) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    const admin = verification.admin

    const { userId, newPassword } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 })
    }

    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
