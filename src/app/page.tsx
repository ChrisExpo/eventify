'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/Button'
import { EventListCard } from '@/components/event/EventListCard'
import { useMyEvents } from '@/hooks/useMyEvents'
import type { MyEvent } from '@/hooks/useMyEvents'

// ─── Skeleton loading ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface-container-high rounded-[1rem] p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-container flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-container rounded w-3/4" />
          <div className="h-3 bg-surface-container rounded w-1/2" />
          <div className="h-3 bg-surface-container rounded w-1/3" />
        </div>
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Caricamento eventi in corso">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 animate-fade-in">
      {/* Emoji con pulse-ring */}
      <div className="relative mb-6">
        <div className="pulse-ring" aria-hidden="true" />
        <div className="relative w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center neon-glow-primary">
          <span className="text-5xl leading-none" role="img" aria-label="teatro">
            🎭
          </span>
        </div>
      </div>

      <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
        Nessun evento ancora
      </h2>
      <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs mb-8">
        Crea il tuo primo evento o partecipa tramite un link condiviso da un amico.
      </p>

      <Link href="/crea">
        <Button variant="primary" size="lg">
          Crea il tuo primo evento
        </Button>
      </Link>
    </div>
  )
}

// ─── Sezione eventi ───────────────────────────────────────────────────────────

interface EventSectionProps {
  title: string
  events: MyEvent[]
  muted?: boolean
}

function EventSection({ title, events, muted = false }: EventSectionProps) {
  if (events.length === 0) return null

  return (
    <section aria-labelledby={`section-${title.toLowerCase()}`}>
      <h2
        id={`section-${title.toLowerCase()}`}
        className={[
          'text-xs font-bold uppercase tracking-widest mb-3',
          muted ? 'text-on-surface-variant' : 'text-primary',
        ].join(' ')}
      >
        {title}
      </h2>
      <ul className="space-y-3">
        {events.map((event, index) => (
          <li
            key={event.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 60}ms`, opacity: 0, animationFillMode: 'forwards' }}
          >
            <EventListCard event={event} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─── Homepage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { events, loading, isEmpty } = useMyEvents()

  const now = new Date()
  const futureEvents = events.filter((e) => !e.date || new Date(e.date) >= now)
  const pastEvents = events.filter((e) => e.date && new Date(e.date) < now)

  return (
    <div className="flex flex-col min-h-full bg-background">
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-[env(safe-area-inset-top)] pb-28 sm:px-6">
        {/* Logo FriendsFest */}
        <div className="flex items-center justify-center mb-6 pt-6">
          <img src="/logo.png" alt="FriendsFest" className="h-10 object-contain" />
        </div>

        {/* Hero compatta */}
        <header className="mb-6">
          <div
            className="animate-slide-in-up"
            style={{ animationDelay: '0ms', opacity: 0, animationFillMode: 'forwards' }}
          >
            <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">
              I tuoi eventi
            </h1>
            <p className="text-sm text-on-surface-variant">
              Gestisci e partecipa ai tuoi eventi
            </p>
          </div>
        </header>

        {/* Contenuto dinamico */}
        {loading && <SkeletonList />}

        {isEmpty && <EmptyState />}

        {!loading && !isEmpty && (
          <div className="space-y-6">
            {/* Prossimi */}
            <EventSection title="Prossimi" events={futureEvents} />

            {/* Divider solo se ci sono entrambe le sezioni */}
            {futureEvents.length > 0 && pastEvents.length > 0 && (
              <div
                className="gradient-divider"
                role="separator"
                aria-hidden="true"
              />
            )}

            {/* Passati */}
            <EventSection title="Passati" events={pastEvents} muted />
          </div>
        )}
      </main>
    </div>
  )
}
