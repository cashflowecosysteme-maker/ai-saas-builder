import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/r']
  const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  // API webhooks are always public
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  // API auth routes are public
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Public pages - no auth needed
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for session cookie
  const cookieHeader = request.cookies.get(COOKIE_NAME)
  if (!cookieHeader?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify JWT token
  const session = await verifyToken(cookieHeader.value)
  if (!session) {
    // Invalid/expired token - redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete(COOKIE_NAME)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)',
  ],
}
