'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPoll(
  eventId: string,
  question: string,
  type: 'single' | 'multiple',
  options: string[]
) {
  const supabase = await createServerSupabaseClient()

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({ event_id: eventId, question: question.trim(), type })
    .select('id')
    .single()

  if (pollError || !poll) return { error: 'Errore nella creazione del sondaggio' }

  const optionsData = options
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
    .map((text) => ({ poll_id: poll.id, text }))

  const { error: optError } = await supabase.from('poll_options').insert(optionsData)

  if (optError) return { error: "Errore nell'aggiunta delle opzioni" }

  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}

export async function votePoll(
  optionId: string,
  voterName: string,
  pollType: 'single' | 'multiple',
  pollId: string
) {
  const supabase = await createServerSupabaseClient()
  const trimmedName = voterName.trim()

  if (!trimmedName) return { error: 'Inserisci il tuo nome per votare' }

  if (pollType === 'single') {
    // Rimuovi il voto precedente da tutte le opzioni di questo poll
    const { data: allOptions } = await supabase
      .from('poll_options')
      .select('id, votes')
      .eq('poll_id', pollId)

    if (allOptions) {
      for (const opt of allOptions) {
        if (opt.votes.includes(trimmedName)) {
          const newVotes = opt.votes.filter((v: string) => v !== trimmedName)
          await supabase.from('poll_options').update({ votes: newVotes }).eq('id', opt.id)
        }
      }
    }
  }

  // Leggi lo stato attuale dell'opzione selezionata
  const { data: option } = await supabase
    .from('poll_options')
    .select('votes')
    .eq('id', optionId)
    .single()

  if (!option) return { error: 'Opzione non trovata' }

  let newVotes: string[]
  if (option.votes.includes(trimmedName)) {
    // Toggle: rimuovi se già votato (solo per multipla; per singola il blocco sopra ha già rimosso)
    newVotes = option.votes.filter((v: string) => v !== trimmedName)
  } else {
    newVotes = [...option.votes, trimmedName]
  }

  const { error } = await supabase
    .from('poll_options')
    .update({ votes: newVotes })
    .eq('id', optionId)

  if (error) return { error: 'Errore nel salvataggio del voto' }

  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}

export async function deletePoll(pollId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('polls').delete().eq('id', pollId)
  if (error) return { error: "Errore nell'eliminazione del sondaggio" }
  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}
