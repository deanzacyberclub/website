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

// Study pathway types
export type LessonType = 'course' | 'workshop' | 'ctf' | 'quiz' | 'flashcard'
export type LessonStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed'
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

export interface Pathway {
  id: string
  slug: string
  title: string
  description: string
  icon?: string | null
  difficulty: Difficulty | null
  estimated_hours: number | null
  color: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  pathway_id: string
  slug: string
  title: string
  description: string
  type: LessonType
  order_index: number
  content?: LessonContent | null
  meeting_id?: string | null
  is_self_paced: boolean
  quiz_data?: QuizData | null
  flashcard_data?: FlashcardData | null
  prerequisite_lesson_ids?: string[] | null
  required_score?: number | null
  estimated_minutes: number | null
  difficulty: Difficulty | null
  topics: string[] | null
  resources?: Json | null
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  status: LessonStatus
  progress_percentage: number
  quiz_score?: number | null
  quiz_attempts: number
  quiz_best_score?: number | null
  quiz_answers?: Json | null
  flashcard_mastery?: Json | null
  started_at?: string | null
  completed_at?: string | null
  last_accessed_at?: string | null
  created_at: string
  updated_at: string
}

export interface PathwayProgress {
  id: string
  user_id: string
  pathway_id: string
  lessons_completed: number
  total_lessons: number
  completion_percentage: number
  current_streak_days: number
  longest_streak_days: number
  total_time_spent_minutes: number
  achievements: Json
  last_activity_at?: string | null
  created_at: string
  updated_at: string
}
