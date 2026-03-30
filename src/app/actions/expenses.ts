'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addExpense(
  eventId: string,
  description: string,
  amount: number,
  paidBy: string,
  splitAmong: string[]
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('expenses').insert({
    event_id: eventId,
    description: description.trim(),
    amount,
    paid_by: paidBy.trim(),
    split_among: splitAmong,
  })

  if (error) return { error: "Errore nell'aggiunta della spesa" }
  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
  if (error) return { error: "Errore nell'eliminazione" }
  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}
