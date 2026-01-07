import type { Lesson, LessonStatus } from '@/types/database.types'
import { Lock, BookOpen, Users, Flag, CheckCircle, CreditCard } from 'lucide-react'

interface LessonNodeProps {
  lesson: Lesson
  status: LessonStatus
  onClick: () => void
  score?: number | null
}

function LessonNode({ lesson, status, onClick, score }: LessonNodeProps) {
  const iconByType = {
    course: BookOpen,
    workshop: Users,
    ctf: Flag,
    quiz: CheckCircle,
    flashcard: CreditCard
  }

  const Icon = iconByType[lesson.type] || BookOpen

  const nodeStyles = {
    locked: 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed',
    unlocked:
      'bg-terminal-alt border-matrix/50 hover:border-matrix hover:scale-110 cursor-pointer transition-all',
    in_progress:
      'bg-hack-cyan/10 border-hack-cyan animate-pulse cursor-pointer transition-all hover:scale-110',
    completed:
      'bg-matrix/20 border-matrix cursor-pointer transition-all hover:scale-110'
  }

  const handleClick = () => {
    if (status !== 'locked') {
      onClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && status !== 'locked') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 flex flex-col items-center justify-center ${nodeStyles[status]}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={status !== 'locked' ? 0 : -1}
      aria-label={`${lesson.title} - ${status}`}
    >
      {/* Lock Icon for Locked Lessons */}
      {status === 'locked' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-8 h-8 text-gray-600" />
        </div>
      )}

      {/* Lesson Icon for Unlocked Lessons */}
      {status !== 'locked' && (
        <>
          <Icon
            className={`w-8 h-8 md:w-10 md:h-10 ${
              status === 'completed'
                ? 'text-matrix'
                : status === 'in_progress'
                  ? 'text-hack-cyan'
                  : 'text-gray-400'
            }`}
          />

          {/* Lesson Title (truncated) */}
          <div className="text-xs md:text-sm font-terminal mt-2 text-center px-2 max-w-full truncate">
            {lesson.title}
          </div>

          {/* Checkmark for Completed */}
          {status === 'completed' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-matrix rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-terminal-bg" />
            </div>
          )}

          {/* Score Badge for Quiz */}
          {status === 'completed' && lesson.type === 'quiz' && score !== null && score !== undefined && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-hack-cyan rounded-full flex items-center justify-center border-2 border-terminal-bg">
              <span className="text-xs font-bold text-terminal-bg">{score}%</span>
            </div>
          )}
        </>
      )}

      {/* Difficulty Badge */}
      {status !== 'locked' && lesson.difficulty && (
        <div className="absolute -top-2 -left-2">
          <span
            className={`text-xs font-terminal px-1.5 py-0.5 rounded ${
              lesson.difficulty === 'easy'
                ? 'bg-matrix/20 text-matrix border border-matrix/50'
                : lesson.difficulty === 'medium'
                  ? 'bg-hack-orange/20 text-hack-orange border border-hack-orange/50'
                  : 'bg-hack-red/20 text-hack-red border border-hack-red/50'
            }`}
          >
            {lesson.difficulty[0].toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}

export default LessonNode
