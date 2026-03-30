'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types'

export interface MyEvent extends Event {
  role: 'creator' | 'participant' | 'none'
  participantCount: number
}

export function useMyEvents() {
  const [events, setEvents] = useState<MyEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      const supabase = createClient()

      // Raccogli slug dal localStorage per determinare il ruolo
      const slugRoles = new Map<string, 'creator' | 'participant'>()
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        const creatorMatch = key.match(/^event_(.+)_creator$/)
        if (creatorMatch) { slugRoles.set(creatorMatch[1], 'creator'); continue }
        const participantMatch = key.match(/^event_(.+)_participant$/)
        if (participantMatch && !slugRoles.has(participantMatch[1])) {
          slugRoles.set(participantMatch[1], 'participant')
        }
      }

      // Fetch TUTTI gli eventi (ultimi 30 giorni + futuri)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .or(`date.gte.${thirtyDaysAgo.toISOString()},date.is.null`)
        .order('date', { ascending: true, nullsFirst: false })

      if (!eventsData || eventsData.length === 0) {
        setEvents([])
        setLoading(false)
        return
      }

      // Fetch conteggio partecipanti
      const eventIds = eventsData.map(e => e.id)
      const { data: participants } = await supabase
        .from('participants')
        .select('event_id, status')
        .in('event_id', eventIds)

      const countMap = new Map<string, number>()
      participants?.forEach(p => {
        if (p.status === 'confirmed' || p.status === 'maybe') {
          countMap.set(p.event_id, (countMap.get(p.event_id) || 0) + 1)
        }
      })

      const myEvents: MyEvent[] = eventsData.map(event => ({
        ...event,
        role: slugRoles.get(event.slug) || 'none',
        participantCount: countMap.get(event.id) || 0,
      }))

      // Ordina: eventi futuri prima, poi passati; eventi senza data in fondo
      const now = new Date()
      myEvents.sort((a, b) => {
        const aHasDate = !!a.date
        const bHasDate = !!b.date
        if (!aHasDate && !bHasDate) return 0
        if (!aHasDate) return 1
        if (!bHasDate) return -1

        const aFuture = new Date(a.date!) > now
        const bFuture = new Date(b.date!) > now
        if (aFuture && !bFuture) return -1
        if (!aFuture && bFuture) return 1
        return new Date(a.date!).getTime() - new Date(b.date!).getTime()
      })

      setEvents(myEvents)
      setLoading(false)
    }

    fetchEvents()
  }, [])

  return { events, loading, isEmpty: !loading && events.length === 0 }
}
