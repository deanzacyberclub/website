export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RegistrationType = 'open' | 'invite_only' | 'closed'
export type RegistrationStatus = 'registered' | 'waitlist' | 'invited' | 'attended' | 'cancelled'

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
          featured: boolean
          topics: string[]
          resources: Resource[]
          secret_code: string | null
          registration_type: RegistrationType
          registration_capacity: number | null
          invite_code: string | null
          invite_form_url: string | null
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
          featured?: boolean
          topics?: string[]
          resources?: Resource[]
          secret_code?: string | null
          registration_type?: RegistrationType
          registration_capacity?: number | null
          invite_code?: string | null
          invite_form_url?: string | null
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
          featured?: boolean
          topics?: string[]
          resources?: Resource[]
          secret_code?: string | null
          registration_type?: RegistrationType
          registration_capacity?: number | null
          invite_code?: string | null
          invite_form_url?: string | null
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
          user_id: string
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
      registrations: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
          status: RegistrationStatus
          invite_code_used: string | null
          registered_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
          status: RegistrationStatus
          invite_code_used?: string | null
          registered_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
          status?: RegistrationStatus
          invite_code_used?: string | null
          registered_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_meeting_id_fkey"
            columns: ["meeting_id"]
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_user_id_fkey"
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
          featured: boolean
          topics: string[]
          resources: Resource[]
          registration_type: RegistrationType
          registration_capacity: number | null
          invite_form_url: string | null
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
      // Existing officer + meeting RPCs (kept for reference)
      verify_officer_status: { Args: Record<PropertyKey, never>; Returns: boolean }
      get_all_users_for_officers: { Args: Record<PropertyKey, never>; Returns: Json }
      get_user_details_for_officers: { Args: { target_user_id: string }; Returns: Json }
      get_all_meetings_for_officers: { Args: Record<PropertyKey, never>; Returns: Json }
      get_meeting_with_secrets: { Args: { meeting_slug: string }; Returns: Json }
      // ... other existing functions omitted for brevity
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
export type Registration = Database['public']['Tables']['registrations']['Row']
