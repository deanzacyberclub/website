import { supabase } from './supabase'
import type { Lesson } from '@/types/database.types'

/**
 * Fetch all lessons ordered by order_index
 */
export async function fetchLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('order_index')

  if (error) {
    console.error('Error fetching lessons:', error)
    throw error
  }

  return (data as Lesson[]) || []
}

/**
 * Fetch a single lesson by ID
 */
export async function fetchLessonById(lessonId: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching lesson:', error)
    throw error
  }

  return data as Lesson | null
}

/**
 * Fetch the meeting associated with a workshop lesson
 */
export async function fetchLessonMeeting(meetingId: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching lesson meeting:', error)
    throw error
  }

  return data
}

/**
 * Count total lessons
 */
export async function countLessons(): Promise<number> {
  const { count, error } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error counting lessons:', error)
    return 0
  }

  return count || 0
}
