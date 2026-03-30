import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import webpush from 'web-push'

type PushSub = { endpoint: string; p256dh: string; auth: string }

let vapidInitialized = false

function ensureVapid() {
  if (vapidInitialized) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails('mailto:noreply@friendsfest.app', publicKey, privateKey)
  vapidInitialized = true
  return true
}

async function sendPushNotification(sub: PushSub, payload: string): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    payload
  )
}

interface EventRow {
  id: string
  title: string
  emoji: string
  slug: string
  date: string
}

async function dispatchReminders(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  events: EventRow[],
  type: '24h' | '2h',
  bodyText: string
): Promise<number> {
  let sent = 0

  for (const event of events) {
    // Skip events that already have this reminder in the log
    const { data: alreadySent } = await supabase
      .from('notification_log')
      .select('id')
      .eq('event_id', event.id)
      .eq('type', type)
      .maybeSingle()

    if (alreadySent) continue

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('event_id', event.id)

    if (!subs || subs.length === 0) continue

    const payload = JSON.stringify({
      title: `${event.emoji} ${event.title}`,
      body: bodyText,
      url: `/evento/${event.slug}`,
    })

    const expiredEndpoints: string[] = []

    for (const sub of subs) {
      try {
        await sendPushNotification(sub, payload)
        sent++
      } catch (err: unknown) {
        // 404 / 410 responses mean the subscription has expired — clean it up
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          expiredEndpoints.push(sub.endpoint)
        } else {
          console.error('[push/send] sendNotification error:', err)
        }
      }
    }

    // Remove expired subscriptions to keep the table clean
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('event_id', event.id)
        .in('endpoint', expiredEndpoints)
    }

    // Record that this reminder has been sent — the unique constraint prevents
    // duplicate inserts if the cron fires concurrently.
    await supabase
      .from('notification_log')
      .insert({ event_id: event.id, type })
      .throwOnError()
  }

  return sent
}

export async function GET(request: Request) {
  if (!ensureVapid()) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  // Authenticate the cron caller with a shared secret
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!process.env.PUSH_CRON_SECRET) {
    console.error('[push/send] PUSH_CRON_SECRET is not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (secret !== process.env.PUSH_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()
  const now = new Date()

  // 24h window: events between now and now+24h
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // 2h window: events between now and now+2h
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const [{ data: events24h, error: err24h }, { data: events2h, error: err2h }] =
    await Promise.all([
      supabase
        .from('events')
        .select('id, title, emoji, slug, date')
        .gte('date', now.toISOString())
        .lte('date', in24h.toISOString()),
      supabase
        .from('events')
        .select('id, title, emoji, slug, date')
        .gte('date', now.toISOString())
        .lte('date', in2h.toISOString()),
    ])

  if (err24h) console.error('[push/send] events24h query error:', err24h.message)
  if (err2h) console.error('[push/send] events2h query error:', err2h.message)

  const [sent24h, sent2h] = await Promise.all([
    dispatchReminders(supabase, (events24h ?? []) as EventRow[], '24h', 'Domani! Non dimenticare il tuo evento'),
    dispatchReminders(supabase, (events2h ?? []) as EventRow[], '2h', 'Tra 2 ore! Preparati'),
  ])

  const total = sent24h + sent2h
  console.info(`[push/send] Dispatched: ${sent24h} (24h) + ${sent2h} (2h) = ${total} total`)

  return NextResponse.json({ sent: total, sent24h, sent2h })
}
