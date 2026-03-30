'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

export async function addParticipant(eventId: string, name: string, status: string) {
  const supabase = await createServerSupabaseClient()
  const token = generateToken()

  const { data, error } = await supabase
    .from('participants')
    .insert({ event_id: eventId, name: name.trim(), status: status as 'confirmed' | 'maybe' | 'declined', token })
    .select('id, token')
    .single()

  if (error?.code === '23505') {
    return { error: 'Questo nome è già stato usato per questo evento' }
  }
  if (error) return { error: "Errore nell'aggiunta del partecipante" }

  revalidatePath('/evento/[slug]', 'page')
  return { id: data.id, token: data.token }
}

export async function updateParticipantStatus(participantId: string, status: string, token: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('participants')
    .update({ status: status as 'confirmed' | 'maybe' | 'declined' })
    .eq('id', participantId)
    .eq('token', token)
    .select()
    .single()

  if (!data) return { error: 'Non autorizzato' }
  if (error) return { error: "Errore nell'aggiornamento" }

  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}
