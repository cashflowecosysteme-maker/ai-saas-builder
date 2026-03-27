import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient, getAffiliateByLink } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

interface TrackingPageProps {
  params: Promise<{
    code: string
  }>
  searchParams: Promise<{
    redirect?: string
  }>
}

// No indexing for tracking pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Affiliate Tracking Page
 * 
 * This page handles affiliate link redirects:
 * 1. Captures the affiliate code from URL
 * 2. Records the click in the database
 * 3. Sets a cookie with the affiliate code (30 days expiry)
 * 4. Redirects to homepage or configured URL
 * 
 * URL format: /r/CODE123 or /r/CODE123?redirect=https://...
 */
export default async function TrackingPage({ params, searchParams }: TrackingPageProps) {
  const { code } = await params
  const { redirect: redirectUrl } = await searchParams
  
  // Normalize the code (uppercase)
  const affiliateCode = code?.toUpperCase()
  
  if (!affiliateCode) {
    redirect('/')
  }
  
  try {
    // Get headers for tracking info
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || null
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null
    const referrer = headersList.get('referer') || null
    
    // Get the landing URL
    const host = headersList.get('host') || ''
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const landingUrl = `${protocol}://${host}/r/${code}`
    
    // Find the affiliate by their link code
    const { affiliate } = await getAffiliateByLink(affiliateCode)
    
    // Generate a visitor ID (could use fingerprinting in production)
    const visitorId = generateVisitorId()
    
    // Always record the click, even if affiliate not found (for analytics)
    const admin = createAdminClient()
    
    if (affiliate) {
      // Record click for valid affiliate
      await admin
        .from('clicks')
        .insert({
          affiliate_id: affiliate.id,
          visitor_id: visitorId,
          ip_address: ipAddress,
          user_agent: userAgent,
          referrer_url: referrer,
          landing_url: landingUrl,
        })
      
      console.log(`[Tracking] Click recorded for affiliate: ${affiliate.id}`)
    } else {
      console.log(`[Tracking] No affiliate found for code: ${affiliateCode}`)
    }
    
    // Set cookie with affiliate code (30 days)
    const cookieStore = await cookies()
    const cookieExpiry = 60 * 60 * 24 * 30 // 30 days in seconds
    
    cookieStore.set('affiliate_code', affiliateCode, {
      expires: new Date(Date.now() + cookieExpiry * 1000),
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    })
    
    // Also store the affiliate link for reference
    if (affiliate) {
      cookieStore.set('affiliate_id', affiliate.id, {
        expires: new Date(Date.now() + cookieExpiry * 1000),
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      })
    }
    
  } catch (error) {
    console.error('[Tracking] Error:', error)
    // Continue with redirect even on error
  }
  
  // Determine redirect destination
  const destination = redirectUrl || '/'
  
  // Validate redirect URL to prevent open redirect
  if (redirectUrl) {
    try {
      const url = new URL(redirectUrl)
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        redirect('/')
      }
    } catch {
      // Invalid URL, redirect to home
      redirect('/')
    }
  }
  
  redirect(destination)
}

/**
 * Generate a unique visitor ID
 * In production, you might want to use more sophisticated fingerprinting
 */
function generateVisitorId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}
