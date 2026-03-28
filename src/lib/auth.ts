import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const COOKIE_NAME = 'affiliation-pro-session'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'affiliation-pro-secret-change-in-production'
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  userId: string
  email: string
  role: 'super_admin' | 'admin' | 'affiliate'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: SessionPayload): Promise<string> {
  const secret = getSecret()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret()
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as SessionPayload['role'],
    }
  } catch {
    return null
  }
}

export function getSessionToken(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Then check cookie
  const cookieHeader = request.headers.get('Cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`))
  if (sessionCookie) {
    return sessionCookie.split('=')[1]
  }

  return null
}

export async function getSession(request: Request): Promise<SessionPayload | null> {
  const token = getSessionToken(request)
  if (!token) return null
  return verifyToken(token)
}

export function createSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
}

export function createLogoutCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}
