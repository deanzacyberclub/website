import { supabase } from './supabase'
import type { Lesson, UserProgress, LessonStatus } from '@/types/database.types'

/**
 * Calculate the status of a lesson based on user progress and prerequisites
 */
export function calculateLessonStatus(
  lesson: Lesson,
  userProgress: UserProgress[],
  allLessons: Lesson[]
): LessonStatus {
  // Find user's progress for this lesson
  const progress = userProgress.find((p) => p.lesson_id === lesson.id)

  if (progress) {
    return progress.status
  }

  // Check prerequisites
  if (lesson.prerequisite_lesson_ids && lesson.prerequisite_lesson_ids.length > 0) {
    const prereqsMet = lesson.prerequisite_lesson_ids.every((prereqId) => {
      const prereqProgress = userProgress.find((p) => p.lesson_id === prereqId)

      // Check if prerequisite is completed
      if (prereqProgress?.status !== 'completed') {
        return false
      }

      // If the prerequisite lesson has a required score, check if it was met
      const prereqLesson = allLessons.find((l) => l.id === prereqId)
      if (prereqLesson?.required_score && prereqProgress.quiz_score !== null && prereqProgress.quiz_score !== undefined) {
        return prereqProgress.quiz_score >= prereqLesson.required_score
      }

      return true
    })

    return prereqsMet ? 'unlocked' : 'locked'
  }

  // First lesson (order_index === 0) is always unlocked
  if (lesson.order_index === 0) {
    return 'unlocked'
  }

  // Check if previous lesson is completed (linear progression)
  const prevLesson = allLessons.find(
    (l) => l.pathway_id === lesson.pathway_id && l.order_index === lesson.order_index - 1
  )

  if (prevLesson) {
    const prevProgress = userProgress.find((p) => p.lesson_id === prevLesson.id)

    // Check if previous lesson is completed
    if (prevProgress?.status !== 'completed') {
      return 'locked'
    }

    // If previous lesson has a required score, check if it was met
    if (prevLesson.required_score && prevProgress.quiz_score !== null && prevProgress.quiz_score !== undefined) {
      return prevProgress.quiz_score >= prevLesson.required_score ? 'unlocked' : 'locked'
    }

    return 'unlocked'
  }

  return 'locked'
}

/**
 * Start a lesson (marks it as in_progress if unlocked)
 */
export async function startLesson(userId: string, lessonId: string): Promise<void> {
  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      onConflict: 'user_id,lesson_id'
    }
  )

  if (error) {
    console.error('Error starting lesson:', error)
    throw error
  }
}

/**
 * Update lesson progress
 */
export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  updates: Partial<UserProgress>
): Promise<void> {
  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      ...updates,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      onConflict: 'user_id,lesson_id'
    }
  )

  if (error) {
    console.error('Error updating lesson progress:', error)
    throw error
  }
}

/**
 * Complete a lesson
 */
export async function completeLesson(
  userId: string,
  lessonId: string,
  score?: number
): Promise<void> {
  const updates: Partial<UserProgress> = {
    status: 'completed',
    progress_percentage: 100,
    completed_at: new Date().toISOString()
  }

  if (score !== undefined) {
    updates.quiz_score = score

    // Update best score if this is better
    const existing = await supabase
      .from('user_progress')
      .select('quiz_best_score')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (!existing.data || !existing.data.quiz_best_score || score > existing.data.quiz_best_score) {
      updates.quiz_best_score = score
    }
  }

  await updateLessonProgress(userId, lessonId, updates)

  // Update pathway progress aggregates
  await updatePathwayProgress(userId, lessonId)
}

/**
 * Submit quiz answers and calculate score
 */
export async function submitQuiz(
  userId: string,
  lessonId: string,
  answers: Record<string, string | number>
): Promise<{ score: number; total: number; percentage: number }> {
  // Fetch the lesson to get quiz data
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('quiz_data')
    .eq('id', lessonId)
    .maybeSingle()

  if (lessonError || !lesson?.quiz_data) {
    throw new Error('Quiz not found')
  }

  const quizData = lesson.quiz_data as any
  const questions = quizData.questions || []

  // Calculate score
  let correctCount = 0
  questions.forEach((q: any) => {
    if (answers[q.id] === q.correct_answer) {
      correctCount++
    }
  })

  const percentage = Math.round((correctCount / questions.length) * 100)

  // Increment quiz attempts
  const { data: existing } = await supabase
    .from('user_progress')
    .select('quiz_attempts')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const attempts = (existing?.quiz_attempts || 0) + 1

  // Update progress with quiz results
  await updateLessonProgress(userId, lessonId, {
    quiz_answers: answers,
    quiz_attempts: attempts
  })

  // If passing score is met, complete the lesson
  if (percentage >= quizData.passing_score) {
    await completeLesson(userId, lessonId, percentage)
  } else {
    // Update score but don't mark as complete
    await updateLessonProgress(userId, lessonId, {
      quiz_score: percentage,
      status: 'in_progress'
    })
  }

  return {
    score: correctCount,
    total: questions.length,
    percentage
  }
}

/**
 * Update pathway progress aggregates when a lesson is completed
 */
async function updatePathwayProgress(userId: string, lessonId: string): Promise<void> {
  // Get the lesson to find the pathway
  const { data: lesson } = await supabase
    .from('lessons')
    .select('pathway_id')
    .eq('id', lessonId)
    .maybeSingle()

  if (!lesson) return

  // Count total lessons and completed lessons in this pathway
  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('pathway_id', lesson.pathway_id)

  const { count: completedLessons } = await supabase
    .from('user_progress')
    .select(`
      *,
      lessons!inner(pathway_id)
    `, { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('lessons.pathway_id', lesson.pathway_id)

  const completionPercentage = totalLessons
    ? Math.round(((completedLessons || 0) / totalLessons) * 100)
    : 0

  // Upsert pathway progress
  await supabase.from('pathway_progress').upsert(
    {
      user_id: userId,
      pathway_id: lesson.pathway_id,
      lessons_completed: completedLessons || 0,
      total_lessons: totalLessons || 0,
      completion_percentage: completionPercentage,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      onConflict: 'user_id,pathway_id'
    }
  )
}

/**
 * Update flashcard mastery for a specific card
 */
export async function updateFlashcardMastery(
  userId: string,
  lessonId: string,
  cardId: string,
  masteryLevel: number
): Promise<void> {
  // Get existing mastery data
  const { data: existing } = await supabase
    .from('user_progress')
    .select('flashcard_mastery')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const mastery = (existing?.flashcard_mastery as Record<string, number>) || {}
  mastery[cardId] = masteryLevel

  await updateLessonProgress(userId, lessonId, {
    flashcard_mastery: mastery,
    status: 'in_progress'
  })
}

/**
 * Mark all flashcards as completed if mastery threshold is met
 */
export async function checkFlashcardCompletion(
  userId: string,
  lessonId: string,
  totalCards: number
): Promise<void> {
  const { data: progress } = await supabase
    .from('user_progress')
    .select('flashcard_mastery')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const mastery = (progress?.flashcard_mastery as Record<string, number>) || {}
  const masteredCards = Object.values(mastery).filter((level) => level >= 3).length

  // If 80% of cards are mastered (level 3+), mark as complete
  if (masteredCards / totalCards >= 0.8) {
    await completeLesson(userId, lessonId)
  }
}
