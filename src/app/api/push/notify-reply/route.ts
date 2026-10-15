import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import webpush from 'web-push'

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

    const { noteId, studentId, replyPreview } = await request.json()

    if (!noteId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get teacher's name
    const { data: teacherProfile } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const teacherName = (teacherProfile as { display_name: string | null } | null)?.display_name || 'Your teacher'

    // Get student's push subscription using admin client
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions } = await (adminSupabase.from('push_subscriptions') as any)
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', studentId)
      .limit(1)

    if (!subscriptions || subscriptions.length === 0) {
      // Student doesn't have notifications enabled, that's okay
      return NextResponse.json({ sent: false, reason: 'No subscription' })
    }

    const subscription = subscriptions[0]

    // Truncate reply preview
    const preview = replyPreview?.length > 100
      ? replyPreview.substring(0, 100) + '...'
      : replyPreview || 'View the reply'

    const payload = JSON.stringify({
      title: `${teacherName} replied to your note`,
      body: preview,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        type: 'note_reply',
        url: '/notes',
      },
    })

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
      return NextResponse.json({ sent: true })
    } catch (error) {
      // If subscription is invalid, delete it
      if (error instanceof webpush.WebPushError && error.statusCode === 410) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminSupabase.from('push_subscriptions') as any)
          .delete()
          .eq('id', subscription.id)
      }
      return NextResponse.json({ sent: false, reason: 'Push failed' })
    }
  } catch (error) {
    console.error('Notify reply error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
