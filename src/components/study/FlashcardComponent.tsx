import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { updateFlashcardMastery, checkFlashcardCompletion } from '@/lib/progress'
import type { Lesson, UserProgress, FlashCard, FlashcardData } from '@/types/database.types'
import { ChevronLeft, ChevronRight, Shuffle, Star } from 'lucide-react'

interface FlashcardComponentProps {
  lesson: Lesson
  progress: UserProgress | undefined
  onComplete: () => void
}

function FlashcardComponent({ lesson, progress }: FlashcardComponentProps) {
  const { user } = useAuth()
  const flashcardData = lesson.flashcard_data as FlashcardData | null
  const cards = flashcardData?.cards || []

  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [mastery, setMastery] = useState<Record<string, number>>({})
  const [shuffledCards, setShuffledCards] = useState<FlashCard[]>(cards)

  // Load existing mastery data
  useEffect(() => {
    if (progress?.flashcard_mastery) {
      setMastery(progress.flashcard_mastery as Record<string, number>)
    }
  }, [progress])

  if (!flashcardData || cards.length === 0) {
    return (
      <div className="p-6 bg-terminal-alt rounded border border-matrix/30 text-center">
        <p className="text-gray-500 font-terminal">No flashcards available</p>
      </div>
    )
  }

  const currentCard = shuffledCards[currentCardIndex]
  const currentMastery = mastery[currentCard.id] || 0
  const studiedCount = Object.keys(mastery).length
  const masteredCount = Object.values(mastery).filter((level) => level >= 3).length

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = () => {
    setIsFlipped(false)
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      setCurrentCardIndex(0) // Loop back to start
    }
  }

  const handlePrevious = () => {
    setIsFlipped(false)
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    } else {
      setCurrentCardIndex(shuffledCards.length - 1) // Loop to end
    }
  }

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  const handleMastery = async (level: number) => {
    if (!user) return

    const newMastery = { ...mastery, [currentCard.id]: level }
    setMastery(newMastery)

    try {
      await updateFlashcardMastery(user.id, lesson.id, currentCard.id, level)

      // Check if all cards are mastered
      await checkFlashcardCompletion(user.id, lesson.id, cards.length)
    } catch (error) {
      console.error('Failed to update mastery:', error)
    }

    // Auto-advance to next card
    setTimeout(() => {
      handleNext()
    }, 500)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious()
    } else if (e.key === 'ArrowRight') {
      handleNext()
    } else if (e.key === ' ') {
      e.preventDefault()
      handleFlip()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCardIndex, isFlipped])

  return (
    <div className="space-y-6">
      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-terminal-alt rounded border border-gray-800 text-center">
          <div className="text-2xl font-bold text-matrix mb-1">{studiedCount}</div>
          <div className="text-xs text-gray-500 font-terminal">Studied</div>
        </div>
        <div className="p-3 bg-terminal-alt rounded border border-gray-800 text-center">
          <div className="text-2xl font-bold text-hack-cyan mb-1">{masteredCount}</div>
          <div className="text-xs text-gray-500 font-terminal">Mastered</div>
        </div>
        <div className="p-3 bg-terminal-alt rounded border border-gray-800 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-1">{cards.length}</div>
          <div className="text-xs text-gray-500 font-terminal">Total</div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative">
        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
          style={{ perspective: '1000px', cursor: 'pointer' }}
        >
          <div
            className="flashcard-inner"
            style={{
              position: 'relative',
              width: '100%',
              height: '400px',
              transition: 'transform 0.6s',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front */}
            <div
              className="flashcard-front absolute inset-0 p-8 bg-terminal-alt rounded-lg border-2 border-matrix/50 flex items-center justify-center"
              style={{
                backfaceVisibility: 'hidden'
              }}
            >
              <div className="text-center">
                <p className="text-xs font-terminal text-gray-500 mb-4">QUESTION</p>
                <p className="text-xl md:text-2xl font-terminal text-matrix leading-relaxed">
                  {currentCard.front}
                </p>
                <p className="text-xs font-terminal text-gray-500 mt-6">Click to reveal answer</p>
              </div>
            </div>

            {/* Back */}
            <div
              className="flashcard-back absolute inset-0 p-8 bg-terminal-alt rounded-lg border-2 border-hack-cyan flex items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="text-center">
                <p className="text-xs font-terminal text-gray-500 mb-4">ANSWER</p>
                <p className="text-xl md:text-2xl font-terminal text-hack-cyan leading-relaxed">
                  {currentCard.back}
                </p>
                {currentCard.category && (
                  <p className="text-xs font-terminal text-gray-500 mt-6">
                    Category: {currentCard.category}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Number & Mastery Indicator */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-terminal-bg border border-matrix/50 rounded-full">
          <span className="text-xs font-terminal text-matrix">
            {currentCardIndex + 1} / {shuffledCards.length}
          </span>
        </div>

        {/* Current Mastery Stars */}
        <div className="absolute -top-3 right-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <Star
              key={level}
              className={`w-4 h-4 ${
                level <= currentMastery
                  ? 'text-hack-yellow fill-hack-yellow'
                  : 'text-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mastery Buttons (shown when flipped) */}
      {isFlipped && user && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleMastery(Math.max(0, currentMastery - 1))}
            className="btn-hack px-6 py-3 text-sm font-terminal"
          >
            Need More Practice
          </button>
          <button
            onClick={() => handleMastery(Math.min(5, currentMastery + 1))}
            className="btn-hack-filled px-6 py-3 text-sm font-terminal"
          >
            I Know This
          </button>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrevious}
          className="btn-hack p-3"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleShuffle}
          className="btn-hack flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-terminal"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </button>

        <button
          onClick={handleNext}
          className="btn-hack p-3"
          aria-label="Next card"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="p-3 bg-terminal-alt rounded border border-gray-800">
        <p className="text-xs font-terminal text-gray-500 text-center">
          Keyboard shortcuts: ← Previous | → Next | Space Flip
        </p>
      </div>

      {/* Completion Status */}
      {progress?.status === 'completed' && (
        <div className="p-4 bg-matrix/10 border border-matrix rounded text-center">
          <p className="text-matrix font-terminal text-sm">
            ✓ Flashcards Completed ({masteredCount}/{cards.length} mastered)
          </p>
        </div>
      )}
    </div>
  )
}

export default FlashcardComponent
