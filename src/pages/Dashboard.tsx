import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { TYPE_COLORS, TYPE_LABELS } from './Meetings'
import type { Meeting, Registration } from '@/types/database.types'
import { CheckCircle, ChevronRight, MapPin, Calendar, Shield } from '@/lib/cyberIcon'
import { Tabs } from '@/components/Tabs'

interface MeetingWithRegistration extends Meeting {
  userRegistration?: Registration
}

// Parse date string as local timezone (not UTC)
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function Dashboard() {
  const [loaded, setLoaded] = useState(false)
  const [meetings, setMeetings] = useState<MeetingWithRegistration[]>([])
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const { user, userProfile } = useAuth()

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
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  // Get today's date at midnight for comparison
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Get upcoming meetings
  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter(m => parseLocalDate(m.date) >= today)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
  }, [meetings, today])

  // Get past meetings (only show events user actually attended)
  const pastMeetings = useMemo(() => {
    return meetings
      .filter(m => {
        const isPast = parseLocalDate(m.date) < today
        const hasAttended = m.userRegistration?.status === 'attended'
        return isPast && hasAttended
      })
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
  }, [meetings, today])

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
      invited: { label: 'Invited', color: 'bg-hack-cyan text-black' },
      attended: { label: 'Going', color: 'bg-green-600 text-white' },
    }

    return statusConfig[registration.status] || null
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
                        {parseLocalDate(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-600 font-terminal">
                        {parseLocalDate(meeting.date).toLocaleDateString('en-US', { weekday: 'long' })}
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

                        {/* Status Badge - Show for both upcoming and past events */}
                        <div className="flex items-center gap-2">
                          {meeting.userRegistration && getStatusBadge(meeting.userRegistration, activeTab === 'past') ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(meeting.userRegistration, activeTab === 'past')!.color}`}>
                              {getStatusBadge(meeting.userRegistration, activeTab === 'past')!.label}
                            </span>
                          ) : activeTab === 'upcoming' && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-hack-cyan text-black">
                              Invited
                            </span>
                          )}
                        </div>
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

          <div className="grid md:grid-cols-3 gap-6">
            {/* Attendance Ring */}
            <div className="card-hack rounded-lg p-6">
              <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-gray-800"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="text-matrix"
                      strokeDasharray={`${(attendanceCount / Math.max(pastMeetings.length + attendanceCount, 1)) * 251.2} 251.2`}
                      style={{ transition: 'stroke-dasharray 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-matrix">{attendanceCount}</span>
                    <span className="text-[10px] text-gray-500 font-terminal">ATTENDED</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-matrix mb-3">Attendance</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Events Attended</span>
                      <span className="text-matrix font-terminal">{attendanceCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Events</span>
                      <span className="text-gray-400 font-terminal">{meetings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Attendance Rate</span>
                      <span className="text-matrix font-terminal">
                        {meetings.length > 0 ? Math.round((attendanceCount / meetings.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Types Breakdown */}
            <div className="card-hack rounded-lg p-6">
              <h3 className="text-lg font-semibold text-matrix mb-4">Events by Type</h3>
              <div className="space-y-3">
                {(() => {
                  const typeStats = meetings.reduce((acc, m) => {
                    if (!acc[m.type]) {
                      acc[m.type] = { total: 0, attended: 0 }
                    }
                    acc[m.type].total += 1
                    if (m.userRegistration?.status === 'attended') {
                      acc[m.type].attended += 1
                    }
                    return acc
                  }, {} as Record<string, { total: number; attended: number }>)
                  const maxCount = Math.max(...Object.values(typeStats).map(s => s.total), 1)

                  return Object.entries(typeStats).map(([type, stats]) => (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`font-terminal ${TYPE_COLORS[type as keyof typeof TYPE_COLORS]?.split(' ')[1] || 'text-gray-400'}`}>
                          {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
                        </span>
                        <span className="text-gray-500">
                          <span className="text-matrix">{stats.attended}</span>/{stats.total}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                        {/* Attended portion - full color */}
                        <div
                          className={`h-full transition-all duration-700 ${
                            type === 'workshop' ? 'bg-matrix' :
                            type === 'ctf' ? 'bg-hack-cyan' :
                            type === 'social' ? 'bg-hack-purple' :
                            type === 'competition' ? 'bg-hack-orange' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${(stats.attended / maxCount) * 100}%` }}
                        />
                        {/* Non-attended portion - grayed out */}
                        <div
                          className="h-full bg-gray-600 transition-all duration-700"
                          style={{ width: `${((stats.total - stats.attended) / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                })()}
                {Object.keys(meetings.reduce((acc, m) => { acc[m.type] = true; return acc }, {} as Record<string, boolean>)).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No events yet</p>
                )}
              </div>
            </div>

            {/* Activity Overview */}
            <div className="card-hack rounded-lg p-6">
              <h3 className="text-lg font-semibold text-matrix mb-4">Quick Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-matrix/5 border border-matrix/20">
                  <div className="text-2xl font-bold text-matrix">{upcomingMeetings.length}</div>
                  <div className="text-[10px] text-gray-500 font-terminal uppercase mt-1">Upcoming</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-hack-cyan/5 border border-hack-cyan/20">
                  <div className="text-2xl font-bold text-hack-cyan">
                    {meetings.filter(m => m.userRegistration && m.userRegistration.status !== 'cancelled').length}
                  </div>
                  <div className="text-[10px] text-gray-500 font-terminal uppercase mt-1">Registered</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-hack-purple/5 border border-hack-purple/20">
                  <div className="text-2xl font-bold text-hack-purple">
                    {upcomingMeetings.filter(m => m.userRegistration).length}
                  </div>
                  <div className="text-[10px] text-gray-500 font-terminal uppercase mt-1">RSVPs</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${userProfile.student_id ? 'bg-matrix/5 border-matrix/20' : 'bg-hack-yellow/5 border-hack-yellow/20'} border`}>
                  <div className={`text-lg font-bold ${userProfile.student_id ? 'text-matrix' : 'text-hack-yellow'}`}>
                    {userProfile.student_id ? '✓' : '?'}
                  </div>
                  <div className="text-[10px] text-gray-500 font-terminal uppercase mt-1">ID Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Activity Chart */}
          <div className="card-hack rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-matrix mb-4">Monthly Activity</h3>
            <div className="flex items-end gap-2 h-32">
              {(() => {
                const now = new Date()
                const months: { label: string; total: number; attended: number }[] = []

                for (let i = 5; i >= 0; i--) {
                  const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                  const monthMeetings = meetings.filter(m => {
                    const mDate = parseLocalDate(m.date)
                    return mDate.getMonth() === date.getMonth() && mDate.getFullYear() === date.getFullYear()
                  })
                  const attendedMeetings = monthMeetings.filter(m => m.userRegistration?.status === 'attended')
                  months.push({
                    label: date.toLocaleDateString('en-US', { month: 'short' }),
                    total: monthMeetings.length,
                    attended: attendedMeetings.length
                  })
                }

                const maxEvents = Math.max(...months.map(m => m.total), 1)

                return months.map((month, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-24">
                      {/* Stacked bar: attended (color) on bottom, non-attended (gray) on top */}
                      <div
                        className="w-full max-w-8 bg-gray-600 rounded-t transition-all duration-500"
                        style={{
                          height: month.total > 0 ? `${Math.max(((month.total - month.attended) / maxEvents) * 100, 0)}%` : '0'
                        }}
                      />
                      <div
                        className={`w-full max-w-8 transition-all duration-500 ${
                          month.attended > 0 ? 'bg-gradient-to-t from-matrix/50 to-matrix' : ''
                        } ${month.total > 0 && month.attended === 0 ? '' : month.total === 0 ? 'rounded-t bg-gray-800' : ''}`}
                        style={{
                          height: month.attended > 0 ? `${Math.max((month.attended / maxEvents) * 100, 15)}%` : month.total === 0 ? '8px' : '0'
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 font-terminal">{month.label}</span>
                  </div>
                ))
              })()}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-matrix"></span>
                  Attended
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-600"></span>
                  Not attended
                </span>
              </div>
              <span><span className="text-matrix">{attendanceCount}</span>/{meetings.length} events</span>
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
      </div>
    </div>
  )
}

export default Dashboard
