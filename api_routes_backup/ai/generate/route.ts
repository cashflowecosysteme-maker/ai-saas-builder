import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAffiliateContent, generateSiteContent } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, prompt, niche, style } = body

    let result

    switch (type) {
      case 'content':
        if (!prompt) {
          return NextResponse.json(
            { error: 'Prompt is required for content generation' },
            { status: 400 }
          )
        }
        result = await generateAffiliateContent(prompt)
        break

      case 'site':
        if (!niche) {
          return NextResponse.json(
            { error: 'Niche is required for site generation' },
            { status: 400 }
          )
        }
        result = await generateSiteContent(niche, style || 'premium')
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use "content" or "site"' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error.message || 'AI generation failed' },
      { status: 500 }
    )
  }
}

// Example request bodies:
// Content generation:
// {
//   "type": "content",
//   "prompt": "Écris un email de prospection pour promouvoir Affiliation Pro"
// }

// Site generation:
// {
//   "type": "site",
//   "niche": "marketing digital",
//   "style": "premium"
// }
