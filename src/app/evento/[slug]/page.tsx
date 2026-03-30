import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatEventDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import EventHeader from '@/components/event/EventHeader'
import ParticipantSection from '@/components/event/ParticipantSection'
import ItemSection from '@/components/event/ItemSection'
import PollSection, { type PollWithOptions } from '@/components/event/PollSection'
import ExpenseSection from '@/components/event/ExpenseSection'
import ShareBar from '@/components/share/ShareBar'
import AppBar from '@/components/ui/AppBar'
import EventFAB from '@/components/event/EventFAB'
import RealtimeProvider from '@/components/event/RealtimeProvider'
import NotificationToggle from '@/components/event/NotificationToggle'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!event) return { title: 'Evento non trovato' }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://friendsfest.vercel.app'
  const description = `${formatEventDate(event.date, event.date_end)}${event.location_name ? ` · ${event.location_name}` : ''}`

  return {
    title: `${event.emoji} ${event.title} — FriendsFest`,
    description,
    openGraph: {
      title: `${event.emoji} ${event.title}`,
      description,
      images: [`${baseUrl}/api/og/${slug}`],
      url: `${baseUrl}/evento/${slug}`,
      type: 'website',
    },
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!event) notFound()

  const [{ data: participants }, { data: items }, { data: polls }, { data: expenses }] =
    await Promise.all([
      supabase.from('participants').select('*').eq('event_id', event.id).order('created_at'),
      supabase.from('items').select('*').eq('event_id', event.id).order('created_at'),
      supabase
        .from('polls')
        .select('*, poll_options(*)')
        .eq('event_id', event.id)
        .order('created_at'),
      supabase.from('expenses').select('*').eq('event_id', event.id).order('created_at'),
    ])

  return (
    <main className="min-h-screen bg-background">
      <RealtimeProvider eventId={event.id} />
      <AppBar
        title={`${event.emoji} ${event.title}`}
        showBack
        rightAction={<NotificationToggle eventId={event.id} eventSlug={slug} />}
      />

      <div className="mx-auto max-w-lg px-4 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-24 space-y-6">
        <div
          className="animate-slide-in-up"
          style={{ animationDelay: '0ms', opacity: 0, animationFillMode: 'forwards' }}
        >
          <EventHeader event={event} />
        </div>

        <div
          className="animate-slide-in-up"
          style={{ animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}
        >
          <ParticipantSection
            eventId={event.id}
            eventSlug={slug}
            initialParticipants={participants ?? []}
          />
        </div>

        <div
          className="animate-slide-in-up"
          style={{ animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}
        >
          <ItemSection
            eventId={event.id}
            initialItems={items ?? []}
            participants={participants ?? []}
          />
        </div>

        <div
          className="animate-slide-in-up"
          style={{ animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}
        >
          <PollSection
            eventId={event.id}
            initialPolls={(polls ?? []) as PollWithOptions[]}
          />
        </div>

        <div
          className="animate-slide-in-up"
          style={{ animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}
        >
          <ExpenseSection
            eventId={event.id}
            eventTitle={event.title}
            initialExpenses={expenses ?? []}
            participants={participants ?? []}
          />
        </div>
      </div>

      <ShareBar
        event={event}
        participants={participants ?? []}
        items={items ?? []}
      />

      <EventFAB slug={slug} />
    </main>
  )
}
