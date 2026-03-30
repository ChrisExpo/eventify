'use client'

import { cn } from '@/lib/utils'

const EVENT_EMOJIS = [
  '🎉', '🔥', '🍽️', '🏔️', '⚽', '🎂',
  '🎊', '🍕', '🏖️', '🎮', '🎁', '🎄',
  '🥳', '🍖', '🌊', '🏃', '💐', '🎃',
  '🎵', '🍝', '⛷️', '🏀', '❤️', '🎆',
  '🪩', '🥂', '🏕️', '🚴', '🎈', '✨',
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  className?: string
}

const EmojiPicker = ({ value, onChange, className }: EmojiPickerProps) => {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Emoji selezionata */}
      <div
        aria-label={`Emoji selezionata: ${value || 'nessuna'}`}
        className={cn(
          'flex items-center justify-center w-20 h-20 rounded-2xl',
          'border-2 transition-colors duration-150',
          value
            ? 'border-primary/40 bg-primary/10'
            : 'border-outline-variant/20 bg-surface-container-low'
        )}
      >
        <span className="text-5xl leading-none" role="img" aria-hidden="true">
          {value || '✨'}
        </span>
      </div>

      {/* Griglia emoji */}
      <div
        className="bg-surface-container rounded-[1rem] p-3 w-full"
        role="group"
        aria-label="Scegli un'emoji per l'evento"
      >
        <div className="grid grid-cols-6 gap-1">
          {EVENT_EMOJIS.map((emoji) => {
            const isSelected = emoji === value
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange(emoji)}
                aria-label={`Seleziona ${emoji}`}
                aria-pressed={isSelected}
                className={cn(
                  'flex items-center justify-center w-full aspect-square rounded-xl',
                  'text-2xl leading-none transition-all duration-100',
                  'hover:scale-110 focus-visible:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary/50',
                  isSelected
                    ? 'bg-primary/10 ring-2 ring-primary neon-glow-primary scale-105'
                    : 'hover:bg-surface-container-high'
                )}
              >
                <span role="img" aria-hidden="true">
                  {emoji}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { EmojiPicker }
export type { EmojiPickerProps }
