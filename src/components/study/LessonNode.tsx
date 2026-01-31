import type { Lesson } from '@/types/database.types'
import { BookOpen, Users, Flag, CheckCircle, CreditCard } from 'lucide-react'

interface LessonNodeProps {
  lesson: Lesson
  onClick: () => void
}

function LessonNode({ lesson, onClick }: LessonNodeProps) {
  const iconByType = {
    course: BookOpen,
    workshop: Users,
    ctf: Flag,
    quiz: CheckCircle,
    flashcard: CreditCard
  }

  const Icon = iconByType[lesson.type] || BookOpen

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 flex flex-col items-center justify-center bg-terminal-alt border-matrix/50 hover:border-matrix hover:scale-110 cursor-pointer transition-all"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={lesson.title}
    >
      <Icon className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />

      {/* Lesson Title (truncated) */}
      <div className="text-xs md:text-sm font-terminal mt-2 text-center px-2 max-w-full truncate">
        {lesson.title}
      </div>

      {/* Difficulty Badge */}
      {lesson.difficulty && (
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
