export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MeetingType = 'workshop' | 'lecture' | 'ctf' | 'social' | 'general'
export type RegistrationType = 'open' | 'invite_only' | 'closed'
export type RegistrationStatus = 'registered' | 'waitlist' | 'invited' | 'attended' | 'cancelled'

export interface Announcement {
  id: string
  title: string
  content: string
  date: string
}

export interface Photo {
  id: string
  url: string
  caption?: string
}

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
          type: MeetingType
          featured: boolean
          topics: string[]
          announcements: Announcement[]
          photos: Photo[]
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
          type: MeetingType
          featured?: boolean
          topics?: string[]
          announcements?: Announcement[]
          photos?: Photo[]
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
          type?: MeetingType
          featured?: boolean
          topics?: string[]
          announcements?: Announcement[]
          photos?: Photo[]
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
      lessons: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          type: LessonType
          order_index: number
          content: Json | null
          meeting_id: string | null
          is_self_paced: boolean
          quiz_data: Json | null
          flashcard_data: Json | null
          estimated_minutes: number | null
          difficulty: Difficulty | null
          topics: string[] | null
          resources: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          type: LessonType
          order_index: number
          content?: Json | null
          meeting_id?: string | null
          is_self_paced?: boolean
          quiz_data?: Json | null
          flashcard_data?: Json | null
          estimated_minutes?: number | null
          difficulty?: Difficulty | null
          topics?: string[] | null
          resources?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string
          type?: LessonType
          order_index?: number
          content?: Json | null
          meeting_id?: string | null
          is_self_paced?: boolean
          quiz_data?: Json | null
          flashcard_data?: Json | null
          estimated_minutes?: number | null
          difficulty?: Difficulty | null
          topics?: string[] | null
          resources?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_meeting_id_fkey"
            columns: ["meeting_id"]
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          }
        ]
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

export type Meeting = Database['public']['Tables']['meetings']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type Registration = Database['public']['Tables']['registrations']['Row']

// Study lesson types
export type LessonType = 'course' | 'workshop' | 'ctf' | 'quiz' | 'flashcard'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced'

export interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  question: string
  options?: string[]
  correct_answer: string | number
  explanation?: string
  points: number
}

export interface FlashCard {
  id: string
  front: string
  back: string
  category?: string
  difficulty?: Difficulty
}

export interface LessonContent {
  markdown?: string
  video_url?: string | null
  resources?: Resource[]
}

export interface QuizData {
  questions: QuizQuestion[]
  passing_score: number
  time_limit_minutes?: number
}

export interface FlashcardData {
  cards: FlashCard[]
}

// Type-safe lesson type with proper JSONB casting
export interface Lesson extends Omit<Database['public']['Tables']['lessons']['Row'], 'content' | 'quiz_data' | 'flashcard_data'> {
  content?: LessonContent | null
  quiz_data?: QuizData | null
  flashcard_data?: FlashcardData | null
}

// CTF Team Types
export interface CTFTeam {
  id: string
  name: string
  invite_code: string
  captain_id: string
  created_at: string
  invite_expires_at?: string | null
  invite_max_uses?: number | null
  invite_uses_count?: number
}

export interface CTFTeamMember {
  id: string
  team_id: string
  user_id: string
  joined_at: string
  // Joined data
  user?: {
    id: string
    display_name: string
    photo_url: string | null
  }
}

export interface CTFSubmission {
  id: string
  team_id: string
  challenge_id: string
  submitted_flag: string
  is_correct: boolean
  points_awarded: number
  submitted_at: string
  submitted_by: string
  // Joined data
  user?: {
    id: string
    display_name: string
  }
}

export interface CTFTeamWithMembers extends CTFTeam {
  members: CTFTeamMember[]
  captain?: {
    id: string
    display_name: string
    photo_url: string | null
  }
}

export interface LeaderboardEntry {
  team_id: string
  team_name: string
  total_points: number
  beast_solves: number
  hard_solves: number
  medium_solves: number
  easy_solves: number
  total_solves: number
  incorrect_attempts: number
  last_solve_at: string | null
  members: {
    id: string
    display_name: string
    photo_url: string | null
  }[]
}
