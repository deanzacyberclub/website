import { useMemo } from 'react'
import type { Pathway, Lesson, UserProgress } from '@/types/database.types'
import { calculateLessonStatus } from '@/lib/progress'
import LessonNode from './LessonNode'

interface PathwayMapProps {
  pathway: Pathway | undefined
  lessons: Lesson[]
  userProgress: UserProgress[]
  onLessonClick: (lesson: Lesson) => void
}

function PathwayMap({ pathway, lessons, userProgress, onLessonClick }: PathwayMapProps) {
  // Calculate lesson statuses
  const lessonStatuses = useMemo(() => {
    return lessons.map((lesson) => ({
      lesson,
      status: calculateLessonStatus(lesson, userProgress, lessons),
      progress: userProgress.find((p) => p.lesson_id === lesson.id)
    }))
  }, [lessons, userProgress])

  if (!pathway || lessons.length === 0) {
    return null
  }

  return (
    <div className="relative">
      {/* Pathway Info */}
      <div className="terminal-window mb-6">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="ml-4 text-xs font-terminal">{pathway.slug}.info</span>
        </div>
        <div className="terminal-body">
          <div className="flex items-start gap-4">
            {pathway.icon && <div className="text-4xl">{pathway.icon}</div>}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-matrix mb-2">{pathway.title}</h2>
              <p className="text-gray-400 text-sm font-terminal mb-3">
                {pathway.description}
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-terminal">
                {pathway.difficulty && (
                  <span className="text-gray-500">
                    Difficulty:{' '}
                    <span className="text-matrix">{pathway.difficulty}</span>
                  </span>
                )}
                {pathway.estimated_hours && (
                  <span className="text-gray-500">
                    Est. Time:{' '}
                    <span className="text-matrix">{pathway.estimated_hours}h</span>
                  </span>
                )}
                <span className="text-gray-500">
                  Lessons: <span className="text-matrix">{lessons.length}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pathway Visualization - Duolingo Style */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="ml-4 text-xs font-terminal">pathway.map</span>
        </div>
        <div className="terminal-body">
          <div className="space-y-0 max-w-2xl mx-auto">
            {lessonStatuses.map(({ lesson, status, progress }, index) => (
              <div key={lesson.id} className="flex gap-6 items-start">
                {/* Timeline column with dotted line */}
                <div className="flex flex-col items-center shrink-0 pt-4">
                  {/* Connector line above (except for first item) */}
                  {index > 0 && (
                    <div className="border-l-2 border-dotted border-matrix/30 h-8 mb-2" />
                  )}

                  {/* Node dot indicator */}
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      status === 'completed'
                        ? 'bg-matrix border-2 border-matrix shadow-neon'
                        : status === 'in_progress'
                          ? 'bg-hack-cyan border-2 border-hack-cyan animate-pulse'
                          : status === 'unlocked'
                            ? 'bg-terminal-alt border-2 border-matrix/50'
                            : 'bg-gray-800 border-2 border-gray-700'
                    }`}
                  />

                  {/* Connector line below (except for last item) */}
                  {index < lessonStatuses.length - 1 && (
                    <div className="border-l-2 border-dotted border-matrix/30 flex-1 min-h-[80px] mt-2" />
                  )}
                </div>

                {/* Lesson Node */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-center">
                    <LessonNode
                      lesson={lesson}
                      status={status}
                      score={progress?.quiz_score}
                      onClick={() => onLessonClick(lesson)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-terminal-alt rounded-lg border border-gray-800">
        <div className="flex flex-wrap gap-4 text-xs font-terminal text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-700" />
            <span>Locked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-terminal-alt border border-matrix/50" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-hack-cyan/10 border border-hack-cyan animate-pulse" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-matrix/20 border border-matrix" />
            <span>Completed</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PathwayMap
