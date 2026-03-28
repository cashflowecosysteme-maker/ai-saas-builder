import { getCloudflareContext } from '@opennextjs/cloudflare'

export type Database = D1Database

export interface Env {
  DB: Database
  JWT_SECRET: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  NEXT_PUBLIC_SITE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

export async function getDB(): Promise<Database> {
  const ctx = getCloudflareContext()
  if (!ctx || !ctx.env.DB) {
    throw new Error('D1 database not available')
  }
  return ctx.env.DB as Database
}

export async function getEnv(): Promise<Env> {
  const ctx = getCloudflareContext()
  if (!ctx) {
    throw new Error('Cloudflare context not available')
  }
  return ctx.env as unknown as Env
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function generateUniqueAffiliateCode(db: Database): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateAffiliateCode()
    const existing = await db.prepare('SELECT id FROM users WHERE affiliate_code = ?').bind(code).first()
    if (!existing) return code
  }
  // Fallback with timestamp
  return Date.now().toString(36).toUpperCase().slice(-8)
}
