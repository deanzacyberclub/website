export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          student_id: string | null
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          student_id?: string | null
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          student_id?: string | null
          photo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
