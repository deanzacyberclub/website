import type { Lesson } from '@/types/database.types'
import { BookOpen, Users, Flag, CheckCircle, CreditCard, Clock } from 'lucide-react'

interface LessonNodeProps {
  lesson: Lesson
  onClick: () => void
}

const TYPE_CONFIG: Record<string, { label: string; color: string; Icon: typeof BookOpen }> = {
  course: { label: 'COURSE', color: 'text-hack-cyan border-hack-cyan/50', Icon: BookOpen },
  workshop: { label: 'WORKSHOP', color: 'text-hack-yellow border-hack-yellow/50', Icon: Users },
  ctf: { label: 'CTF', color: 'text-hack-red border-hack-red/50', Icon: Flag },
  quiz: { label: 'QUIZ', color: 'text-hack-purple border-hack-purple/50', Icon: CheckCircle },
  flashcard: { label: 'FLASHCARDS', color: 'text-hack-orange border-hack-orange/50', Icon: CreditCard }
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'bg-matrix/20 text-matrix border-matrix/50' },
  beginner: { label: 'Beginner', color: 'bg-matrix/20 text-matrix border-matrix/50' },
  medium: { label: 'Medium', color: 'bg-hack-yellow/20 text-hack-yellow border-hack-yellow/50' },
  intermediate: { label: 'Intermediate', color: 'bg-hack-yellow/20 text-hack-yellow border-hack-yellow/50' },
  hard: { label: 'Hard', color: 'bg-hack-red/20 text-hack-red border-hack-red/50' },
  advanced: { label: 'Advanced', color: 'bg-hack-red/20 text-hack-red border-hack-red/50' }
}

function LessonNode({ lesson, onClick }: LessonNodeProps) {
  const typeConfig = TYPE_CONFIG[lesson.type] || TYPE_CONFIG.course
  const difficultyConfig = lesson.difficulty ? DIFFICULTY_CONFIG[lesson.difficulty] : null
  const Icon = typeConfig.Icon

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className="card-hack p-4 rounded-lg group transition-all cursor-pointer hover:scale-[1.02] w-full"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={lesson.title}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg border flex items-center justify-center bg-terminal-alt ${typeConfig.color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type and Difficulty badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            {difficultyConfig && (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${difficultyConfig.color}`}>
                {difficultyConfig.label}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-matrix group-hover:neon-text-subtle transition-all mb-1 truncate">
            {lesson.title}
          </h3>

          {/* Description */}
          <p className="text-gray-500 text-sm line-clamp-2 mb-2">
            {lesson.description}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {lesson.estimated_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-matrix/50" />
                {lesson.estimated_minutes} min
              </div>
            )}
            {lesson.topics && lesson.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {lesson.topics.slice(0, 3).map((topic) => (
                  <span
                    key={topic}
                    className="px-1.5 py-0.5 rounded text-xs bg-terminal-alt border border-gray-700 text-gray-400"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LessonNode
