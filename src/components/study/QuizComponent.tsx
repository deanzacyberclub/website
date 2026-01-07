import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { submitQuiz } from '@/lib/progress'
import type { Lesson, UserProgress, QuizData } from '@/types/database.types'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface QuizComponentProps {
  lesson: Lesson
  progress: UserProgress | undefined
  onComplete: () => void
}

function QuizComponent({ lesson, progress, onComplete }: QuizComponentProps) {
  const { user } = useAuth()
  const quizData = lesson.quiz_data as QuizData | null
  const questions = quizData?.questions || []

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState<{
    score: number
    total: number
    percentage: number
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  if (!quizData || questions.length === 0) {
    return (
      <div className="p-6 bg-terminal-alt rounded border border-matrix/30 text-center">
        <p className="text-gray-500 font-terminal">No quiz questions available</p>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasAnswer = answers[currentQuestion.id] !== undefined

  const handleAnswerSelect = (questionId: string, answer: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
    setShowExplanation(false)
  }

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setShowExplanation(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
      setShowExplanation(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const results = await submitQuiz(user.id, lesson.id, answers)
      setQuizResults(results)
      setShowResults(true)
    } catch (error) {
      console.error('Failed to submit quiz:', error)
    }
    setIsSubmitting(false)
  }

  const handleRetry = () => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setShowResults(false)
    setQuizResults(null)
    setShowExplanation(false)
  }

  if (showResults && quizResults) {
    const passed = quizResults.percentage >= quizData.passing_score

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div
          className={`p-6 rounded-lg border ${
            passed
              ? 'bg-matrix/10 border-matrix'
              : 'bg-hack-red/10 border-hack-red'
          }`}
        >
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${passed ? 'text-matrix' : 'text-hack-red'}`}>
              {quizResults.percentage}%
            </div>
            <p className={`font-terminal text-sm ${passed ? 'text-matrix' : 'text-hack-red'}`}>
              {passed ? '✓ Passed!' : '✗ Did not pass'}
            </p>
            <p className="text-gray-400 font-terminal text-xs mt-2">
              Passing score: {quizData.passing_score}%
            </p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-terminal-alt rounded border border-gray-800 text-center">
            <div className="text-2xl font-bold text-matrix mb-1">{quizResults.score}</div>
            <div className="text-xs text-gray-500 font-terminal">Correct</div>
          </div>
          <div className="p-4 bg-terminal-alt rounded border border-gray-800 text-center">
            <div className="text-2xl font-bold text-hack-red mb-1">
              {quizResults.total - quizResults.score}
            </div>
            <div className="text-xs text-gray-500 font-terminal">Incorrect</div>
          </div>
          <div className="p-4 bg-terminal-alt rounded border border-gray-800 text-center">
            <div className="text-2xl font-bold text-hack-cyan mb-1">{quizResults.total}</div>
            <div className="text-xs text-gray-500 font-terminal">Total</div>
          </div>
        </div>

        {/* Answer Review */}
        <div>
          <h3 className="text-lg font-bold text-matrix mb-3">Answer Review</h3>
          <div className="space-y-3">
            {questions.map((q, index) => {
              const isCorrect = answers[q.id] === q.correct_answer
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded border ${
                    isCorrect
                      ? 'bg-matrix/5 border-matrix/30'
                      : 'bg-hack-red/5 border-hack-red/30'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-matrix flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-hack-red flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-terminal text-gray-300 mb-2">
                        {index + 1}. {q.question}
                      </p>
                      <p className="text-xs font-terminal text-gray-500">
                        Your answer: <span className={isCorrect ? 'text-matrix' : 'text-hack-red'}>{String(answers[q.id])}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-xs font-terminal text-gray-500">
                          Correct answer: <span className="text-matrix">{String(q.correct_answer)}</span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-xs font-terminal text-gray-400 mt-2 italic">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-800">
          {!passed && (
            <button
              onClick={handleRetry}
              className="btn-hack flex-1 flex items-center justify-center gap-2 px-6 py-2 text-sm font-terminal"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Quiz
            </button>
          )}
          <button
            onClick={onComplete}
            className="btn-hack-filled flex-1 px-6 py-2 text-sm font-terminal"
          >
            {passed ? 'Continue' : 'Close'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quiz Progress */}
      <div className="flex items-center justify-between text-sm font-terminal text-gray-400">
        <span>
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
        {progress?.quiz_attempts && progress.quiz_attempts > 0 && (
          <span>
            Attempts: {progress.quiz_attempts} | Best: {progress.quiz_best_score || 0}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-terminal-alt rounded-full overflow-hidden">
        <div
          className="h-full bg-matrix transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="p-6 bg-terminal-alt rounded-lg border border-matrix/30">
        <h3 className="text-lg font-bold text-matrix mb-4">{currentQuestion.question}</h3>

        {/* Answer Options */}
        <div className="space-y-2">
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                className={`w-full text-left p-4 rounded border transition-all ${
                  answers[currentQuestion.id] === option
                    ? 'border-matrix bg-matrix/10 text-matrix'
                    : 'border-gray-700 bg-terminal-bg text-gray-300 hover:border-matrix/50'
                }`}
              >
                <span className="font-terminal text-sm">{option}</span>
              </button>
            ))
          )}

          {currentQuestion.type === 'true_false' && (
            ['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                className={`w-full text-left p-4 rounded border transition-all ${
                  answers[currentQuestion.id] === option
                    ? 'border-matrix bg-matrix/10 text-matrix'
                    : 'border-gray-700 bg-terminal-bg text-gray-300 hover:border-matrix/50'
                }`}
              >
                <span className="font-terminal text-sm">{option}</span>
              </button>
            ))
          )}

          {currentQuestion.type === 'short_answer' && (
            <input
              type="text"
              value={(answers[currentQuestion.id] as string) || ''}
              onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
              placeholder="Type your answer..."
              className="w-full p-4 bg-terminal-bg border border-gray-700 rounded text-matrix font-terminal text-sm focus:border-matrix focus:outline-none"
            />
          )}
        </div>

        {/* Explanation (shown after answering in review mode) */}
        {showExplanation && currentQuestion.explanation && (
          <div className="mt-4 p-4 bg-terminal-bg rounded border border-hack-cyan/30">
            <p className="text-xs font-terminal text-gray-400 italic">
              💡 {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="btn-hack px-6 py-2 text-sm font-terminal disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {!isLastQuestion && (
          <button
            onClick={handleNext}
            disabled={!hasAnswer}
            className="btn-hack flex-1 px-6 py-2 text-sm font-terminal disabled:opacity-50"
          >
            Next
          </button>
        )}

        {isLastQuestion && (
          <button
            onClick={handleSubmit}
            disabled={!hasAnswer || isSubmitting || Object.keys(answers).length !== questions.length}
            className="btn-hack-filled flex-1 px-6 py-2 text-sm font-terminal disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>

      {/* Hint */}
      {Object.keys(answers).length < questions.length && (
        <p className="text-xs font-terminal text-gray-500 text-center">
          Answer all questions to submit the quiz
        </p>
      )}
    </div>
  )
}

export default QuizComponent
