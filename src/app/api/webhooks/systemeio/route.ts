/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getDB, generateId } from '@/lib/db'

export const runtime = 'edge'

/**
 * Systeme.io Webhook Handler
 * POST /api/webhooks/systemeio
 */

interface SystemeIoWebhookPayload {
  event: string
  data: {
    id: string
    contact?: {
      email?: string
      first_name?: string
      last_name?: string
    }
    product?: {
      id: string
      name?: string
      price?: number
    }
    metadata?: {
      affiliate_code?: string
      [key: string]: unknown
    }
    amount?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: SystemeIoWebhookPayload = await request.json()
    
    console.log('[Systeme.io Webhook] Received:', JSON.stringify(payload, null, 2))
    
    if (payload.event !== 'order.created') {
      console.log('[Systeme.io Webhook] Ignoring event:', payload.event)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }
    
    const { data } = payload
    
    if (!data.id) {
      return NextResponse.json({ success: false, error: 'Missing order ID' }, { status: 400 })
    }
    
    const affiliateCode = data.metadata?.affiliate_code
    
    if (!affiliateCode) {
      console.log('[Systeme.io Webhook] No affiliate code in metadata')
      return NextResponse.json({ success: true, message: 'No affiliate code - sale recorded without commission' })
    }

    const db = await getDB()
    
    // Find the affiliate by code
    const user = await db
      .prepare('SELECT * FROM users WHERE affiliate_code = ?')
      .bind(affiliateCode)
      ()
    
    if (!user) {
      console.log('[Systeme.io Webhook] Affiliate not found for code:', affiliateCode)
      return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404 })
    }
    
    // Get the affiliate record
    const affiliate = await db
      .prepare('SELECT id, program_id FROM affiliates WHERE user_id = ? AND status = ?')
      .bind(user.id, 'active')
      ()
    
    if (!affiliate) {
      console.log('[Systeme.io Webhook] No active affiliate record for user:', user.id)
      return NextResponse.json({ success: false, error: 'No active affiliate record' }, { status: 404 })
    }
    
    // Determine the sale amount
    const saleAmount = data.amount || data.product?.price || 0
    
    if (saleAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid sale amount' }, { status: 400 })
    }
    
    // Customer info
    const customerEmail = data.contact?.email || null
    const customerName = data.contact?.first_name && data.contact?.last_name
      ? `${data.contact.first_name} ${data.contact.last_name}`
      : data.contact?.first_name || null
    
    // Get program commission rates
    const program = await db
      .prepare('SELECT commission_l1, commission_l2, commission_l3 FROM programs WHERE id = ?')
      .bind(affiliate.program_id)
      ()

    if (!program) {
      return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 })
    }

    // Get affiliate with parent info
    const affiliateWithParent = await db
      .prepare('SELECT id, parent_affiliate_id, grandparent_affiliate_id FROM affiliates WHERE id = ?')
      .bind(affiliate.id)
      ()

    // Calculate commissions
    const commissionL1 = (saleAmount * program.commission_l1) / 100
    const commissionL2 = (saleAmount * program.commission_l2) / 100
    const commissionL3 = (saleAmount * program.commission_l3) / 100

    // Create the sale
    const saleId = generateId()
    const now = new Date().toISOString()
    const metadata = JSON.stringify({
      systemeio_event: payload.event,
      product_id: data.product?.id,
      product_name: data.product?.name,
    })

    await db
      .prepare('INSERT INTO sales (id, affiliate_id, program_id, external_order_id, amount, commission_l1, commission_l2, commission_l3, customer_email, customer_name, metadata, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        saleId,
        affiliate.id,
        affiliate.program_id,
        data.id,
        saleAmount,
        commissionL1,
        commissionL2,
        commissionL3,
        customerEmail,
        customerName,
        metadata,
        'pending',
        now
      )
      .run()

    // Create commission records
    const commissions: Array<{ sale_id: string; affiliate_id: string; level: number; amount: number; status: string }> = []

    commissions.push({
      sale_id: saleId,
      affiliate_id: affiliate.id,
      level: 1,
      amount: commissionL1,
      status: 'pending',
    })

    if (affiliateWithParent?.parent_affiliate_id) {
      commissions.push({
        sale_id: saleId,
        affiliate_id: affiliateWithParent.parent_affiliate_id,
        level: 2,
        amount: commissionL2,
        status: 'pending',
      })
    }

    if (affiliateWithParent?.grandparent_affiliate_id) {
      commissions.push({
        sale_id: saleId,
        affiliate_id: affiliateWithParent.grandparent_affiliate_id,
        level: 3,
        amount: commissionL3,
        status: 'pending',
      })
    }

    // Insert commission records
    for (const commission of commissions) {
      await db
        .prepare('INSERT INTO commissions (id, sale_id, affiliate_id, level, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(generateId(), commission.sale_id, commission.affiliate_id, commission.level, commission.amount, commission.status, now)
        .run()
    }
    
    console.log('[Systeme.io Webhook] Sale created:', saleId)
    console.log('[Systeme.io Webhook] Commissions created:', commissions.length)
    
    return NextResponse.json({
      success: true,
      sale_id: saleId,
      commissions_count: commissions.length,
    })
    
  } catch (error) {
    console.error('[Systeme.io Webhook] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Systeme.io webhook endpoint is active',
  })
}
