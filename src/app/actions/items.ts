'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addItem(eventId: string, name: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('items').insert({
    event_id: eventId,
    name: name.trim(),
  })
  if (error) return { error: "Errore nell'aggiunta dell'oggetto" }
  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}

export async function assignItem(itemId: string, assignedTo: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('items')
    .update({ assigned_to: assignedTo.trim() })
    .eq('id', itemId)
  if (error) return { error: "Errore nell'assegnazione" }
  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}

export async function unassignItem(itemId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('items')
    .update({ assigned_to: null })
    .eq('id', itemId)
  if (error) return { error: "Errore nella rimozione dell'assegnazione" }
  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}

export async function updateItemDetails(
  itemId: string,
  eventId: string,
  formData: FormData
) {
  const supabase = await createServerSupabaseClient()

  const amountStr = formData.get('amount') as string | null
  const amount = amountStr ? parseFloat(amountStr) : null
  const receiptFile = formData.get('receipt') as File | null
  const removeReceipt = formData.get('remove_receipt') === 'true'

  let receiptUrl: string | null | undefined = undefined

  if (removeReceipt) {
    receiptUrl = null
    const { data: files } = await supabase.storage
      .from('item-receipts')
      .list(`${eventId}/${itemId}`)
    if (files && files.length > 0) {
      await supabase.storage
        .from('item-receipts')
        .remove(files.map(f => `${eventId}/${itemId}/${f.name}`))
    }
  } else if (receiptFile && receiptFile.size > 0) {
    const ext = receiptFile.name.split('.').pop() || 'jpg'
    const filePath = `${eventId}/${itemId}/receipt.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('item-receipts')
      .upload(filePath, receiptFile, {
        contentType: receiptFile.type,
        upsert: true,
      })

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('item-receipts').getPublicUrl(filePath)
      receiptUrl = `${publicUrl}?t=${Date.now()}`
    }
  }

  const updateData: Record<string, unknown> = {}
  if (amount !== null) updateData.amount = amount
  else if (amountStr === '') updateData.amount = null
  if (receiptUrl !== undefined) updateData.receipt_url = receiptUrl

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', itemId)

    if (error) return { error: "Errore nell'aggiornamento" }
  }

  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}

export async function deleteItem(itemId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('items').delete().eq('id', itemId)
  if (error) return { error: "Errore nell'eliminazione" }
  revalidatePath('/evento/[slug]', 'page')
  return { success: true }
}
