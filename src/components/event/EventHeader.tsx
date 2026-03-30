import { Calendar, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { formatEventDate } from '@/lib/utils'
import type { Event } from '@/types'

interface EventHeaderProps {
  event: Event
}

export default function EventHeader({ event }: EventHeaderProps) {
  const isFlexible = event.date_mode === 'flexible'

  return (
    <Card className="glass-panel electric-glow border border-outline-variant/10">
      <CardContent className="pt-6 pb-5">
        {/* Immagine copertina o emoji con halo neon */}
        {event.image_url ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-4">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-surface-container/80 via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="relative inline-block mb-4">
            <div
              className="absolute inset-0 -m-4 bg-[radial-gradient(circle,rgba(211,148,255,0.15),transparent_70%)] rounded-full pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="relative text-7xl block animate-fade-in neon-glow-primary leading-none"
              role="img"
              aria-label={`Emoji evento: ${event.emoji}`}
            >
              {event.emoji}
            </span>
          </div>
        )}

        {/* Titolo */}
        <div className="mt-3 mb-3">
          <h1 className="font-headline text-2xl font-bold text-on-surface leading-tight">
            {event.title}
          </h1>
          {event.event_status === 'draft' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-widest rounded-full border border-secondary/20 mt-2">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" aria-hidden="true" />
              Sondaggio in corso
            </span>
          )}
        </div>

        {/* Data */}
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
          <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          {isFlexible ? (
            <span className="text-on-surface-variant italic">
              Data da votare — partecipa alla votazione qui sotto
            </span>
          ) : (
            <time dateTime={event.date ?? undefined} className="capitalize">
              {formatEventDate(event.date, event.date_end)}
            </time>
          )}
        </div>

        {/* Luogo */}
        {event.location_name && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {event.location_url ? (
              <a
                href={event.location_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 decoration-outline-variant hover:text-secondary hover:decoration-secondary transition-colors"
              >
                {event.location_name}
              </a>
            ) : (
              <span>{event.location_name}</span>
            )}
          </div>
        )}

        {/* Descrizione */}
        {event.description && (
          <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
            {event.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
