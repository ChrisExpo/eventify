'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeRefresh(eventId: string) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${eventId}` },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `event_id=eq.${eventId}` },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `event_id=eq.${eventId}` },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls', filter: `event_id=eq.${eventId}` },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_options' },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, router])
}
