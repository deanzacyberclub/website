import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { calculateLessonStatus, startLesson } from '@/lib/progress'
import type { Lesson, UserProgress } from '@/types/database.types'
import CourseContent from './CourseContent'
import WorkshopLink from './WorkshopLink'
import QuizComponent from './QuizComponent'
import FlashcardComponent from './FlashcardComponent'

interface LessonModalProps {
  lesson: Lesson
  allLessons: Lesson[]
  userProgress: UserProgress[]
  onClose: () => void
}

function LessonModal({ lesson, allLessons, userProgress, onClose }: LessonModalProps) {
  const { user } = useAuth()
  const [isStarting, setIsStarting] = useState(false)

  const lessonStatus = calculateLessonStatus(lesson, userProgress, allLessons)
  const progress = userProgress.find((p) => p.lesson_id === lesson.id)

  // Auto-start lesson when opened if unlocked and not started
  useEffect(() => {
    async function autoStart() {
      if (user && lessonStatus === 'unlocked' && !progress) {
        setIsStarting(true)
        try {
          await startLesson(user.id, lesson.id)
        } catch (error) {
          console.error('Failed to start lesson:', error)
        }
        setIsStarting(false)
      }
    }

    autoStart()
  }, [user, lesson.id, lessonStatus, progress])

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden terminal-window">
        {/* Header */}
        <div className="terminal-header sticky top-0 z-10">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="ml-4 text-xs font-terminal flex-1">{lesson.slug}</span>
          <button
            onClick={onClose}
            className="ml-auto mr-2 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Close lesson"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-matrix" />
          </button>
        </div>

        {/* Body */}
        <div className="terminal-body overflow-y-auto max-h-[calc(90vh-60px)]">
          {/* Lesson Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-2xl font-bold text-matrix">{lesson.title}</h2>
              {lesson.difficulty && (
                <span
                  className={`px-2 py-1 rounded text-xs font-terminal border ${
                    lesson.difficulty === 'easy'
                      ? 'bg-matrix/20 text-matrix border-matrix/50'
                      : lesson.difficulty === 'medium'
                        ? 'bg-hack-orange/20 text-hack-orange border-hack-orange/50'
                        : 'bg-hack-red/20 text-hack-red border-hack-red/50'
                  }`}
                >
                  {lesson.difficulty}
                </span>
              )}
            </div>

            <p className="text-gray-400 font-terminal text-sm mb-4">{lesson.description}</p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 text-xs font-terminal text-gray-500">
              {lesson.estimated_minutes && (
                <span>
                  Est. Time: <span className="text-matrix">{lesson.estimated_minutes} min</span>
                </span>
              )}
              {lesson.topics && lesson.topics.length > 0 && (
                <div className="flex items-center gap-2">
                  Topics:
                  {lesson.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 bg-terminal-alt border border-matrix/30 rounded text-matrix"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            {progress && (
              <div className="mt-4 p-3 bg-terminal-alt rounded border border-matrix/30">
                <div className="flex items-center justify-between mb-2 text-xs font-terminal">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-matrix">{progress.progress_percentage}%</span>
                </div>
                <div className="h-1.5 bg-terminal-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-matrix transition-all duration-300"
                    style={{ width: `${progress.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lesson Content Based on Type */}
          {isStarting && (
            <div className="text-center py-12 text-gray-500 font-terminal">Starting lesson...</div>
          )}

          {!isStarting && lesson.type === 'course' && (
            <CourseContent lesson={lesson} progress={progress} onComplete={onClose} />
          )}

          {!isStarting && lesson.type === 'workshop' && (
            <WorkshopLink lesson={lesson} progress={progress} onComplete={onClose} />
          )}

          {!isStarting && lesson.type === 'quiz' && (
            <QuizComponent lesson={lesson} progress={progress} onComplete={onClose} />
          )}

          {!isStarting && lesson.type === 'flashcard' && (
            <FlashcardComponent lesson={lesson} progress={progress} onComplete={onClose} />
          )}

          {!isStarting && lesson.type === 'ctf' && (
            <div className="p-6 bg-terminal-alt rounded border border-matrix/30">
              <h3 className="text-lg font-bold text-matrix mb-3">CTF Challenge</h3>
              <p className="text-gray-400 font-terminal text-sm mb-4">
                This is a capture-the-flag challenge. Visit the CTF page to participate.
              </p>
              <a
                href="/ctf"
                className="btn-hack-filled inline-block px-6 py-2 text-sm font-terminal"
              >
                Go to CTF Page
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LessonModal
