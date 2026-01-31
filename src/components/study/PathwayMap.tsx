import { useState } from 'react'
import type { Pathway, Lesson } from '@/types/database.types'
import LessonNode from './LessonNode'
import CertificateModal from './CertificateModal'
import { Award, Lock, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PathwayMapProps {
  pathway: Pathway | undefined
  lessons: Lesson[]
  isLoggedIn: boolean
  onLessonClick: (lesson: Lesson) => void
}

function PathwayMap({ pathway, lessons, isLoggedIn, onLessonClick }: PathwayMapProps) {
  const [showCertificate, setShowCertificate] = useState(false)

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

      {/* Pathway Visualization */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="ml-4 text-xs font-terminal">pathway.map</span>
        </div>
        <div className="terminal-body">
          <div className="space-y-0 max-w-2xl mx-auto">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex gap-6 items-start">
                {/* Timeline column with dotted line */}
                <div className="flex flex-col items-center shrink-0 pt-4">
                  {/* Connector line above (except for first item) */}
                  {index > 0 && (
                    <div className="border-l-2 border-dotted border-matrix/30 h-8 mb-2" />
                  )}

                  {/* Node dot indicator */}
                  <div className="w-3 h-3 rounded-full bg-terminal-alt border-2 border-matrix/50" />

                  {/* Connector line below (except for last item) */}
                  {index < lessons.length - 1 && (
                    <div className="border-l-2 border-dotted border-matrix/30 flex-1 min-h-[80px] mt-2" />
                  )}
                </div>

                {/* Lesson Node */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-center">
                    <LessonNode
                      lesson={lesson}
                      onClick={() => onLessonClick(lesson)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Certificate of Accomplishment */}
            <div className="flex gap-6 items-start mt-8">
              {/* Timeline column with dotted line */}
              <div className="flex flex-col items-center shrink-0 pt-4">
                {/* Connector line above */}
                <div className="border-l-2 border-dotted border-matrix/30 h-8 mb-2" />

                {/* Certificate dot indicator */}
                <div className="w-3 h-3 rounded-full bg-gray-800 border-2 border-gray-700" />
              </div>

              {/* Certificate Card */}
              <div className="flex-1 pb-4">
                {isLoggedIn ? (
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="w-full p-6 rounded-lg border-2 transition-all bg-hack-yellow/10 border-hack-yellow hover:bg-hack-yellow/20 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-16 h-16 rounded-lg border-2 flex items-center justify-center bg-hack-yellow/20 border-hack-yellow">
                        <Award className="w-8 h-8 text-hack-yellow" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-bold mb-1 text-hack-yellow">
                          Certificate of Accomplishment
                        </h3>
                        <p className="text-xs text-gray-500 font-terminal">
                          Tap to view and download your certificate
                        </p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="w-full p-6 rounded-lg border-2 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-16 h-16 rounded-lg border-2 flex items-center justify-center bg-gray-800 border-gray-700">
                        <Lock className="w-8 h-8 text-gray-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-bold mb-1 text-gray-600">
                          Certificate Locked
                        </h3>
                        <p className="text-xs text-gray-500 font-terminal mb-2">
                          Sign in to get your certificate of accomplishment
                        </p>
                        <Link
                          to="/auth?to=/study"
                          className="inline-flex items-center gap-2 text-xs text-matrix hover:underline font-terminal"
                        >
                          <LogIn className="w-3 h-3" />
                          Sign in
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal
          pathway={pathway}
          lessonsCount={lessons.length}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Legend */}
      <div className="mt-4 p-4 bg-terminal-alt rounded-lg border border-gray-800">
        <div className="flex flex-wrap gap-4 text-xs font-terminal text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-terminal-alt border border-matrix/50" />
            <span>Available</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PathwayMap
