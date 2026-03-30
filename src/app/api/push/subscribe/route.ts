import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validate the incoming subscription payload
const SubscribeSchema = z.object({
  event_id: z.string().uuid({ message: 'event_id must be a valid UUID' }),
  endpoint: z.string().url({ message: 'endpoint must be a valid URL' }),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = SubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { event_id, endpoint, p256dh, auth } = parsed.data

  const supabase = await createServerSupabaseClient()

  // Verify the event exists before persisting a dangling subscription
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', event_id)
    .maybeSingle()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    { event_id, endpoint, p256dh, auth },
    { onConflict: 'event_id,endpoint' }
  )

  if (error) {
    console.error('[push/subscribe] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

export async function DELETE(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const DeleteSchema = z.object({
    event_id: z.string().uuid(),
    endpoint: z.string().url(),
  })

  const parsed = DeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
  }

  const { event_id, endpoint } = parsed.data
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('event_id', event_id)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('[push/subscribe] DELETE error:', error.message)
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
