'use client'

import type { Event, Participant, Item } from '@/types'
import WhatsAppButton from './WhatsAppButton'
import CopyLinkButton from './CopyLinkButton'

interface ShareBarProps {
  event: Event
  participants: Participant[]
  items: Item[]
}

export default function ShareBar({ event, participants, items }: ShareBarProps) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-t border-primary/10 shadow-[0_0_20px_rgba(211,148,255,0.1)] pb-[env(safe-area-inset-bottom)]"
      role="region"
      aria-label="Condividi evento"
    >
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <WhatsAppButton
          event={event}
          participants={participants}
          items={items}
          className="flex-1 active:scale-95 transition-all duration-150"
        />
        <CopyLinkButton
          slug={event.slug}
          className="active:scale-95 transition-all duration-150"
        />
      </div>
    </div>
  )
}
