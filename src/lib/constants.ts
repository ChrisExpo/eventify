export const EVENT_CATEGORIES = [
  { value: 'grigliata', label: 'Grigliata', emoji: '🔥' },
  { value: 'cena', label: 'Cena', emoji: '🍽️' },
  { value: 'gita', label: 'Gita', emoji: '🏔️' },
  { value: 'sport', label: 'Sport', emoji: '⚽' },
  { value: 'compleanno', label: 'Compleanno', emoji: '🎂' },
  { value: 'festa', label: 'Festa', emoji: '🎉' },
  { value: 'altro', label: 'Altro', emoji: '📌' },
] as const

export const PARTICIPANT_STATUS_CONFIG = {
  confirmed: { label: 'Confermato', emoji: '✅', color: 'sage' },
  maybe: { label: 'Forse', emoji: '🤔', color: 'ocean' },
  declined: { label: 'Non viene', emoji: '❌', color: 'terracotta' },
} as const

export const DEFAULT_EMOJI = '🎉'

export const EVERYONE_ASSIGNMENT = '__tutti__'
export const EVERYONE_LABEL = 'Tutti'
