import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { TYPE_COLORS, TYPE_LABELS } from './Meetings'
import type { Meeting } from '@/types/database.types'
import { Spinner, Warning, CheckCircle, ChevronRight, Clock, MapPin, Calendar } from '@/lib/cyberIcon'

function Dashboard() {
  const [loaded, setLoaded] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [attendanceCount, setAttendanceCount] = useState(0)
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

        if (meetingsData) setMeetings(meetingsData)

        // Fetch user's attendance count
        if (user) {
          const { count } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          setAttendanceCount(count || 0)
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
      navigate('/auth')
    }
  }, [user, loading, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // Get auth provider from user metadata
  const getAuthProvider = () => {
    const provider = user?.app_metadata?.provider
    switch (provider) {
      case 'github':
        return 'GITHUB'
      case 'discord':
        return 'DISCORD'
      case 'x':
        return 'X'
      default:
        return provider?.toUpperCase() || 'OAUTH'
    }
  }

  // Get upcoming meetings (next 3)
  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter(m => new Date(m.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)
  }, [meetings])

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
            <p className="text-gray-500 text-sm font-terminal">
              <span className="text-hack-cyan">[{getAuthProvider()}]</span> {user.email}
            </p>
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

        {/* Upcoming Events */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-matrix">Upcoming Events</h2>
            <Link
              to="/meetings"
              className="text-sm text-gray-500 hover:text-matrix font-terminal transition-colors inline-flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  to={`/meetings/${meeting.slug}`}
                  className="block card-hack rounded-lg p-4 group hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-center shrink-0 w-14">
                      <div className="text-2xl font-bold text-matrix">
                        {new Date(meeting.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-500 uppercase font-terminal">
                        {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                          {TYPE_LABELS[meeting.type]}
                        </span>
                      </div>
                      <h3 className="text-matrix font-semibold truncate group-hover:neon-text-subtle transition-all">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meeting.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {meeting.location}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-matrix/30 group-hover:text-matrix group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
              </div>
              <div className="terminal-body text-center py-8">
                <p className="text-gray-500">No upcoming events scheduled</p>
                <Link to="/meetings" className="text-matrix text-sm hover:underline mt-2 inline-block">
                  View past events
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Browse All Events CTA */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '300ms' }}
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
          style={{ transitionDelay: '400ms' }}
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
