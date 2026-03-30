export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          device_id: string
          name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_id: string
          name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          name?: string
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          emoji: string
          category: string
          date: string | null
          date_end: string | null
          date_mode: string
          flexible_week_start: string | null
          location_name: string | null
          location_url: string | null
          image_url: string | null
          creator_name: string
          creator_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          emoji?: string
          category?: string
          date?: string | null
          date_end?: string | null
          date_mode?: string
          flexible_week_start?: string | null
          location_name?: string | null
          location_url?: string | null
          image_url?: string | null
          creator_name: string
          creator_token: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          emoji?: string
          category?: string
          date?: string | null
          date_end?: string | null
          date_mode?: string
          flexible_week_start?: string | null
          location_name?: string | null
          location_url?: string | null
          image_url?: string | null
          creator_name?: string
          creator_token?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          id: string
          event_id: string
          name: string
          status: 'confirmed' | 'maybe' | 'declined'
          token: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          status: 'confirmed' | 'maybe' | 'declined'
          token: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          status?: 'confirmed' | 'maybe' | 'declined'
          token?: string
          created_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          event_id: string
          name: string
          assigned_to: string | null
          amount: number | null
          receipt_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          assigned_to?: string | null
          amount?: number | null
          receipt_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          assigned_to?: string | null
          amount?: number | null
          receipt_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          event_id: string
          description: string
          amount: number
          paid_by: string
          split_among: string[]
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          description: string
          amount: number
          paid_by: string
          split_among: string[]
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          description?: string
          amount?: number
          paid_by?: string
          split_among?: string[]
          created_at?: string
        }
        Relationships: []
      }
      polls: {
        Row: {
          id: string
          event_id: string
          question: string
          type: 'single' | 'multiple'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          question: string
          type: 'single' | 'multiple'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          question?: string
          type?: 'single' | 'multiple'
          created_at?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
          votes: string[]
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          votes?: string[]
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          votes?: string[]
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          event_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          event_id: string
          type: '24h' | '2h'
          sent_at: string
        }
        Insert: {
          id?: string
          event_id: string
          type: '24h' | '2h'
          sent_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          type?: '24h' | '2h'
          sent_at?: string
        }
        Relationships: []
      }
      date_votes: {
        Row: {
          id: string
          event_id: string
          date_option: string
          voter_name: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          date_option: string
          voter_name: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          date_option?: string
          voter_name?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
