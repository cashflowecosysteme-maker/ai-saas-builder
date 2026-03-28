import { type NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'affiliation-pro-session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths - no auth needed
  const isPublicPath = pathname === '/' || 
    pathname === '/login' || 
    pathname === '/signup' ||
    pathname.startsWith('/r/') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/test') ||
    pathname.startsWith('/api/debug')

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for session cookie
  const cookieHeader = request.cookies.get(COOKIE_NAME)
  if (!cookieHeader?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to login (the API routes themselves will verify the JWT properly)
  // The middleware just checks cookie existence for page routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)',
  ],
}
