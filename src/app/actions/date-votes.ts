'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Toggle voto su un giorno (aggiungi se non presente, rimuovi se presente)
export async function toggleDateVote(
  eventId: string,
  dateOption: string,
  voterName: string
) {
  const supabase = await createServerSupabaseClient()
  const trimmedName = voterName.trim()
  if (!trimmedName) return { error: 'Inserisci il tuo nome' }

  // Controlla se il voto esiste già
  const { data: existing } = await supabase
    .from('date_votes')
    .select('id')
    .eq('event_id', eventId)
    .eq('date_option', dateOption)
    .eq('voter_name', trimmedName)
    .single()

  if (existing) {
    // Rimuovi il voto
    await supabase.from('date_votes').delete().eq('id', existing.id)
  } else {
    // Aggiungi il voto
    const { error } = await supabase.from('date_votes').insert({
      event_id: eventId,
      date_option: dateOption,
      voter_name: trimmedName,
    })
    if (error?.code === '23505') {
      return { error: 'Hai già votato per questo giorno' }
    }
    if (error) return { error: 'Errore nel salvataggio del voto' }
  }

  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}
