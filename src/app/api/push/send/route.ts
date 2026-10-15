import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// Configure web-push
webpush.setVapidDetails(
  'mailto:hello@scripturedeep.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface PushPayload {
  title: string
  body: string
  url?: string
  actions?: Array<{ action: string; title: string }>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientId, scripture, message, studySlug } = await request.json()

    if (!scripture) {
      return NextResponse.json({ error: 'Scripture reference is required' }, { status: 400 })
    }

    // Get sender info
    const { data: sender } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', user.id)
      .single()

    const senderData = sender as { display_name: string | null; email: string } | null
    const senderName = senderData?.display_name || senderData?.email?.split('@')[0] || 'Someone'

    // Build notification payload
    const payload: PushPayload = {
      title: `${senderName} shared a scripture`,
      body: message ? `${scripture}: ${message}` : scripture,
      url: studySlug ? `/study/${studySlug}` : '/',
    }

    // Use admin client to get subscriptions (bypasses RLS)
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get recipient subscriptions
    let query = adminSupabase.from('push_subscriptions').select('endpoint, keys')

    if (recipientId) {
      // Send to specific user
      query = query.eq('user_id', recipientId)
    } else {
      // Broadcast to all subscribed users (except sender)
      query = query.neq('user_id', user.id)
    }

    const { data: subscriptions, error: subError } = await query

    if (subError) {
      console.error('Failed to get subscriptions:', subError)
      return NextResponse.json({ error: 'Failed to get subscribers' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No subscribers to notify'
      })
    }

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string },
        }

        return webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        )
      })
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    // Clean up invalid subscriptions
    const failedResults = results
      .map((r, i) => ({ result: r, sub: subscriptions[i] }))
      .filter((r) => r.result.status === 'rejected')

    for (const { sub } of failedResults) {
      await adminSupabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', sub.endpoint)
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
