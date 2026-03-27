import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

/**
 * POST /api/auth/logout
 * Logout the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Create response object
    let response = NextResponse.next()

    // Create Supabase client with cookie handling for edge runtime
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Return success and clear cookies
    const successResponse = NextResponse.json({ success: true })

    // Clear auth cookies
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-fttmwpqzvadndqbfyhot-auth-token',
      'sb-fttmwpqzvadndqbfyhot-auth-token.0',
      'sb-fttmwpqzvadndqbfyhot-auth-token.1',
    ]

    authCookies.forEach((name) => {
      successResponse.cookies.set(name, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })
    })

    return successResponse
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
