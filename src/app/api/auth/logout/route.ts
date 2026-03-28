import { NextResponse } from 'next/server'
import { createLogoutCookie } from '@/lib/auth'

export const runtime = 'edge'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', createLogoutCookie())
  return response
}
