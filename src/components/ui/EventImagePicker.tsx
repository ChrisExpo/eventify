'use client'

import { useState, useRef } from 'react'
import { Smile, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmojiPicker } from '@/components/ui/EmojiPicker'

type Mode = 'emoji' | 'photo'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface EventImagePickerProps {
  emoji: string
  onEmojiChange: (emoji: string) => void
  imageFile: File | null
  imagePreview: string | null
  onImageChange: (file: File | null) => void
  onImageRemove: () => void
}

export function EventImagePicker({
  emoji,
  onEmojiChange,
  imageFile: _imageFile,
  imagePreview,
  onImageChange,
  onImageRemove,
}: EventImagePickerProps) {
  const [mode, setMode] = useState<Mode>(imagePreview ? 'photo' : 'emoji')
  const [fileError, setFileError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null

    // Reset per consentire di caricare lo stesso file di nuovo
    e.target.value = ''

    if (!file) return

    setFileError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Formato non supportato. Usa JPG, PNG, WebP o GIF.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Il file supera i 5 MB consentiti.')
      return
    }

    onImageChange(file)
    setMode('photo')
  }

  function handleEmojiChange(newEmoji: string) {
    onEmojiChange(newEmoji)
    // Selezionare un'emoji rimuove l'immagine
    if (imagePreview) {
      onImageRemove()
    }
  }

  function handleRemove() {
    onImageRemove()
    setFileError(null)
  }

  return (
    <div>
      {/* Tab toggle */}
      <div
        role="tablist"
        aria-label="Scegli tra emoji e foto"
        className="flex gap-1 p-1 bg-surface-container-low rounded-full mb-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'emoji'}
          aria-controls="panel-emoji"
          id="tab-emoji"
          className={cn(
            'flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all',
            mode === 'emoji'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
          onClick={() => setMode('emoji')}
        >
          <Smile size={16} className="inline mr-1.5" aria-hidden="true" />
          Emoji
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'photo'}
          aria-controls="panel-photo"
          id="tab-photo"
          className={cn(
            'flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all',
            mode === 'photo'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
          onClick={() => setMode('photo')}
        >
          <ImagePlus size={16} className="inline mr-1.5" aria-hidden="true" />
          Foto
        </button>
      </div>

      {/* Pannello Emoji */}
      <div
        id="panel-emoji"
        role="tabpanel"
        aria-labelledby="tab-emoji"
        hidden={mode !== 'emoji'}
      >
        <EmojiPicker value={emoji} onChange={handleEmojiChange} />
      </div>

      {/* Pannello Foto */}
      <div
        id="panel-photo"
        role="tabpanel"
        aria-labelledby="tab-photo"
        hidden={mode !== 'photo'}
      >
        {imagePreview ? (
          /* Preview immagine */
          <div className="relative rounded-2xl overflow-hidden aspect-video">
            <img
              src={imagePreview}
              alt="Anteprima immagine evento"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Rimuovi immagine"
              className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center text-on-surface hover:bg-error/80 hover:text-white transition-all"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          /* Area upload */
          <div>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-8 text-center hover:border-primary/40 transition-all">
                <ImagePlus
                  size={40}
                  className="mx-auto text-on-surface-variant mb-3"
                  aria-hidden="true"
                />
                <p className="text-on-surface font-medium">Carica una foto</p>
                <p className="text-on-surface-variant text-sm mt-1">
                  JPG, PNG, WebP &bull; Max 5&nbsp;MB
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                aria-label="Carica immagine evento"
                onChange={handleFileSelect}
              />
            </label>

            {fileError && (
              <p
                role="alert"
                className="mt-2 text-xs text-error font-medium"
              >
                {fileError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
