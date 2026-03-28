// @ts-nocheck

const cloudflareContextSymbol = Symbol.for("__cloudflare-context__");

export type Database = any

function getCloudflareContextFromGlobal() {
  return (globalThis as any)[cloudflareContextSymbol]
}

export async function getDB(): Promise<Database> {
  // Method 1: Try the opennextjs cloudflare context
  try {
    const ctx = getCloudflareContextFromGlobal()
    if (ctx?.env?.DB) return ctx.env.DB
  } catch {}

  // Method 2: Try dynamic import of getCloudflareContext
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const ctx = getCloudflareContext()
    if (ctx?.env?.DB) return ctx.env.DB
  } catch {}

  // Method 3: Try process.env (some setups expose bindings here)
  if ((globalThis as any).process?.env?.DB) {
    return (globalThis as any).process.env.DB
  }

  throw new Error('D1 database not available in this context')
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
  return Date.now().toString(36).toUpperCase().slice(-8)
}
