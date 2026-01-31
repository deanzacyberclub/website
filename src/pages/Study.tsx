import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchPathways, fetchPathwayLessons } from '@/lib/study'
import type { Pathway, Lesson } from '@/types/database.types'
import { Tabs } from '@/components/Tabs'
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

  // Fetch lessons when pathway changes
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
  }, [activePathway, pathways])

  const handleLessonModalClose = () => {
    setSelectedLesson(null)
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
          className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
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
          className={`transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } mb-8 flex justify-center`}
        >
          <Tabs
            tabs={[
              { id: 'security-plus', label: 'Security+' },
              { id: 'professional-ethical-hacker', label: 'PEH' }
            ]}
            activeTab={activePathway}
            onTabChange={(tab) => setActivePathway(tab as 'security-plus' | 'professional-ethical-hacker')}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="font-terminal text-lg neon-pulse text-matrix">Loading pathway...</div>
          </div>
        )}

        {/* Pathway Map */}
        {!loading && lessons.length > 0 && (
          <div
            className={`transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            <PathwayMap
              pathway={currentPathway}
              lessons={lessons}
              isLoggedIn={!!user}
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
      </div>

      {/* Lesson Modal */}
      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson}
          onClose={handleLessonModalClose}
        />
      )}
    </div>
  )
}

export default Study
