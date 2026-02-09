import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Users, Check, AlertTriangle } from '@/lib/cyberIcon'
import type { CTFTeam } from '@/types/database.types'

function JoinTeam() {
  const { code } = useParams<{ code?: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [inviteCode, setInviteCode] = useState(code || '')
  const [team, setTeam] = useState<CTFTeam | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(!!code) // Loading state for URL code
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [linkError, setLinkError] = useState('') // Separate error for invalid/expired links
  const [success, setSuccess] = useState(false)
  const [alreadyInTeam, setAlreadyInTeam] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (user) {
      checkExistingMembership()
    }
  }, [user])

  useEffect(() => {
    if (code) {
      lookupTeam(code, true)
    }
  }, [code])

  const checkExistingMembership = async () => {
    if (!user) return

    const { data } = await supabase
      .from('ctf_team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setAlreadyInTeam(true)
    }
  }

  const lookupTeam = async (codeToLookup: string, isInitial = false) => {
    if (!codeToLookup.trim()) return

    if (isInitial) {
      setInitialLoading(true)
    } else {
      setLoading(true)
    }
    setError('')
    setLinkError('')
    setTeam(null)

    try {
      const { data: teamData, error: teamError } = await supabase
        .from('ctf_teams')
        .select('*')
        .eq('invite_code', codeToLookup.toUpperCase())
        .single()

      if (teamError || !teamData) {
        setLinkError('Invalid invite code. This link does not exist.')
        return
      }

      // Check if invite link has expired
      if (teamData.invite_expires_at) {
        const expiresAt = new Date(teamData.invite_expires_at)
        if (expiresAt < new Date()) {
          setLinkError('This invite link has expired. Please ask the team captain for a new one.')
          return
        }
      }

      // Check if invite link has reached max uses
      if (teamData.invite_max_uses !== null && teamData.invite_max_uses !== undefined) {
        const usesCount = teamData.invite_uses_count || 0
        if (usesCount >= teamData.invite_max_uses) {
          setLinkError('This invite link has reached its maximum number of uses. Please ask the team captain for a new one.')
          return
        }
      }

      // Check member count
      const { count } = await supabase
        .from('ctf_team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamData.id)

      setTeam(teamData)
      setMemberCount(count || 0)

      if (count && count >= 4) {
        setLinkError('This team is already full (4/4 members).')
      }
    } catch (err) {
      console.error('Error looking up team:', err)
      setLinkError('Failed to look up team. Please try again.')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    lookupTeam(inviteCode)
  }

  const joinTeam = async () => {
    if (!user || !team) return

    setJoining(true)
    setError('')

    try {
      // Re-check expiration and use count before joining
      if (team.invite_expires_at) {
        const expiresAt = new Date(team.invite_expires_at)
        if (expiresAt < new Date()) {
          setError('This invite link has expired.')
          setJoining(false)
          return
        }
      }

      if (team.invite_max_uses !== null && team.invite_max_uses !== undefined) {
        const usesCount = team.invite_uses_count || 0
        if (usesCount >= team.invite_max_uses) {
          setError('This invite link has reached its maximum uses.')
          setJoining(false)
          return
        }
      }

      const { error: joinError } = await supabase
        .from('ctf_team_members')
        .insert({
          team_id: team.id,
          user_id: user.id
        })

      if (joinError) {
        if (joinError.message.includes('unique') || joinError.message.includes('already')) {
          setError('You are already in a team. Leave your current team first.')
        } else if (joinError.message.includes('capacity') || joinError.message.includes('maximum')) {
          setError('This team is already full.')
        } else {
          throw joinError
        }
        return
      }

      // Increment the invite uses count
      await supabase
        .from('ctf_teams')
        .update({ invite_uses_count: (team.invite_uses_count || 0) + 1 })
        .eq('id', team.id)

      setSuccess(true)
      setTimeout(() => {
        navigate('/ctf/team')
      }, 1500)
    } catch (err) {
      console.error('Error joining team:', err)
      setError('Failed to join team. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  // Show loading state while checking URL invite code
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center">
          <div className="font-terminal text-lg text-blue-600 dark:text-matrix dark:neon-pulse">Checking invite link...</div>
        </div>
      </div>
    )
  }

  // Show link error first (invalid, expired, max uses, team full)
  if (linkError && code) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Invite Link</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{linkError}</p>
          <div className="flex flex-col gap-3">
            <Link to="/ctf/join" className="cli-btn-dashed px-6 py-3">
              Try Different Code
            </Link>
            <Link to="/ctf" className="text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix transition-colors text-sm">
              Back to CTF
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show login required only if link is valid (team exists and no link error)
  if (!user && team && !linkError) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20  bg-blue-100 dark:bg-matrix/20 border-2 border-blue-300 dark:border-matrix flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-blue-600 dark:text-matrix" />
          </div>
          <h2 className="text-2xl font-bold text-blue-600 dark:text-matrix dark:neon-text-subtle mb-2">
            {team.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-1">{memberCount}/4 members</p>
          <p className="text-gray-600 dark:text-gray-500 text-sm mb-6">You've been invited to join this team!</p>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to join this team.</p>
          <Link
            to={`/auth?redirect=${encodeURIComponent(`/ctf/join/${code}`)}`}
            className="cli-btn-filled  px-6 py-3"
          >
            Login to Join
          </Link>
        </div>
      </div>
    )
  }

  // Show generic login required if no code provided
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-500 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to join a team.</p>
          <Link to="/auth" className="cli-btn-filled  px-6 py-3">
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (alreadyInTeam) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Already in a Team</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You're already a member of a team. Leave your current team first to join another.
          </p>
          <Link to="/ctf/team" className="cli-btn-filled  px-6 py-3">
            View My Team
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/ctf/team"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-matrix transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-terminal text-sm">Back</span>
          </Link>

          <h1 className="text-3xl font-bold">
            <span className="text-gray-900 dark:text-white">Join</span>{' '}
            <span className="neon-text">Team</span>
          </h1>
        </div>

        {success ? (
          <div className={`transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">success.log</span>
              </div>
              <div className="terminal-body text-center py-8">
                <div className="w-20 h-20  bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">Welcome to the Team!</h2>
                <p className="text-gray-600 dark:text-gray-400">Redirecting to your team dashboard...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">join_team.sh</span>
              </div>
              <div className="terminal-body">
                {!team ? (
                  <>
                    <div className="text-center mb-6">
                      <Users className="w-12 h-12 text-blue-600 dark:text-matrix mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enter Invite Code</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Enter the invite code shared by your team captain.
                      </p>
                    </div>

                    <form onSubmit={handleLookup}>
                      <div className="mb-4">
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          placeholder="Enter invite code..."
                          maxLength={12}
                          className="w-full input-hack  text-center text-xl tracking-widest uppercase"
                          required
                        />
                      </div>

                      {linkError && !team && (
                        <p className="text-red-400 text-sm mb-4 text-center">{linkError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !inviteCode.trim()}
                        className="w-full cli-btn-filled  py-3 disabled:opacity-50"
                      >
                        {loading ? 'Looking up...' : 'Find Team'}
                      </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                      <p className="text-gray-600 dark:text-gray-500 text-sm mb-3">Want to start your own team?</p>
                      <Link
                        to="/ctf/team"
                        className="cli-btn-dashed px-6 py-2 text-sm"
                      >
                        Create a Team
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16  bg-blue-100 dark:bg-matrix/20 border-2 border-blue-300 dark:border-matrix flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-blue-600 dark:text-matrix" />
                      </div>
                      <h2 className="text-2xl font-bold text-blue-600 dark:text-matrix dark:neon-text-subtle mb-2">
                        {team.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {memberCount}/4 members
                      </p>
                    </div>

                    {(error || linkError) && (
                      <div className="p-4  bg-red-500/10 border border-red-500/30 mb-4">
                        <p className="text-red-400 text-sm text-center">{error || linkError}</p>
                      </div>
                    )}

                    {memberCount < 4 && !error && !linkError && (
                      <button
                        onClick={joinTeam}
                        disabled={joining}
                        className="w-full cli-btn-filled  py-3 disabled:opacity-50"
                      >
                        {joining ? 'Joining...' : 'Join Team'}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setTeam(null)
                        setInviteCode('')
                        setError('')
                        setLinkError('')
                      }}
                      className="w-full cli-btn-dashed py-3 mt-3"
                    >
                      Try Different Code
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JoinTeam
