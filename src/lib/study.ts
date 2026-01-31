import { supabase } from './supabase'
import type { Pathway, Lesson } from '@/types/database.types'

/**
 * Fetch all active pathways ordered by order_index
 */
export async function fetchPathways(): Promise<Pathway[]> {
  const { data, error } = await supabase
    .from('pathways')
    .select('*')
    .eq('is_active', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching pathways:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch a single pathway by slug
 */
export async function fetchPathwayBySlug(slug: string): Promise<Pathway | null> {
  const { data, error } = await supabase
    .from('pathways')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching pathway:', error)
    throw error
  }

  return data
}

/**
 * Fetch all lessons for a specific pathway, ordered by order_index
 */
export async function fetchPathwayLessons(pathwayId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('pathway_id', pathwayId)
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
 * Count total lessons in a pathway
 */
export async function countPathwayLessons(pathwayId: string): Promise<number> {
  const { count, error } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('pathway_id', pathwayId)

  if (error) {
    console.error('Error counting lessons:', error)
    return 0
  }

  return count || 0
}
