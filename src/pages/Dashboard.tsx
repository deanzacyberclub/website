import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { TYPE_COLORS, TYPE_LABELS } from './Meetings'
import type { Meeting, Registration, PathwayProgress } from '@/types/database.types'
import { Spinner, Warning, CheckCircle, ChevronRight, Clock, MapPin, Calendar, Shield } from '@/lib/cyberIcon'
import { Tabs } from '@/components/Tabs'

interface MeetingWithRegistration extends Meeting {
  userRegistration?: Registration
}

function Dashboard() {
  const [loaded, setLoaded] = useState(false)
  const [meetings, setMeetings] = useState<MeetingWithRegistration[]>([])
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [pathwayProgress, setPathwayProgress] = useState<PathwayProgress[]>([])
  const { user, userProfile, signOut, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch meetings
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('*')
          .order('date', { ascending: true })

        if (meetingsData && user) {
          // Fetch user's registrations for all meetings
          const { data: registrationsData } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', user.id)

          // Map registrations to meetings
          const meetingsWithRegistrations: MeetingWithRegistration[] = meetingsData.map(meeting => {
            const registration = registrationsData?.find(r => r.meeting_id === meeting.id)
            return {
              ...meeting,
              userRegistration: registration
            }
          })

          setMeetings(meetingsWithRegistrations)
        } else if (meetingsData) {
          setMeetings(meetingsData)
        }

        // Fetch user's attendance count
        if (user) {
          const { count } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          setAttendanceCount(count || 0)

          // Fetch pathway progress
          const { data: pathwayData } = await supabase
            .from('pathway_progress')
            .select('*, pathways!inner(*)')
            .eq('user_id', user.id)
            .eq('pathways.is_active', true)

          if (pathwayData) {
            setPathwayProgress(pathwayData as PathwayProgress[])
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?to=/dashboard')
    }
  }, [user, loading, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // Get upcoming meetings
  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter(m => new Date(m.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [meetings])

  // Get past meetings (show events user was registered for or attended)
  const pastMeetings = useMemo(() => {
    return meetings
      .filter(m => {
        const isPast = new Date(m.date) < new Date()
        const hasRegistration = m.userRegistration && m.userRegistration.status !== 'cancelled'
        return isPast && hasRegistration
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [meetings])

  // Get displayed meetings based on active tab
  const displayedMeetings = activeTab === 'upcoming' ? upcomingMeetings : pastMeetings

  // Get status badge info
  const getStatusBadge = (registration?: Registration, isPastEvent = false) => {
    if (!registration || registration.status === 'cancelled') {
      return null
    }

    // For past events, show different labels
    if (isPastEvent) {
      const pastStatusConfig = {
        attended: { label: 'Attended', color: 'bg-matrix text-black' },
        registered: { label: 'Registered', color: 'bg-gray-600 text-white' },
        waitlist: { label: 'Waitlisted', color: 'bg-hack-yellow text-black' },
        invited: { label: 'Invited', color: 'bg-hack-orange text-white' },
      }
      return pastStatusConfig[registration.status] || null
    }

    // For upcoming events
    const statusConfig = {
      registered: { label: 'Going', color: 'bg-green-600 text-white' },
      waitlist: { label: 'Waitlist', color: 'bg-hack-yellow text-black' },
      invited: { label: 'Pending', color: 'bg-hack-orange text-white' },
      attended: { label: 'Going', color: 'bg-green-600 text-white' },
    }

    return statusConfig[registration.status] || null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="flex items-center gap-3 justify-center">
            <Spinner className="animate-spin h-6 w-6 text-matrix" />
            <span className="font-terminal text-lg neon-pulse">Loading session...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // User is signed in but has no profile - show setup prompt
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix">
        <div className="crt-overlay" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-3xl font-bold neon-text tracking-tight mb-2">PROFILE REQUIRED</h1>
            <p className="text-gray-500">
              <span className="text-hack-yellow">[WARNING]</span> Complete your profile to access the dashboard
            </p>
          </header>

          <div
            className={`terminal-window max-w-md transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">profile_incomplete.sh</span>
            </div>
            <div className="terminal-body text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-hack-yellow/10 border border-hack-yellow/30 flex items-center justify-center">
                <Warning className="w-8 h-8 text-hack-yellow" />
              </div>
              <h3 className="text-hack-yellow font-bold text-lg mb-2">PROFILE NOT FOUND</h3>
              <p className="text-gray-500 text-sm mb-6">
                Complete your profile to access all features.
              </p>
              <Link
                to="/auth"
                className="btn-hack-filled rounded-lg inline-flex items-center gap-2"
              >
                SETUP PROFILE
              </Link>
              <div className="mt-4">
                <button
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-matrix text-xs font-terminal transition-colors"
                >
                  Sign out and use a different account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header with user info */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <h1 className="text-3xl font-bold neon-text tracking-tight mb-1">
              Welcome, {userProfile.display_name}
            </h1>
          </div>
        </header>

        {/* Main Action: Check-in */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '100ms' }}
        >
          <Link
            to="/live"
            className="block terminal-window group hover:scale-[1.01] transition-transform"
          >
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">attendance_check_in.sh</span>
              <span className="ml-auto text-xs text-hack-cyan font-terminal animate-pulse">READY</span>
            </div>
            <div className="terminal-body">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center group-hover:neon-box transition-shadow shrink-0">
                  <CheckCircle className="w-8 h-8 text-matrix" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-matrix mb-1">Mark Attendance</h2>
                  <p className="text-gray-500 text-sm">
                    At a meeting? Enter the secret code to check in and record your attendance.
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-matrix/50 group-hover:text-matrix group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </div>

        {/* Officer Dashboard - Only for officers */}
        {userProfile.is_officer && (
          <div
            className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '150ms' }}
          >
            <Link
              to="/officer"
              className="block terminal-window group hover:scale-[1.01] transition-transform"
            >
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">officer_dashboard.sh</span>
                <span className="ml-auto text-xs text-hack-purple font-terminal">ADMIN</span>
              </div>
              <div className="terminal-body">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-lg bg-hack-purple/10 border border-hack-purple/30 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-shadow shrink-0">
                    <Shield className="w-8 h-8 text-hack-purple" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-hack-purple mb-1">Officer Dashboard</h2>
                    <p className="text-gray-500 text-sm">
                      Manage members, view registrations, and access admin tools.
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-hack-purple/50 group-hover:text-hack-purple group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* My Learning */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-matrix">My Learning</h2>
            <Link
              to="/study"
              className="text-sm font-terminal text-matrix hover:neon-text-subtle transition-all flex items-center gap-1"
            >
              View All Pathways
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {pathwayProgress.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {pathwayProgress.map((progress) => {
                const pathway = (progress as any).pathways
                return (
                  <Link
                    key={progress.id}
                    to="/study"
                    className="card-hack rounded-lg p-5 group hover:scale-[1.01] transition-transform"
                  >
                    <div className="flex items-start gap-4">
                      {pathway?.icon && (
                        <div className="text-3xl shrink-0">{pathway.icon}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                          {pathway?.title || 'Pathway'}
                        </h3>
                        <p className="text-xs text-gray-500 font-terminal mb-3">
                          {progress.lessons_completed} / {progress.total_lessons} lessons completed
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1 text-xs font-terminal">
                            <span className="text-gray-500">Progress</span>
                            <span className="text-matrix">{progress.completion_percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-terminal-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-matrix transition-all duration-500"
                              style={{ width: `${progress.completion_percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 text-xs font-terminal text-gray-500">
                          {progress.current_streak_days > 0 && (
                            <span>
                              🔥 {progress.current_streak_days} day streak
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-matrix/50 group-hover:text-matrix group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Link
              to="/study"
              className="block terminal-window group hover:scale-[1.01] transition-transform"
            >
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">learning_pathways.sh</span>
              </div>
              <div className="terminal-body text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center">
                    <span className="text-3xl">📚</span>
                  </div>
                  <h3 className="text-xl font-bold text-matrix mb-3">Start Your Learning Journey</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Choose from Security+ or Professional Ethical Hacker pathways and start learning with interactive lessons, quizzes, and hands-on challenges.
                  </p>
                  <div className="inline-flex items-center gap-2 text-matrix font-terminal text-sm group-hover:neon-text-subtle transition-all">
                    Browse Study Pathways
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Events */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-matrix">My Events</h2>
            <Tabs
              tabs={[
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'past', label: 'Past' },
              ]}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as 'upcoming' | 'past')}
            />
          </div>

          {displayedMeetings.length > 0 ? (
            <div className="space-y-0">
              {displayedMeetings.map((meeting, index) => (
                <div key={meeting.id} className="flex gap-4">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="text-left w-24">
                      <div className="text-sm font-terminal text-gray-400">
                        {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-600 font-terminal">
                        {new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </div>
                    </div>
                    <div className="flex flex-col items-center flex-1 mt-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                      {index < displayedMeetings.length - 1 && (
                        <div className="h-full min-h-[60px] border-l-2 border-dotted border-gray-700" />
                      )}
                    </div>
                  </div>

                  {/* Event card */}
                  <Link
                    to={`/meetings/${meeting.slug}`}
                    className="flex-1 card-hack rounded-lg p-5 group hover:scale-[1.01] transition-transform mb-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-400 text-sm font-terminal">
                            {meeting.time}
                          </span>
                        </div>
                        <h3 className="text-matrix font-semibold text-lg mb-3 group-hover:neon-text-subtle transition-all">
                          {meeting.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                            {TYPE_LABELS[meeting.type]}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {meeting.location}
                          </span>
                        </div>

                        {/* Status Badge - Show for both upcoming and past events with registration */}
                        {meeting.userRegistration && getStatusBadge(meeting.userRegistration, activeTab === 'past') && (
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(meeting.userRegistration, activeTab === 'past')!.color}`}>
                              {getStatusBadge(meeting.userRegistration, activeTab === 'past')!.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
              </div>
              <div className="terminal-body text-center py-16">
                <div className="max-w-md mx-auto">
                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-gray-600" />
                  </div>

                  {/* Message */}
                  <h3 className="text-xl font-bold text-gray-300 mb-3">
                    {activeTab === 'upcoming'
                      ? 'No upcoming events yet'
                      : 'No past events'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-8">
                    {activeTab === 'upcoming'
                      ? 'Check out our meetings page to discover and register for upcoming events and workshops.'
                      : 'Events you attend will appear here. Register for upcoming events to start building your event history.'}
                  </p>

                  {/* CTA Button */}
                  <Link
                    to="/meetings"
                    className="btn-hack-filled px-8 py-3 rounded-lg inline-flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    {activeTab === 'upcoming' ? 'Browse All Events' : 'Explore Events'}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* My Stats */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '400ms' }}
        >
          <h2 className="text-2xl font-bold text-matrix mb-6">My Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-hack rounded-lg p-5">
              <div className="text-3xl font-bold text-matrix mb-2">{attendanceCount}</div>
              <div className="text-xs text-gray-500 font-terminal uppercase">Events Attended</div>
            </div>
            <div className="card-hack rounded-lg p-5">
              <div className="text-3xl font-bold text-matrix mb-2">
                {meetings.filter(m => m.userRegistration && m.userRegistration.status !== 'cancelled').length}
              </div>
              <div className="text-xs text-gray-500 font-terminal uppercase">Total Registered</div>
            </div>
            <div className="card-hack rounded-lg p-5">
              <div className="text-3xl font-bold text-matrix mb-2">{upcomingMeetings.filter(m => m.userRegistration).length}</div>
              <div className="text-xs text-gray-500 font-terminal uppercase">Upcoming RSVPs</div>
            </div>
            <div className="card-hack rounded-lg p-5">
              <div className={`text-3xl font-bold mb-2 ${userProfile.student_id ? 'text-matrix' : 'text-hack-yellow'}`}>
                {userProfile.student_id ? 'Verified' : 'Pending'}
              </div>
              <div className="text-xs text-gray-500 font-terminal uppercase">Student Status</div>
            </div>
          </div>
        </div>

        {/* Browse All Events CTA */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '500ms' }}
        >
          <Link
            to="/meetings"
            className="block card-hack rounded-lg p-6 group hover:scale-[1.01] transition-transform text-center"
          >
            <div className="flex items-center justify-center gap-3">
              <Calendar className="w-6 h-6 text-matrix" />
              <span className="text-matrix font-semibold">Browse All Events & Meetings</span>
              <ChevronRight className="w-5 h-5 text-matrix/50 group-hover:text-matrix group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '600ms' }}
        >
          <div className="card-hack rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-matrix">{meetings.length}</div>
            <div className="text-xs text-gray-500 font-terminal mt-1">TOTAL EVENTS</div>
          </div>
          <div className="card-hack rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-matrix">{upcomingMeetings.length}</div>
            <div className="text-xs text-gray-500 font-terminal mt-1">UPCOMING</div>
          </div>
          <div className="card-hack rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-matrix">{attendanceCount}</div>
            <div className="text-xs text-gray-500 font-terminal mt-1">CHECK-INS</div>
          </div>
          <div className="card-hack rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${userProfile.student_id ? 'text-matrix' : 'text-hack-yellow'}`}>
              {userProfile.student_id ? 'SET' : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 font-terminal mt-1">STUDENT ID</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
