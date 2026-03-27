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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if super admin
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { subject, content, recipientId, isBroadcast } = await request.json()

    if (!subject || !content) {
      return NextResponse.json({ error: 'Sujet et contenu requis' }, { status: 400 })
    }

    if (isBroadcast) {
      // Get all users
      const { data: users } = await admin
        .from('profiles')
        .select('id')
        .neq('id', user.id)

      if (users && users.length > 0) {
        // Create individual messages for each user
        const messages = users.map((u: { id: string }) => ({
          sender_id: user.id,
          recipient_id: u.id,
          subject,
          content,
          is_broadcast: true,
        }))

        const { error } = await admin.from('messages').insert(messages)
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }
    } else {
      if (!recipientId) {
        return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 })
      }

      const { error } = await admin.from('messages').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        subject,
        content,
        is_broadcast: false,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
