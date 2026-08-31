export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Resource {
  id: string
  title: string
  url: string
  type: 'slides' | 'video' | 'link' | 'file'
}

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
          linked_accounts: Json
          is_officer: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          student_id?: string | null
          photo_url?: string | null
          linked_accounts?: Json
          is_officer?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          student_id?: string | null
          photo_url?: string | null
          linked_accounts?: Json
          is_officer?: boolean
          created_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          date: string
          time: string
          location: string
          topics: string[]
          resources: Resource[]
          secret_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          date: string
          time: string
          location: string
          topics?: string[]
          resources?: Resource[]
          secret_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string
          date?: string
          time?: string
          location?: string
          topics?: string[]
          resources?: Resource[]
          secret_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          student_id: string
          checked_in_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string | null
          student_id: string
          checked_in_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          student_id?: string
          checked_in_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      meetings_public: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          date: string
          time: string
          location: string
          topics: string[]
          resources: Resource[]
          created_at: string
          updated_at: string
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          id: string
          display_name: string
          photo_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_dashboard_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_meeting_page_data: {
        Args: { p_slug: string }
        Returns: Json
      }
      get_officer_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_my_profile: {
        Args: Record<PropertyKey, never>
        Returns: Json | null
      }
      verify_officer_status: { Args: Record<PropertyKey, never>; Returns: boolean }
      get_all_users_for_officers: { Args: Record<PropertyKey, never>; Returns: Json }
      get_user_details_for_officers: { Args: { target_user_id: string }; Returns: Json }
      get_all_meetings_for_officers: { Args: Record<PropertyKey, never>; Returns: Json }
      get_meeting_with_secrets: { Args: { meeting_slug: string }; Returns: Json }
      verify_meeting_secret_code: { Args: { secret_code_input: string }; Returns: Json }
      create_meeting_for_officers: {
        Args: {
          p_slug: string
          p_title: string
          p_description: string
          p_date: string
          p_time: string
          p_location: string
          p_topics: string[]
          p_secret_code: string | null
          p_resources?: Json
        }
        Returns: Json
      }
      officer_update_meeting: {
        Args: {
          meeting_id: string
          p_slug: string
          p_title: string
          p_description: string
          p_date: string
          p_time: string
          p_location: string
          p_topics: string[]
          p_secret_code: string | null
          p_resources: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Meeting = Database['public']['Tables']['meetings']['Row']
export type MeetingPublic = Database['public']['Views']['meetings_public']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
