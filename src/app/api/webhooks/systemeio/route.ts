import { NextRequest, NextResponse } from 'next/server'

// Systeme.io Webhook Handler
// This endpoint receives webhook events from Systeme.io

interface SystemeWebhookEvent {
  event_type: string
  data: {
    contact: {
      id: string
      email: string
      first_name?: string
      last_name?: string
    }
    sale?: {
      id: string
      amount: number
      currency: string
      product_id: string
      product_name: string
    }
    subscription?: {
      id: string
      status: string
      plan_id: string
    }
    metadata?: {
      affiliate_code?: string
      referrer?: string
      [key: string]: any
    }
  }
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SystemeWebhookEvent = await request.json()
    
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('x-systeme-signature')
    // TODO: Verify signature with your webhook secret

    console.log('Systeme.io webhook received:', body.event_type)

    switch (body.event_type) {
      case 'sale.completed':
        await handleSaleCompleted(body)
        break
      
      case 'subscription.created':
        await handleSubscriptionCreated(body)
        break
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(body)
        break
      
      case 'contact.created':
        await handleContactCreated(body)
        break
      
      default:
        console.log('Unhandled event type:', body.event_type)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSaleCompleted(event: SystemeWebhookEvent) {
  const { contact, sale, metadata } = event.data
  
  if (!sale || !metadata?.affiliate_code) {
    console.log('No affiliate code found for sale')
    return
  }

  // Find affiliate by code
  const affiliate = await findAffiliateByCode(metadata.affiliate_code)
  
  if (!affiliate) {
    console.log('Affiliate not found:', metadata.affiliate_code)
    return
  }

  // Calculate commissions for 3 levels
  const amount = sale.amount
  const level1Commission = amount * 0.25
  const level2Commission = amount * 0.10
  const level3Commission = amount * 0.05

  // Create commission for level 1
  await createCommission({
    affiliateId: affiliate.id,
    amount: amount,
    commission: level1Commission,
    level: 1,
    source: `systeme.io - ${sale.product_name}`,
    metadata: {
      sale_id: sale.id,
      contact_email: contact.email,
      product_id: sale.product_id,
    }
  })

  // Create commissions for level 2 and 3 if they exist
  if (affiliate.parent_id) {
    const level2Affiliate = await findAffiliateById(affiliate.parent_id)
    if (level2Affiliate) {
      await createCommission({
        affiliateId: level2Affiliate.id,
        amount: amount,
        commission: level2Commission,
        level: 2,
        source: `systeme.io - ${sale.product_name} (Niveau 2)`,
        metadata: { sale_id: sale.id }
      })

      if (level2Affiliate.parent_id) {
        const level3Affiliate = await findAffiliateById(level2Affiliate.parent_id)
        if (level3Affiliate) {
          await createCommission({
            affiliateId: level3Affiliate.id,
            amount: amount,
            commission: level3Commission,
            level: 3,
            source: `systeme.io - ${sale.product_name} (Niveau 3)`,
            metadata: { sale_id: sale.id }
          })
        }
      }
    }
  }

  console.log('Commissions created for sale:', sale.id)
}

async function handleSubscriptionCreated(event: SystemeWebhookEvent) {
  const { contact, subscription } = event.data
  console.log('Subscription created:', subscription?.id, 'for', contact.email)
  // Handle subscription creation
}

async function handleSubscriptionCancelled(event: SystemeWebhookEvent) {
  const { contact, subscription } = event.data
  console.log('Subscription cancelled:', subscription?.id, 'for', contact.email)
  // Handle subscription cancellation
}

async function handleContactCreated(event: SystemeWebhookEvent) {
  const { contact, metadata } = event.data
  console.log('Contact created:', contact.email)
  
  // If contact has affiliate code, track the referral
  if (metadata?.affiliate_code) {
    console.log('Referred by:', metadata.affiliate_code)
    // Track the referral click/signup
  }
}

// Placeholder functions - these would use Supabase in production
async function findAffiliateByCode(code: string) {
  // TODO: Query Supabase for affiliate by referral_code
  return null
}

async function findAffiliateById(id: string) {
  // TODO: Query Supabase for affiliate by id
  return null
}

async function createCommission(data: {
  affiliateId: string
  amount: number
  commission: number
  level: number
  source: string
  metadata: any
}) {
  // TODO: Insert commission into Supabase
  console.log('Creating commission:', data)
}
