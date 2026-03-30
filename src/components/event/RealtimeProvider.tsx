'use client'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'

export default function RealtimeProvider({ eventId }: { eventId: string }) {
  useRealtimeRefresh(eventId)
  return null
}
