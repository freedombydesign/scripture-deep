import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import type { User } from '@/types/database'

webpush.setVapidDetails(
  'mailto:support@scripturedeep.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is a teacher
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userProfile = profile as Pick<User, 'role'> | null
    if (userProfile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can broadcast notifications' }, { status: 403 })
    }

    const { title, body, type } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    // Get all push subscriptions using admin client to bypass RLS
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all student subscriptions (exclude teacher's own)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions } = await (adminSupabase.from('push_subscriptions') as any)
      .select('id, user_id, endpoint, p256dh, auth')
      .neq('user_id', user.id)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No students have notifications enabled' })
    }

    // Get unique user subscriptions (one per user for simplicity)
    const userSubscriptionMap = new Map<string, typeof subscriptions[0]>()
    for (const sub of subscriptions) {
      if (!userSubscriptionMap.has(sub.user_id)) {
        userSubscriptionMap.set(sub.user_id, sub)
      }
    }

    // Create notification payload with icon
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        type,
        url: '/',
      },
    })

    let sentCount = 0
    const failedSubscriptionIds: string[] = []

    // Send to each unique user
    for (const [, subscription] of userSubscriptionMap) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        )
        sentCount++
      } catch (error) {
        // If subscription is invalid, mark for deletion
        if (error instanceof webpush.WebPushError && error.statusCode === 410) {
          failedSubscriptionIds.push(subscription.id)
        }
      }
    }

    // Clean up invalid subscriptions
    if (failedSubscriptionIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminSupabase.from('push_subscriptions') as any)
        .delete()
        .in('id', failedSubscriptionIds)
    }

    return NextResponse.json({
      sent: sentCount,
      message: `Notification sent to ${sentCount} student${sentCount !== 1 ? 's' : ''}`,
    })
  } catch (error) {
    console.error('Broadcast error:', error)
    return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 })
  }
}
