export type ParticipantStatus = 'confirmed' | 'maybe' | 'declined'
export type PollType = 'single' | 'multiple'
export type DateMode = 'fixed' | 'flexible'
export type EventStatus = 'draft' | 'confirmed'
export type EventCategory =
  | 'grigliata'
  | 'cena'
  | 'gita'
  | 'sport'
  | 'compleanno'
  | 'festa'
  | 'altro'

// Re-export Database type for consumers that need the full schema
export type { Database } from '@/lib/supabase/types'

// Convenience Row aliases — use these in components instead of the verbose Database path
import type { Database as DB } from '@/lib/supabase/types'

export type User = DB['public']['Tables']['users']['Row']
export type Event = DB['public']['Tables']['events']['Row']
export type Participant = DB['public']['Tables']['participants']['Row']
export type Item = DB['public']['Tables']['items']['Row']
export type Expense = DB['public']['Tables']['expenses']['Row']
export type Poll = DB['public']['Tables']['polls']['Row']
export type PollOption = DB['public']['Tables']['poll_options']['Row']
export type DateVote = DB['public']['Tables']['date_votes']['Row']

// Insert helpers
export type EventInsert = DB['public']['Tables']['events']['Insert']
export type ParticipantInsert = DB['public']['Tables']['participants']['Insert']
export type ItemInsert = DB['public']['Tables']['items']['Insert']
export type ExpenseInsert = DB['public']['Tables']['expenses']['Insert']
export type PollInsert = DB['public']['Tables']['polls']['Insert']
export type PollOptionInsert = DB['public']['Tables']['poll_options']['Insert']

// Update helpers
export type EventUpdate = DB['public']['Tables']['events']['Update']
export type ParticipantUpdate = DB['public']['Tables']['participants']['Update']
export type ItemUpdate = DB['public']['Tables']['items']['Update']
