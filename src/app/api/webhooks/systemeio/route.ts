import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getUserByAffiliateCode } from '@/lib/supabase/admin'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

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
    
    // Find the affiliate by code
    const { user, error: userError } = await getUserByAffiliateCode(affiliateCode)
    
    if (userError || !user) {
      console.log('[Systeme.io Webhook] Affiliate not found for code:', affiliateCode)
      return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404 })
    }
    
    const admin = createAdminClient() as any
    
    // Get the affiliate record
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, program_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    
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
    const customerEmail = data.contact?.email
    const customerName = data.contact?.first_name && data.contact?.last_name
      ? `${data.contact.first_name} ${data.contact.last_name}`
      : data.contact?.first_name || null
    
    // Get program commission rates
    const { data: program } = await admin
      .from('programs')
      .select('commission_l1, commission_l2, commission_l3')
      .eq('id', affiliate.program_id)
      .single()

    if (!program) {
      return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 })
    }

    // Get affiliate with parent info
    const { data: affiliateWithParent } = await admin
      .from('affiliates')
      .select('id, parent_affiliate_id, grandparent_affiliate_id')
      .eq('id', affiliate.id)
      .single()

    // Calculate commissions
    const commissionL1 = (saleAmount * program.commission_l1) / 100
    const commissionL2 = (saleAmount * program.commission_l2) / 100
    const commissionL3 = (saleAmount * program.commission_l3) / 100

    // Create the sale
    const { data: sale, error: saleError } = await admin
      .from('sales')
      .insert({
        affiliate_id: affiliate.id,
        program_id: affiliate.program_id,
        external_order_id: data.id,
        amount: saleAmount,
        commission_l1: commissionL1,
        commission_l2: commissionL2,
        commission_l3: commissionL3,
        customer_email: customerEmail,
        customer_name: customerName,
        metadata: {
          systemeio_event: payload.event,
          product_id: data.product?.id,
          product_name: data.product?.name,
        },
        status: 'pending',
      })
      .select()
      .single()

    if (saleError || !sale) {
      console.error('[Systeme.io Webhook] Error creating sale:', saleError)
      return NextResponse.json({ success: false, error: 'Failed to create sale' }, { status: 500 })
    }

    // Create commission records
    const commissions = []

    commissions.push({
      sale_id: sale.id,
      affiliate_id: affiliate.id,
      level: 1,
      amount: commissionL1,
      status: 'pending',
    })

    if (affiliateWithParent?.parent_affiliate_id) {
      commissions.push({
        sale_id: sale.id,
        affiliate_id: affiliateWithParent.parent_affiliate_id,
        level: 2,
        amount: commissionL2,
        status: 'pending',
      })
    }

    if (affiliateWithParent?.grandparent_affiliate_id) {
      commissions.push({
        sale_id: sale.id,
        affiliate_id: affiliateWithParent.grandparent_affiliate_id,
        level: 3,
        amount: commissionL3,
        status: 'pending',
      })
    }

    const { error: commissionsError } = await admin
      .from('commissions')
      .insert(commissions)

    if (commissionsError) {
      console.error('[Systeme.io Webhook] Error creating commissions:', commissionsError)
    }
    
    console.log('[Systeme.io Webhook] Sale created:', sale.id)
    console.log('[Systeme.io Webhook] Commissions created:', commissions.length)
    
    return NextResponse.json({
      success: true,
      sale_id: sale.id,
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
