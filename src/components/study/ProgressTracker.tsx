import type { Pathway, PathwayProgress } from '@/types/database.types'

interface ProgressTrackerProps {
  pathway: Pathway | undefined
  progress: PathwayProgress
}

function ProgressTracker({ pathway, progress }: ProgressTrackerProps) {
  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-4 text-xs font-terminal">
          {pathway?.slug || 'pathway'}.progress
        </span>
      </div>
      <div className="terminal-body">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Completion Percentage */}
          <div className="text-center">
            <div className="text-3xl font-bold text-matrix neon-text mb-1">
              {progress.completion_percentage}%
            </div>
            <div className="text-xs text-gray-500 font-terminal">Completed</div>
          </div>

          {/* Lessons Completed */}
          <div className="text-center">
            <div className="text-3xl font-bold text-hack-cyan mb-1">
              {progress.lessons_completed}/{progress.total_lessons}
            </div>
            <div className="text-xs text-gray-500 font-terminal">Lessons</div>
          </div>

          {/* Current Streak */}
          <div className="text-center">
            <div className="text-3xl font-bold text-hack-orange mb-1">
              {progress.current_streak_days}
            </div>
            <div className="text-xs text-gray-500 font-terminal">Day Streak</div>
          </div>

          {/* Total Time */}
          <div className="text-center">
            <div className="text-3xl font-bold text-hack-purple mb-1">
              {Math.floor(progress.total_time_spent_minutes / 60)}h
            </div>
            <div className="text-xs text-gray-500 font-terminal">Study Time</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-2 bg-terminal-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-matrix to-hack-cyan transition-all duration-500"
              style={{ width: `${progress.completion_percentage}%` }}
            />
          </div>
        </div>

        {/* Achievements (if any) */}
        {progress.achievements && Array.isArray(progress.achievements) && progress.achievements.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-500 font-terminal mb-2">Achievements</div>
            <div className="flex flex-wrap gap-2">
              {(progress.achievements as string[]).map((achievement, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-terminal-alt border border-matrix/30 rounded text-xs font-terminal text-matrix"
                >
                  {achievement}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressTracker
