'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateSlug, generateToken } from '@/lib/utils'

export async function createEvent(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const slug = generateSlug()
  const creatorToken = generateToken()

  const title = formData.get('title') as string
  const emoji = (formData.get('emoji') as string) || '🎉'
  const category = formData.get('category') as string
  const dateRaw = formData.get('date') as string | null
  const dateEndRaw = formData.get('date_end') as string | null
  const date = dateRaw && dateRaw.trim() !== '' ? dateRaw.trim() : null
  const dateEnd = dateEndRaw && dateEndRaw.trim() !== '' ? dateEndRaw.trim() : null
  const dateMode = (formData.get('date_mode') as string) || 'fixed'
  const flexibleWeekStartRaw = formData.get('flexible_week_start') as string | null
  const flexibleWeekStart =
    flexibleWeekStartRaw && flexibleWeekStartRaw.trim() !== ''
      ? flexibleWeekStartRaw.trim()
      : null
  const locationName = formData.get('location_name') as string | null
  const locationUrl = formData.get('location_url') as string | null
  const description = formData.get('description') as string | null
  const creatorName = formData.get('creator_name') as string

  if (!title || !creatorName) {
    return { error: 'Compila tutti i campi obbligatori' }
  }

  // Gestione immagine
  let imageUrl: string | null = null
  const imageFile = formData.get('image') as File | null

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop() || 'jpg'
    const filePath = `${slug}/cover.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, imageFile, {
        contentType: imageFile.type,
        upsert: true,
      })

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('event-images').getPublicUrl(filePath)
      imageUrl = publicUrl
    }
  }

  const { error } = await supabase.from('events').insert({
    slug,
    title,
    emoji,
    category: category || 'altro',
    date,
    date_end: dateEnd,
    date_mode: dateMode,
    flexible_week_start: flexibleWeekStart,
    location_name: locationName || null,
    location_url: locationUrl || null,
    description: description || null,
    creator_name: creatorName,
    creator_token: creatorToken,
    image_url: imageUrl,
  })

  if (error) {
    return { error: "Errore nella creazione dell'evento. Riprova." }
  }

  return { slug, creatorToken }
}

export async function updateEvent(
  slug: string,
  creatorToken: string,
  formData: FormData
) {
  const supabase = await createServerSupabaseClient()

  // Gestione immagine
  const imageFile = formData.get('image') as File | null
  const removeImage = formData.get('remove_image') === 'true'
  // undefined = non toccare il campo esistente
  let imageUrl: string | null | undefined = undefined

  if (removeImage) {
    imageUrl = null
    // Prova a eliminare tutti i file cover dal percorso slug
    // Supabase Storage non supporta wildcard su remove, quindi listiamo prima
    const { data: fileList } = await supabase.storage
      .from('event-images')
      .list(slug)

    if (fileList && fileList.length > 0) {
      const paths = fileList.map((f) => `${slug}/${f.name}`)
      await supabase.storage.from('event-images').remove(paths)
    }
  } else if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop() || 'jpg'
    const filePath = `${slug}/cover.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, imageFile, {
        contentType: imageFile.type,
        upsert: true,
      })

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('event-images').getPublicUrl(filePath)
      imageUrl = publicUrl
    }
  }

  const updateDateRaw = formData.get('date') as string | null
  const updateDateEndRaw = formData.get('date_end') as string | null
  const updateDateMode = (formData.get('date_mode') as string) || 'fixed'
  const updateFlexibleWeekStartRaw = formData.get('flexible_week_start') as string | null
  const updateFlexibleWeekStart =
    updateFlexibleWeekStartRaw && updateFlexibleWeekStartRaw.trim() !== ''
      ? updateFlexibleWeekStartRaw.trim()
      : null

  const updateData: Record<string, unknown> = {
    title: formData.get('title') as string,
    emoji: (formData.get('emoji') as string) || '🎉',
    category: (formData.get('category') as string) || 'altro',
    date: updateDateRaw && updateDateRaw.trim() !== '' ? updateDateRaw.trim() : null,
    date_end: updateDateEndRaw && updateDateEndRaw.trim() !== '' ? updateDateEndRaw.trim() : null,
    date_mode: updateDateMode,
    flexible_week_start: updateFlexibleWeekStart,
    location_name: (formData.get('location_name') as string) || null,
    location_url: (formData.get('location_url') as string) || null,
    description: (formData.get('description') as string) || null,
  }

  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl
  }

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('slug', slug)
    .eq('creator_token', creatorToken)
    .select()
    .single()

  if (!data) return { error: 'Non autorizzato o evento non trovato' }
  if (error) return { error: "Errore nell'aggiornamento" }

  revalidatePath(`/evento/${slug}`)
  return { success: true }
}

export async function deleteEvent(slug: string, creatorToken: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('slug', slug)
    .eq('creator_token', creatorToken)

  if (error) return { error: "Errore nell'eliminazione" }

  return { success: true, redirect: '/' }
}
