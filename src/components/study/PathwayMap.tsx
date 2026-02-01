import { useState } from 'react'
import type { Lesson } from '@/types/database.types'
import LessonNode from './LessonNode'
import CertificateModal from './CertificateModal'
import { Award, Lock, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'

// Hardcoded Security+ pathway info (since we only have one pathway now)
const PATHWAY_INFO = {
  slug: 'security-plus',
  title: 'Security+ Certification',
  description: 'Comprehensive preparation for CompTIA Security+ certification covering network security, compliance, threats, and cryptography.',
  icon: '🛡️',
  difficulty: 'beginner',
  estimated_hours: 40
}

interface PathwayMapProps {
  lessons: Lesson[]
  isLoggedIn: boolean
  onLessonClick: (lesson: Lesson) => void
}

function PathwayMap({ lessons, isLoggedIn, onLessonClick }: PathwayMapProps) {
  const [showCertificate, setShowCertificate] = useState(false)

  if (lessons.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Pathway Info */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="ml-4 text-xs font-terminal">{PATHWAY_INFO.slug}.info</span>
        </div>
        <div className="terminal-body">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{PATHWAY_INFO.icon}</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-matrix mb-2">{PATHWAY_INFO.title}</h2>
              <p className="text-gray-400 text-sm font-terminal mb-3">
                {PATHWAY_INFO.description}
              </p>
              <div className="flex flex-wrap gap-3 text-xs font-terminal">
                <span className="text-gray-500">
                  Difficulty:{' '}
                  <span className="text-matrix">{PATHWAY_INFO.difficulty}</span>
                </span>
                <span className="text-gray-500">
                  Est. Time:{' '}
                  <span className="text-matrix">{PATHWAY_INFO.estimated_hours}h</span>
                </span>
                <span className="text-gray-500">
                  Lessons: <span className="text-matrix">{lessons.length}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <LessonNode
            key={lesson.id}
            lesson={lesson}
            onClick={() => onLessonClick(lesson)}
          />
        ))}
      </div>

      {/* Certificate Card */}
      <div className="mt-6">
        {isLoggedIn ? (
          <button
            onClick={() => setShowCertificate(true)}
            className="w-full p-6 rounded-lg border-2 transition-all bg-hack-yellow/10 border-hack-yellow hover:bg-hack-yellow/20 hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg border-2 flex items-center justify-center bg-hack-yellow/20 border-hack-yellow">
                <Award className="w-7 h-7 text-hack-yellow" />
              </div>
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
              <div className="w-14 h-14 rounded-lg border-2 flex items-center justify-center bg-gray-800 border-gray-700">
                <Lock className="w-7 h-7 text-gray-600" />
              </div>
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

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal
          pathwayTitle={PATHWAY_INFO.title}
          lessonsCount={lessons.length}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  )
}

export default PathwayMap
