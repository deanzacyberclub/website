import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchPathways, fetchPathwayLessons, fetchUserProgress } from '@/lib/study'
import type { Pathway, Lesson, UserProgress, PathwayProgress } from '@/types/database.types'
import PathwaySelector from '@/components/study/PathwaySelector'
import ProgressTracker from '@/components/study/ProgressTracker'
import PathwayMap from '@/components/study/PathwayMap'
import LessonModal from '@/components/study/LessonModal'

type PathwaySlug = 'security-plus' | 'professional-ethical-hacker'

function Study() {
  const { user } = useAuth()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  // Pathway selection state
  const [activePathway, setActivePathway] = useState<PathwaySlug>('security-plus')
  const [pathways, setPathways] = useState<Pathway[]>([])

  // Lesson data state
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [pathwayProgress, setPathwayProgress] = useState<PathwayProgress | null>(null)

  // Modal state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  // Fetch pathways on mount
  useEffect(() => {
    async function loadPathways() {
      try {
        const pathwaysData = await fetchPathways()
        setPathways(pathwaysData)
      } catch (error) {
        console.error('Failed to load pathways:', error)
      }
    }

    loadPathways()
  }, [])

  // Fetch lessons and progress when pathway or user changes
  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const currentPathway = pathways.find(
        (p) =>
          p.slug === (activePathway === 'security-plus' ? 'security-plus' : 'professional-ethical-hacker')
      )

      if (currentPathway) {
        try {
          // Fetch lessons for this pathway
          const lessonsData = await fetchPathwayLessons(currentPathway.id)
          setLessons(lessonsData)

          // Fetch user progress if logged in
          if (user) {
            const progressData = await fetchUserProgress(user.id, currentPathway.id)
            setUserProgress(progressData.lessons)
            setPathwayProgress(progressData.pathway)
          } else {
            setUserProgress([])
            setPathwayProgress(null)
          }
        } catch (error) {
          console.error('Failed to load lesson data:', error)
        }
      }

      setLoading(false)
      setTimeout(() => setLoaded(true), 100)
    }

    if (pathways.length > 0) {
      loadData()
    }
  }, [activePathway, pathways, user])

  // Reload data when modal closes (to refresh progress)
  const handleLessonModalClose = async () => {
    setSelectedLesson(null)

    // Refresh progress data
    const currentPathway = pathways.find(
      (p) =>
        p.slug === (activePathway === 'security-plus' ? 'security-plus' : 'professional-ethical-hacker')
    )

    if (currentPathway && user) {
      const progressData = await fetchUserProgress(user.id, currentPathway.id)
      setUserProgress(progressData.lessons)
      setPathwayProgress(progressData.pathway)
    }
  }

  const currentPathway = pathways.find(
    (p) =>
      p.slug === (activePathway === 'security-plus' ? 'security-plus' : 'professional-ethical-hacker')
  )

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div
          className={`transition-all duration-700 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-matrix neon-text">
            <span className="glitch" data-text="Study Pathways">
              Study Pathways
            </span>
          </h1>
          <p className="text-gray-400 font-terminal text-sm mb-8">
            Zero to hero cybersecurity training with interactive lessons, quizzes, and hands-on challenges
          </p>
        </div>

        {/* Pathway Selector */}
        <div
          className={`transition-all duration-700 delay-100 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          } mb-8`}
        >
          <PathwaySelector
            activePathway={activePathway}
            onPathwayChange={(slug) => setActivePathway(slug)}
          />
        </div>

        {/* Progress Tracker */}
        {user && pathwayProgress && (
          <div
            className={`transition-all duration-700 delay-200 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } mb-8`}
          >
            <ProgressTracker
              pathway={currentPathway}
              progress={pathwayProgress}
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="font-terminal text-lg neon-pulse text-matrix">Loading pathway...</div>
          </div>
        )}

        {/* Pathway Map */}
        {!loading && lessons.length > 0 && (
          <div
            className={`transition-all duration-700 delay-300 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <PathwayMap
              pathway={currentPathway}
              lessons={lessons}
              userProgress={userProgress}
              onLessonClick={(lesson) => setSelectedLesson(lesson)}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && lessons.length === 0 && (
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs font-terminal">pathway.status</span>
            </div>
            <div className="terminal-body text-center py-12">
              <p className="text-gray-500 font-terminal">
                No lessons available for this pathway yet. Check back soon!
              </p>
            </div>
          </div>
        )}

        {/* Login Prompt for Non-Authenticated Users */}
        {!user && (
          <div
            className={`terminal-window mt-8 transition-all duration-700 delay-400 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs font-terminal">auth.required</span>
            </div>
            <div className="terminal-body text-center py-8">
              <p className="text-gray-400 font-terminal mb-4">
                Sign in to track your progress and unlock achievements
              </p>
              <a
                href="/auth"
                className="btn-hack-filled inline-block px-6 py-2 text-sm font-terminal"
              >
                Sign In
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson}
          allLessons={lessons}
          userProgress={userProgress}
          onClose={handleLessonModalClose}
        />
      )}
    </div>
  )
}

export default Study
