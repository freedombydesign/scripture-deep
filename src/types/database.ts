export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: 'teacher' | 'student'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          role?: 'teacher' | 'student'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: 'teacher' | 'student'
          created_at?: string
        }
      }
      studies: {
        Row: {
          id: string
          author_id: string
          title: string
          subtitle: string | null
          slug: string
          key_verse_ref: string | null
          theme: string | null
          status: 'draft' | 'published'
          release_mode: 'all_open' | 'release_as_we_go'
          published_at: string | null
          study_notes: string | null
          reflection_questions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          subtitle?: string | null
          slug: string
          key_verse_ref?: string | null
          theme?: string | null
          status?: 'draft' | 'published'
          release_mode?: 'all_open' | 'release_as_we_go'
          published_at?: string | null
          study_notes?: string | null
          reflection_questions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          subtitle?: string | null
          slug?: string
          key_verse_ref?: string | null
          theme?: string | null
          status?: 'draft' | 'published'
          release_mode?: 'all_open' | 'release_as_we_go'
          published_at?: string | null
          study_notes?: string | null
          reflection_questions?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          study_id: string
          position: number
          heading: string
          body: Json
          reflection_questions: string[] | null
          released: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          study_id: string
          position: number
          heading: string
          body: Json
          reflection_questions?: string[] | null
          released?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          study_id?: string
          position?: number
          heading?: string
          body?: Json
          reflection_questions?: string[] | null
          released?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          section_id: string
          body: string
          shared_with_teacher: boolean
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          section_id: string
          body?: string
          shared_with_teacher?: boolean
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_id?: string
          body?: string
          shared_with_teacher?: boolean
          updated_at?: string
          created_at?: string
        }
      }
      verses: {
        Row: {
          id: number
          book: string
          chapter: number
          verse: number
          text: string
        }
        Insert: {
          id?: number
          book: string
          chapter: number
          verse: number
          text: string
        }
        Update: {
          id?: number
          book?: string
          chapter?: number
          verse?: number
          text?: string
        }
      }
      word_studies: {
        Row: {
          id: string
          study_id: string
          section_id: string | null
          english_word: string
          verse_reference: string
          language: 'Hebrew' | 'Greek'
          original_word: string[]
          transliteration: string | null
          strongs: { number: string; blb_url: string }[]
          meaning: string | null
          what_it_changes: string | null
          cross_references: string[]
          needs_check_on_blb: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          study_id: string
          section_id?: string | null
          english_word: string
          verse_reference: string
          language: 'Hebrew' | 'Greek'
          original_word?: string[]
          transliteration?: string | null
          strongs?: { number: string; blb_url: string }[]
          meaning?: string | null
          what_it_changes?: string | null
          cross_references?: string[]
          needs_check_on_blb?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          study_id?: string
          section_id?: string | null
          english_word?: string
          verse_reference?: string
          language?: 'Hebrew' | 'Greek'
          original_word?: string[]
          transliteration?: string | null
          strongs?: { number: string; blb_url: string }[]
          meaning?: string | null
          what_it_changes?: string | null
          cross_references?: string[]
          needs_check_on_blb?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      verse_reviews: {
        Row: {
          id: string
          study_id: string
          verse_reference: string
          reviewed: boolean
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          study_id: string
          verse_reference: string
          reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          study_id?: string
          verse_reference?: string
          reviewed?: boolean
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'teacher' | 'student'
      study_status: 'draft' | 'published'
      release_mode: 'all_open' | 'release_as_we_go'
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience exports
export type User = Tables<'users'>
export type Study = Tables<'studies'>
export type Section = Tables<'sections'>
export type Note = Tables<'notes'>
export type Verse = Tables<'verses'>
export type WordStudy = Tables<'word_studies'>
export type VerseReview = Tables<'verse_reviews'>
