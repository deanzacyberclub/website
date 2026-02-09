import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useOfficerVerification } from '@/hooks/useOfficerVerification'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Trophy, Lock, Check, Star, Flag, Code, Users, Plus } from '@/lib/cyberIcon'
import { categoryInfo, difficultyInfo, type Challenge, type CTFCategory, type CTFDifficulty } from './types'

function Challenges() {
  const { user, userProfile } = useAuth()
  const { isVerifiedOfficer, isLoading: verifyingOfficer } = useOfficerVerification()
  const [loaded, setLoaded] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<CTFDifficulty | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<CTFCategory | 'all'>('all')
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([])
  const [teamId, setTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Use server-verified officer status instead of client-side state
  const isOfficer = isVerifiedOfficer ?? false

  const fetchChallenges = useCallback(async () => {
    try {
      // Use the public view that excludes flags and solutions
      const { data, error } = await supabase
        .from('ctf_challenges_public')
        .select('*')
        .order('difficulty', { ascending: true })
        .order('points', { ascending: true })

      if (error) throw error
      setChallenges(data || [])
    } catch (err) {
      console.error('Error fetching challenges:', err)
    }
  }, [])

  const fetchTeamSolves = useCallback(async () => {
    if (!user) {
      setLoading(false)
      setLoaded(true)
      return
    }

    try {
      // Check if user is in a team
      const { data: membership } = await supabase
        .from('ctf_team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single()

      if (membership) {
        setTeamId(membership.team_id)

        // Fetch solved challenges for the team
        const { data: solves } = await supabase
          .from('ctf_submissions')
          .select('challenge_id')
          .eq('team_id', membership.team_id)
          .eq('is_correct', true)

        if (solves) {
          setSolvedChallenges(solves.map(s => s.challenge_id))
        }
      }
    } catch (err) {
      console.error('Error fetching team solves:', err)
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [user])

  useEffect(() => {
    fetchChallenges()
    fetchTeamSolves()
  }, [fetchChallenges, fetchTeamSolves])

  const filteredChallenges = useMemo(() => {
    return challenges.filter(c => {
      if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false
      return true
    })
  }, [challenges, selectedDifficulty, selectedCategory])

  const stats = useMemo(() => ({
    total: challenges.length,
    solved: solvedChallenges.length,
    points: challenges
      .filter(c => solvedChallenges.includes(c.id))
      .reduce((sum, c) => sum + c.points, 0),
    totalPoints: challenges.reduce((sum, c) => sum + c.points, 0)
  }), [challenges, solvedChallenges])

  const getDifficultyColor = (difficulty: CTFDifficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-500/30 bg-green-500/10'
      case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
      case 'hard': return 'text-red-400 border-red-500/30 bg-red-500/10'
      case 'beast': return 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    }
  }

  const getCategoryColor = (category: CTFCategory) => {
    switch (category) {
      case 'web': return 'text-cyan-400'
      case 'crypto': return 'text-purple-400'
      case 'reverse': return 'text-orange-400'
      case 'forensics': return 'text-blue-400'
      case 'pwn': return 'text-red-400'
      case 'misc': return 'text-yellow-400'
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className={`mb-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/ctf"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-matrix transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-terminal text-sm">Back to CTF</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="text-gray-900 dark:text-white">CTF</span>{' '}
                <span className="glitch neon-text" data-text="Challenges">Challenges</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {challenges.length} challenges across {Object.keys(categoryInfo).length} categories
              </p>
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center gap-4">
              {user && teamId && (
                <>
                  <div className="card-hack  p-4 text-center min-w-[100px]">
                    <div className="text-2xl font-bold text-blue-600 dark:text-matrix">{stats.solved}/{stats.total}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 font-terminal">SOLVED</div>
                  </div>
                  <div className="card-hack  p-4 text-center min-w-[100px]">
                    <div className="text-2xl font-bold text-blue-600 dark:text-matrix">{stats.points}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 font-terminal">POINTS</div>
                  </div>
                </>
              )}
              <Link
                to="/ctf/leaderboard"
                className="cli-btn-dashed px-4 py-3 flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>
              <Link
                to="/ctf/team"
                className="cli-btn-dashed px-4 py-3 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">My Team</span>
              </Link>
              {isOfficer && (
                <Link
                  to="/ctf/challenges/new"
                  className="cli-btn-filled  px-4 py-3 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Challenge</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Team Required Notice */}
        {user && !teamId && !loading && (
          <div className={`mb-8 transition-all duration-700 delay-50 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="p-4  bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 flex items-center gap-4">
              <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-700 dark:text-yellow-400 font-medium">Join a team to participate</p>
                <p className="text-yellow-600 dark:text-yellow-400/70 text-sm">You need to be in a team to submit flags and track progress.</p>
              </div>
              <Link to="/ctf/team" className="cli-btn-filled  px-4 py-2 text-sm shrink-0">
                Create/Join Team
              </Link>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`mb-8 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">filter_challenges.sh</span>
            </div>
            <div className="terminal-body">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Difficulty Filter */}
                <div className="flex-1">
                  <div className="text-xs text-gray-600 dark:text-gray-500 font-terminal mb-3">DIFFICULTY</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDifficulty('all')}
                      className={`px-4 py-2  text-sm font-terminal transition-all ${
                        selectedDifficulty === 'all'
                          ? 'bg-blue-50 dark:bg-matrix/20 text-blue-600 dark:text-matrix border border-blue-300 dark:border-matrix/50'
                          : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {(['easy', 'medium', 'hard', 'beast'] as CTFDifficulty[]).map(diff => (
                      <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-4 py-2  text-sm font-terminal transition-all ${
                          selectedDifficulty === diff
                            ? getDifficultyColor(diff) + ' border'
                            : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {difficultyInfo[diff].name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex-1">
                  <div className="text-xs text-gray-600 dark:text-gray-500 font-terminal mb-3">CATEGORY</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2  text-sm font-terminal transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-blue-50 dark:bg-matrix/20 text-blue-600 dark:text-matrix border border-blue-300 dark:border-matrix/50'
                          : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {(Object.keys(categoryInfo) as CTFCategory[]).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2  text-sm font-terminal transition-all ${
                          selectedCategory === cat
                            ? 'bg-gray-200 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 ' + getCategoryColor(cat)
                            : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {categoryInfo[cat].name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Grid */}
        <div className={`transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {filteredChallenges.length === 0 ? (
            <div className="text-center py-20">
              <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No challenges match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredChallenges.map((challenge, index) => {
                const isSolved = solvedChallenges.includes(challenge.id)
                const isBeast = challenge.difficulty === 'beast'

                return (
                  <Link
                    key={challenge.id}
                    to={`/ctf/challenge/${challenge.id}`}
                    className="group block w-full transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`
                      w-full relative overflow-hidden rounded-xl border p-6
                      transition-all duration-300 group-hover:scale-[1.01]
                      ${isSolved
                        ? 'border-green-500/30 bg-green-500/5'
                        : isBeast
                          ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'
                      }
                      group-hover:border-blue-300 dark:group-hover:border-matrix/50 group-hover:bg-blue-50 dark:group-hover:bg-matrix/5
                    `}>
                      {/* Beast glow effect */}
                      {isBeast && (
                        <>
                          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20  blur-3xl" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10  blur-3xl" />
                        </>
                      )}

                      <div className="relative flex flex-col md:flex-row md:items-center gap-4 min-w-0">
                        {/* Left: Title & Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Solved indicator */}
                            {isSolved ? (
                              <div className="w-8 h-8  bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-400" />
                              </div>
                            ) : isBeast ? (
                              <div className="w-8 h-8  bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                                <Star className="w-4 h-4 text-purple-400" />
                              </div>
                            ) : (
                              <div className="w-8 h-8  bg-gray-200 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-gray-500" />
                              </div>
                            )}

                            <h3 className={`text-lg font-bold ${
                              isSolved ? 'text-green-400' : isBeast ? 'text-purple-400 neon-text-subtle' : 'text-gray-900 dark:text-white'
                            } group-hover:text-blue-600 dark:group-hover:text-matrix transition-colors`}>
                              {challenge.title}
                            </h3>
                          </div>

                          <p className="text-gray-600 dark:text-gray-500 text-sm line-clamp-2 mb-3 break-words">
                            {challenge.description.split('\n')[0]}
                          </p>

                          <div className="flex flex-wrap items-center gap-3">
                            {/* Category */}
                            <span className={`text-xs font-terminal ${getCategoryColor(challenge.category)}`}>
                              {categoryInfo[challenge.category].name}
                            </span>

                            {/* Difficulty */}
                            <span className={`px-2 py-1 text-xs font-terminal border ${getDifficultyColor(challenge.difficulty)}`}>
                              {difficultyInfo[challenge.difficulty].name}
                            </span>

                            {/* Files indicator */}
                            {challenge.files && challenge.files.length > 0 && (
                              <span className="text-xs text-gray-600 dark:text-gray-500 flex items-center gap-1">
                                <Flag className="w-3 h-3" />
                                {challenge.files.length} file{challenge.files.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Points */}
                        <div className="flex items-center gap-4">
                          <div className={`text-right ${isBeast ? 'animate-pulse' : ''}`}>
                            <div className={`text-2xl font-bold ${
                              isSolved ? 'text-green-400' : isBeast ? 'text-purple-400' : 'text-blue-600 dark:text-matrix'
                            }`}>
                              {challenge.points}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-500 font-terminal">POINTS</div>
                          </div>

                          <div className="hidden md:flex items-center justify-center w-10 h-10  bg-gray-200 dark:bg-gray-700/50 group-hover:bg-blue-100 dark:group-hover:bg-matrix/20 transition-colors">
                            <Trophy className={`w-5 h-5 ${isBeast ? 'text-purple-400' : 'text-gray-500'} group-hover:text-blue-600 dark:group-hover:text-matrix transition-colors`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={`mt-12 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3  bg-green-500/50" />
              <span>Easy (100 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3  bg-yellow-500/50" />
              <span>Medium (200 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3  bg-red-500/50" />
              <span>Hard (300 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3  bg-purple-500/50" />
              <span>Beast (500 pts)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Challenges
