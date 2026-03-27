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
            // We don't need to set cookies on logout, just clear them
          },
        },
      }
    )

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Create response
    const response = NextResponse.json({ success: true })

    // Get all cookies and clear them
    const allCookies = request.cookies.getAll()

    allCookies.forEach((cookie) => {
      // Clear each cookie
      response.cookies.set(cookie.name, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      })
    })

    // Also clear known Supabase cookie patterns
    const supabaseCookiePatterns = [
      'sb-access-token',
      'sb-refresh-token',
    ]

    // Add project-specific cookies
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
    if (projectRef) {
      supabaseCookiePatterns.push(
        `sb-${projectRef}-auth-token`,
        `sb-${projectRef}-auth-token.0`,
        `sb-${projectRef}-auth-token.1`,
        `sb-${projectRef}-auth-token.2`,
        `sb-${projectRef}-auth-token.3`,
      )
    }

    supabaseCookiePatterns.forEach((name) => {
      response.cookies.set(name, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      })
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Still return success to allow client-side cleanup
    const response = NextResponse.json({ success: true })

    // Clear all cookies even on error
    const allCookies = request.cookies.getAll()
    allCookies.forEach((cookie) => {
      response.cookies.set(cookie.name, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      })
    })

    return response
  }
}
