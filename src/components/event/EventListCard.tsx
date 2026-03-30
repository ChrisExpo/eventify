'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import type { MyEvent } from '@/hooks/useMyEvents'

function formatCardDate(date: string | null, dateEnd?: string | null): string {
  if (!date) return 'Data da definire'
  if (dateEnd) {
    return `Dal ${formatDateShort(date)} al ${formatDateShort(dateEnd)}`
  }
  return formatDateShort(date)
}

interface EventListCardProps {
  event: MyEvent
}

export function EventListCard({ event }: EventListCardProps) {
  const isPast = event.date ? new Date(event.date) < new Date() : false

  return (
    <Link
      href={`/evento/${event.slug}`}
      className="block"
      aria-label={`Apri evento ${event.title}`}
    >
      <div
        className={[
          'group bg-surface-container-high rounded-[1rem] p-4',
          'border border-outline-variant/10',
          'hover:border-primary/30',
          'active:scale-[0.98] transition-all duration-200',
          isPast ? 'opacity-60' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex items-start gap-4">
          {/* Thumbnail: foto o emoji */}
          {event.image_url ? (
            <div
              className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
              aria-hidden="true"
            >
              <img
                src={event.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0"
              aria-hidden="true"
            >
              {event.emoji}
            </div>
          )}

          {/* Contenuto */}
          <div className="flex-1 min-w-0">
            {/* Titolo + badge ruolo */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-headline font-bold text-on-surface truncate">
                {event.title}
              </h3>
              {event.role === 'creator' && (
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 flex-shrink-0"
                  aria-label="Sei l'organizzatore"
                >
                  Organizzatore
                </span>
              )}
            </div>

            {/* Data o badge sondaggio */}
            {event.event_status === 'draft' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-2 py-0.5 bg-secondary/10 text-secondary rounded-full border border-secondary/20">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" aria-hidden="true" />
                Sondaggio
              </span>
            ) : (
              <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
                <Calendar size={14} className="text-primary flex-shrink-0" aria-hidden="true" />
                {formatCardDate(event.date, event.date_end)}
              </p>
            )}

            {/* Luogo */}
            {event.location_name && (
              <p className="text-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                <MapPin size={14} className="text-secondary flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{event.location_name}</span>
              </p>
            )}

            {/* Footer: partecipanti + badge passato */}
            <div className="flex items-center gap-3 mt-2">
              {event.participantCount > 0 && (
                <span className="text-xs text-tertiary font-medium flex items-center gap-1">
                  <Users size={12} aria-hidden="true" />
                  {event.participantCount}{' '}
                  {event.participantCount === 1 ? 'partecipante' : 'partecipanti'}
                </span>
              )}
              {isPast && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-on-surface-variant/10 text-on-surface-variant rounded-full">
                  Passato
                </span>
              )}
            </div>
          </div>

          {/* Chevron */}
          <ChevronRight
            size={18}
            className="text-outline-variant self-center flex-shrink-0 group-hover:text-primary transition-colors"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  )
}
