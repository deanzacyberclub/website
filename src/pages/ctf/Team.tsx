import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Users, Trophy, Copy, Check, Logout, Star, ChevronRight, Trash, Settings } from '@/lib/cyberIcon'
import type { CTFTeamWithMembers, CTFSubmission } from '@/types/database.types'
import { challenges } from './challengeData'
import ConfirmDialog from '@/components/ConfirmDialog'

// Set to true when CTF hackathon is active - members cannot be removed during this time
const CTF_HACKATHON_ACTIVE = false

function Team() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [team, setTeam] = useState<CTFTeamWithMembers | null>(null)
  const [submissions, setSubmissions] = useState<CTFSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [transferring, setTransferring] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [showInviteSettings, setShowInviteSettings] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [inviteExpiration, setInviteExpiration] = useState<string>('7')
  const [inviteMaxUses, setInviteMaxUses] = useState<string>('unlimited')

  const fetchTeam = useCallback(async () => {
    if (!user) return

    try {
      // Check if user is in a team
      const { data: membership } = await supabase
        .from('ctf_team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single()

      if (membership) {
        // Fetch team details with members
        const { data: teamData } = await supabase
          .from('ctf_teams')
          .select(`
            *,
            captain:users!ctf_teams_captain_id_fkey(id, display_name, photo_url)
          `)
          .eq('id', membership.team_id)
          .single()

        if (teamData) {
          // Fetch members
          const { data: members } = await supabase
            .from('ctf_team_members')
            .select(`
              *,
              user:users(id, display_name, photo_url)
            `)
            .eq('team_id', membership.team_id)

          // Fetch submissions
          const { data: subs } = await supabase
            .from('ctf_submissions')
            .select(`
              *,
              user:users(id, display_name)
            `)
            .eq('team_id', membership.team_id)
            .order('submitted_at', { ascending: false })

          setTeam({
            ...teamData,
            members: members || [],
            captain: teamData.captain
          })
          setSubmissions(subs || [])
        }
      }
    } catch (err) {
      console.error('Error fetching team:', err)
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [user])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !teamName.trim()) return

    setCreating(true)
    setError('')

    try {
      const inviteCode = generateInviteCode()

      // Create team
      const { data: newTeam, error: teamError } = await supabase
        .from('ctf_teams')
        .insert({
          name: teamName.trim(),
          invite_code: inviteCode,
          captain_id: user.id
        })
        .select()
        .single()

      if (teamError) throw teamError

      // Add captain as first member
      const { error: memberError } = await supabase
        .from('ctf_team_members')
        .insert({
          team_id: newTeam.id,
          user_id: user.id
        })

      if (memberError) throw memberError

      // Refresh team data
      await fetchTeam()
    } catch (err: any) {
      console.error('Error creating team:', err)
      if (err.message?.includes('unique')) {
        setError('You are already in a team. Leave your current team first.')
      } else {
        setError('Failed to create team. Please try again.')
      }
    } finally {
      setCreating(false)
    }
  }

  const leaveTeam = async () => {
    if (!user || !team) return

    const confirmLeave = window.confirm(
      team.captain_id === user.id
        ? 'You are the captain. Leaving will delete the entire team. Are you sure?'
        : 'Are you sure you want to leave this team?'
    )

    if (!confirmLeave) return

    try {
      if (team.captain_id === user.id) {
        // Delete entire team (cascade will handle members)
        await supabase.from('ctf_teams').delete().eq('id', team.id)
      } else {
        // Just remove membership
        await supabase
          .from('ctf_team_members')
          .delete()
          .eq('team_id', team.id)
          .eq('user_id', user.id)
      }

      setTeam(null)
      setSubmissions([])
    } catch (err) {
      console.error('Error leaving team:', err)
    }
  }

  const copyInviteLink = () => {
    if (!team) return
    const link = `${window.location.origin}/ctf/join/${team.invite_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const transferCaptain = async (newCaptainId: string) => {
    if (!user || !team || team.captain_id !== user.id) return

    const member = team.members.find(m => m.user_id === newCaptainId)
    if (!member) return

    const confirmTransfer = window.confirm(
      `Are you sure you want to make ${member.user?.display_name} the new team captain? You will no longer be able to delete the team or transfer captaincy.`
    )

    if (!confirmTransfer) return

    setTransferring(newCaptainId)

    try {
      const { error } = await supabase
        .from('ctf_teams')
        .update({ captain_id: newCaptainId })
        .eq('id', team.id)

      if (error) throw error

      // Refresh team data
      await fetchTeam()
    } catch (err) {
      console.error('Error transferring captaincy:', err)
      setError('Failed to transfer captaincy. Please try again.')
    } finally {
      setTransferring(null)
    }
  }

  const regenerateInviteLink = async () => {
    if (!user || !team || team.captain_id !== user.id) return

    setRegenerating(true)

    try {
      const newInviteCode = generateInviteCode()

      // Calculate expiration date
      let expiresAt: string | null = null
      if (inviteExpiration !== 'never') {
        const days = parseInt(inviteExpiration)
        const expDate = new Date()
        expDate.setDate(expDate.getDate() + days)
        expiresAt = expDate.toISOString()
      }

      // Calculate max uses
      const maxUses = inviteMaxUses === 'unlimited' ? null : parseInt(inviteMaxUses)

      const { error } = await supabase
        .from('ctf_teams')
        .update({
          invite_code: newInviteCode,
          invite_expires_at: expiresAt,
          invite_max_uses: maxUses,
          invite_uses_count: 0
        })
        .eq('id', team.id)

      if (error) throw error

      await fetchTeam()
      setShowRegenerateDialog(false)
      setShowInviteSettings(false)
    } catch (err) {
      console.error('Error regenerating invite link:', err)
      setError('Failed to regenerate invite link. Please try again.')
    } finally {
      setRegenerating(false)
    }
  }

  const removeMember = async (memberId: string) => {
    if (!user || !team || team.captain_id !== user.id) return
    if (memberId === user.id) return // Can't remove yourself
    if (CTF_HACKATHON_ACTIVE) {
      setError('Cannot remove members during an active CTF hackathon.')
      return
    }

    setRemovingMember(memberId)

    try {
      const { error } = await supabase
        .from('ctf_team_members')
        .delete()
        .eq('team_id', team.id)
        .eq('user_id', memberId)

      if (error) throw error

      await fetchTeam()
    } catch (err) {
      console.error('Error removing member:', err)
      setError('Failed to remove member. Please try again.')
    } finally {
      setRemovingMember(null)
    }
  }

  const getExpirationLabel = (days: string) => {
    switch (days) {
      case '1': return '1 day'
      case '2': return '2 days'
      case '7': return '7 days'
      case '14': return '14 days'
      case '30': return '30 days'
      case 'never': return 'Never'
      default: return days + ' days'
    }
  }

  const getChallenge = (id: string) => challenges.find(c => c.id === id)

  const stats = {
    totalPoints: submissions.filter(s => s.is_correct).reduce((sum, s) => sum + s.points_awarded, 0),
    solved: submissions.filter(s => s.is_correct).length,
    incorrect: submissions.filter(s => !s.is_correct).length
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-500 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to manage your CTF team.</p>
          <Link to="/auth" className="cli-btn-filled  px-6 py-3">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/ctf"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-matrix transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-terminal text-sm">Back to CTF</span>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-gray-900 dark:text-white">My</span>{' '}
            <span className="neon-text">Team</span>
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="font-terminal text-lg text-blue-600 dark:text-matrix dark:neon-pulse">Loading...</div>
          </div>
        ) : !team ? (
          /* Create Team Form */
          <div className={`transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="terminal-window max-w-md mx-auto">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">create_team.sh</span>
              </div>
              <div className="terminal-body">
                <div className="text-center mb-6">
                  <Users className="w-12 h-12 text-blue-600 dark:text-matrix mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Your Team</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    You must be in a team to participate in the CTF.
                    Create a team or join one with an invite link.
                  </p>
                </div>

                <form onSubmit={createTeam}>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2 font-terminal">
                      TEAM NAME
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name..."
                      maxLength={50}
                      className="w-full input-hack "
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={creating || !teamName.trim()}
                    className="w-full cli-btn-filled  py-3 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Team'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-gray-600 dark:text-gray-500 text-sm mb-3">Have an invite code?</p>
                  <button
                    onClick={() => navigate('/ctf/join')}
                    className="cli-btn-dashed px-6 py-2 text-sm"
                  >
                    Join Existing Team
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Team Dashboard */
          <>
            {/* Team Info Card */}
            <div className={`mb-8 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">team_info.json</span>
                </div>
                <div className="terminal-body">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-600 dark:text-matrix dark:neon-text-subtle mb-2">
                        {team.name}
                      </h2>
                      <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 text-sm">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {team.members.length}/4 members
                        </span>
                        <span className="flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          {stats.totalPoints} points
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        to="/ctf/leaderboard"
                        className="cli-btn-dashed px-4 py-2 text-sm flex items-center gap-2"
                      >
                        <Trophy className="w-4 h-4" />
                        Leaderboard
                      </Link>
                      <button
                        onClick={leaveTeam}
                        className="px-4 py-2  text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <Logout className="w-4 h-4" />
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className={`grid grid-cols-3 gap-4 mb-8 transition-all duration-700 delay-150 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="card-hack  p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-matrix">{stats.totalPoints}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 font-terminal">POINTS</div>
              </div>
              <div className="card-hack  p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.solved}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 font-terminal">SOLVED</div>
              </div>
              <div className="card-hack  p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{stats.incorrect}</div>
                <div className="text-xs text-gray-600 dark:text-gray-500 font-terminal">INCORRECT</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Members */}
              <div className={`transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="terminal-window h-full">
                  <div className="terminal-header">
                    <div className="terminal-dot red" />
                    <div className="terminal-dot yellow" />
                    <div className="terminal-dot green" />
                    <span className="ml-4 text-xs text-gray-500 font-terminal">team_members.log</span>
                  </div>
                  <div className="terminal-body">
                    <h3 className="text-sm text-gray-500 font-terminal mb-4">MEMBERS ({team.members.length}/4)</h3>
                    <div className="space-y-3">
                      {team.members.map(member => (
                        <div key={member.id} className="flex items-center gap-3">
                          {member.user?.photo_url ? (
                            <img
                              src={member.user.photo_url}
                              alt={member.user.display_name}
                              className="w-10 h-10  border border-matrix/30"
                            />
                          ) : (
                            <div className="w-10 h-10  bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-300 dark:border-gray-600">
                              <span className="text-gray-400 font-bold">
                                {member.user?.display_name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                              {member.user?.display_name}
                              {member.user_id === team.captain_id && (
                                <Star className="w-4 h-4 text-yellow-400" />
                              )}
                              {member.user_id === user?.id && (
                                <span className="text-xs text-blue-600 dark:text-matrix">(You)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-500">
                              {member.user_id === team.captain_id ? 'Captain' : 'Member'}
                            </div>
                          </div>
                          {/* Captain actions - only visible to current captain for other members */}
                          {user?.id === team.captain_id && member.user_id !== team.captain_id && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => transferCaptain(member.user_id)}
                                disabled={transferring === member.user_id}
                                className="px-3 py-1 text-xs  border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
                                title="Make Captain"
                              >
                                {transferring === member.user_id ? '...' : 'Captain'}
                              </button>
                              {!CTF_HACKATHON_ACTIVE && (
                                <button
                                  onClick={() => removeMember(member.user_id)}
                                  disabled={removingMember === member.user_id}
                                  className="p-1  border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                  title="Remove from team"
                                >
                                  {removingMember === member.user_id ? (
                                    <span className="w-4 h-4 block">...</span>
                                  ) : (
                                    <Trash className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {CTF_HACKATHON_ACTIVE && user?.id === team.captain_id && team.members.length > 1 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400/70 mt-3 italic">
                        Team members cannot be removed during an active CTF hackathon.
                      </p>
                    )}

                    {team.members.length < 4 && (() => {
                      // Check if invite link is expired or used up
                      const isExpired = team.invite_expires_at && new Date(team.invite_expires_at) < new Date()
                      const isUsedUp = team.invite_max_uses && (team.invite_uses_count || 0) >= team.invite_max_uses
                      const isInviteInvalid = isExpired || isUsedUp

                      return (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-gray-500 font-terminal">INVITE LINK</p>
                            {user?.id === team.captain_id && !isInviteInvalid && (
                              <button
                                onClick={() => setShowInviteSettings(!showInviteSettings)}
                                className="text-xs text-gray-400 hover:text-gray-900 dark:text-matrix transition-colors flex items-center gap-1"
                              >
                                <Settings className="w-3 h-3" />
                                Settings
                              </button>
                            )}
                          </div>

                          {/* Invalid Invite State - Expired or Used Up */}
                          {isInviteInvalid ? (
                            <div className="p-4  bg-red-500/10 border border-red-500/30">
                              <div className="flex items-start gap-3">
                                <div className="p-2  bg-red-500/20">
                                  <Settings className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-red-400 font-medium mb-1">
                                    {isExpired ? 'Invite Link Expired' : 'Use Limit Reached'}
                                  </h4>
                                  <p className="text-gray-400 text-sm mb-3">
                                    {isExpired
                                      ? `This invite link expired on ${new Date(team.invite_expires_at!).toLocaleDateString()}.`
                                      : `This invite link has reached its maximum of ${team.invite_max_uses} uses.`
                                    }
                                    {user?.id === team.captain_id
                                      ? ' Generate a new invite link to invite more members.'
                                      : ' Ask your team captain to generate a new invite link.'
                                    }
                                  </p>
                                  {user?.id === team.captain_id && (
                                    <button
                                      onClick={() => {
                                        setShowInviteSettings(true)
                                        setShowRegenerateDialog(true)
                                      }}
                                      className="cli-btn-filled  px-4 py-2 text-sm"
                                    >
                                      Generate New Invite Link
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Invite Settings Panel */}
                              {showInviteSettings && user?.id === team.captain_id && (
                                <div className="mb-4 p-3  bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
                                  <div>
                                    <label className="text-xs text-gray-400 block mb-1">Expires in</label>
                                    <select
                                      value={inviteExpiration}
                                      onChange={(e) => setInviteExpiration(e.target.value)}
                                      className="w-full input-hack  text-sm py-2"
                                    >
                                      <option value="1">1 day</option>
                                      <option value="2">2 days</option>
                                      <option value="7">7 days</option>
                                      <option value="14">14 days</option>
                                      <option value="30">30 days</option>
                                      <option value="never">Never</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-400 block mb-1">Max uses</label>
                                    <select
                                      value={inviteMaxUses}
                                      onChange={(e) => setInviteMaxUses(e.target.value)}
                                      className="w-full input-hack  text-sm py-2"
                                    >
                                      <option value="unlimited">Unlimited (until full)</option>
                                      <option value="1">1 use</option>
                                      <option value="2">2 uses</option>
                                      <option value="3">3 uses</option>
                                      <option value="5">5 uses</option>
                                      <option value="10">10 uses</option>
                                    </select>
                                  </div>
                                  <button
                                    onClick={() => setShowRegenerateDialog(true)}
                                    className="w-full px-4 py-2 text-sm  border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    Regenerate Link
                                  </button>
                                  <p className="text-xs text-gray-500 text-center">
                                    Regenerating will invalidate the current invite link.
                                  </p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={`${window.location.origin}/ctf/join/${team.invite_code}`}
                                  readOnly
                                  className="flex-1 input-hack  text-sm py-2"
                                />
                                <button
                                  onClick={copyInviteLink}
                                  className="cli-btn-dashed px-4 flex items-center gap-2"
                                >
                                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>

                              {/* Show current invite settings if they exist */}
                              {team.invite_expires_at && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Expires: {new Date(team.invite_expires_at).toLocaleDateString()}
                                  {team.invite_max_uses && ` • ${team.invite_max_uses - (team.invite_uses_count || 0)} uses remaining`}
                                </p>
                              )}
                              {!team.invite_expires_at && team.invite_max_uses && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {team.invite_max_uses - (team.invite_uses_count || 0)} uses remaining
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Recent Submissions */}
              <div className={`transition-all duration-700 delay-250 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="terminal-window h-full">
                  <div className="terminal-header">
                    <div className="terminal-dot red" />
                    <div className="terminal-dot yellow" />
                    <div className="terminal-dot green" />
                    <span className="ml-4 text-xs text-gray-500 font-terminal">submissions.log</span>
                  </div>
                  <div className="terminal-body">
                    <h3 className="text-sm text-gray-600 dark:text-gray-500 font-terminal mb-4">RECENT SUBMISSIONS</h3>
                    {submissions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-500">No submissions yet</p>
                        <Link
                          to="/ctf/challenges"
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-matrix hover:text-blue-700 dark:hover:text-matrix/80 mt-2 text-sm"
                        >
                          Start solving challenges
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {submissions.slice(0, 10).map(sub => {
                          const challenge = getChallenge(sub.challenge_id)
                          return (
                            <div
                              key={sub.id}
                              className={`p-3  border ${
                                sub.is_correct
                                  ? 'border-green-500/30 bg-green-500/5'
                                  : 'border-red-500/30 bg-red-500/5'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className={`font-medium text-sm ${sub.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                                    {challenge?.title || sub.challenge_id}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    by {sub.user?.display_name} • {new Date(sub.submitted_at).toLocaleTimeString()}
                                  </div>
                                </div>
                                <div className={`text-sm font-bold ${sub.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                                  {sub.is_correct ? `+${sub.points_awarded}` : '✗'}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Start Hacking CTA */}
            <div className={`mt-8 text-center transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Link
                to="/ctf/challenges"
                className="cli-btn-filled  px-8 py-4 inline-flex items-center gap-3"
              >
                Start Hacking
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Regenerate Invite Link Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRegenerateDialog}
        onClose={() => setShowRegenerateDialog(false)}
        onConfirm={regenerateInviteLink}
        title="Regenerate Invite Link?"
        message={`This will create a new invite link with the selected settings (expires in ${getExpirationLabel(inviteExpiration)}, ${inviteMaxUses === 'unlimited' ? 'unlimited uses' : inviteMaxUses + ' uses'}). The current invite link will immediately stop working.`}
        confirmText="REGENERATE"
        cancelText="CANCEL"
        loading={regenerating}
        variant="danger"
      />
    </div>
  )
}

export default Team
