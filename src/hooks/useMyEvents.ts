'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types'

export interface MyEvent extends Event {
  role: 'creator' | 'participant'
  participantCount: number
}

export function useMyEvents() {
  const [events, setEvents] = useState<MyEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMyEvents() {
      // Scansiona localStorage cercando tutti i token evento
      const slugMap = new Map<string, 'creator' | 'participant'>()

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        const creatorMatch = key.match(/^event_(.+)_creator$/)
        if (creatorMatch) {
          slugMap.set(creatorMatch[1], 'creator')
          continue
        }

        const participantMatch = key.match(/^event_(.+)_participant$/)
        if (participantMatch && !slugMap.has(participantMatch[1])) {
          slugMap.set(participantMatch[1], 'participant')
        }
      }

      if (slugMap.size === 0) {
        setEvents([])
        setLoading(false)
        return
      }

      const slugs = Array.from(slugMap.keys())
      const supabase = createClient()

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .in('slug', slugs)
        .order('date', { ascending: true })

      if (!eventsData || eventsData.length === 0) {
        setEvents([])
        setLoading(false)
        return
      }

      // Fetch conteggio partecipanti per ogni evento
      const eventIds = eventsData.map((e) => e.id)
      const { data: participants } = await supabase
        .from('participants')
        .select('event_id, status')
        .in('event_id', eventIds)

      const countMap = new Map<string, number>()
      participants?.forEach((p) => {
        if (p.status === 'confirmed' || p.status === 'maybe') {
          countMap.set(p.event_id, (countMap.get(p.event_id) ?? 0) + 1)
        }
      })

      const myEvents: MyEvent[] = eventsData.map((event) => ({
        ...event,
        role: slugMap.get(event.slug) ?? 'participant',
        participantCount: countMap.get(event.id) ?? 0,
      }))

      // Ordina: eventi futuri prima (ascending), poi passati (ascending)
      const now = new Date()
      myEvents.sort((a, b) => {
        const aFuture = new Date(a.date) > now
        const bFuture = new Date(b.date) > now
        if (aFuture && !bFuture) return -1
        if (!aFuture && bFuture) return 1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      setEvents(myEvents)
      setLoading(false)
    }

    fetchMyEvents()
  }, [])

  return { events, loading, isEmpty: !loading && events.length === 0 }
}
