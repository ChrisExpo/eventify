export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato non supportato. Usa JPG, PNG, WebP o GIF.'
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "L'immagine è troppo grande. Massimo 5MB."
  }
  return null
}

export function hasEventImage(event: { image_url: string | null }): boolean {
  return !!event.image_url
}
