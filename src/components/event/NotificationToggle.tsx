'use client'

import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { cn } from '@/lib/utils'

interface NotificationToggleProps {
  eventId: string
  eventSlug: string
}

export default function NotificationToggle({ eventId }: NotificationToggleProps) {
  const { permission, isSubscribed, isSupported, loading, subscribe, unsubscribe } =
    usePushNotifications(eventId)

  // SSR / unsupported browser — render nothing so layout is unchanged
  if (!isSupported) return null

  // While detecting existing subscription state — show a neutral placeholder
  if (loading) {
    return (
      <div className="w-10 h-10 flex items-center justify-center text-on-surface-variant">
        <Loader2 size={18} className="animate-spin opacity-60" />
      </div>
    )
  }

  // The user has explicitly blocked notifications — show a static hint
  if (permission === 'denied') {
    return (
      <div
        title="Notifiche bloccate dal browser. Abilitale nelle impostazioni."
        className="w-10 h-10 flex items-center justify-center text-on-surface-variant opacity-40 cursor-not-allowed"
      >
        <BellOff size={18} />
      </div>
    )
  }

  // Subscribed state — click to unsubscribe
  if (isSubscribed) {
    return (
      <button
        onClick={unsubscribe}
        title="Promemoria attivo — clicca per disattivare"
        aria-label="Disattiva promemoria notifiche"
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-full',
          'text-primary',
          'shadow-[0_0_12px_rgba(211,148,255,0.45)]',
          'hover:bg-primary/10 active:scale-90 transition-all duration-150'
        )}
      >
        <BellRing size={18} />
      </button>
    )
  }

  // Not subscribed — click to subscribe
  return (
    <button
      onClick={subscribe}
      title="Attiva promemoria per questo evento"
      aria-label="Attiva promemoria notifiche"
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-full',
        'text-on-surface-variant',
        'hover:text-primary hover:bg-primary/10 active:scale-90 transition-all duration-150'
      )}
    >
      <Bell size={18} />
    </button>
  )
}
