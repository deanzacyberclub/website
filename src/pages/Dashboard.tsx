import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useOfficerVerification } from '@/hooks/useOfficerVerification'
import { supabase } from '@/lib/supabase'
import { TYPE_COLORS, TYPE_LABELS } from './Meetings'
import type { Meeting, Registration } from '@/types/database.types'
import { CheckCircle, ChevronRight, MapPin, Calendar, Shield, ExternalLink, Copy, Check, Clock } from '@/lib/cyberIcon'
import { Tabs } from '@/components/Tabs'
import { getCtfdCredentials } from '@/lib/ctfd'
import { useInView } from '@/hooks/useInView'

interface MeetingWithRegistration extends Meeting {
  userRegistration?: Registration
}

// Parse date string as local timezone (not UTC)
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// ─── Section Header ──────────────────────────────────
function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-mono text-xs text-green-600/40 dark:text-matrix/30">[{index}]</span>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-matrix uppercase tracking-wide">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-matrix/20 to-transparent" />
    </div>
  )
}

// ─── Scroll Reveal Wrapper ───────────────────────────
function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─── Animated Counter ────────────────────────────────
function AnimatedCounter({ value, inView }: { value: number; inView: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const startTime = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [inView, value])

  return <span>{count}</span>
}

// ─── Action Card ─────────────────────────────────────
function ActionCard({
  to,
  onClick,
  icon: Icon,
  title,
  description,
  headerFile,
  headerTag,
  tagColor,
  iconBg,
  iconBorder,
  iconColor,
}: {
  to?: string
  onClick?: () => void
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  headerFile: string
  headerTag: string
  tagColor: string
  iconBg: string
  iconBorder: string
  iconColor: string
}) {
  const content = (
    <div className="terminal-window group cursor-pointer hover:border-green-500 dark:hover:border-matrix/40 transition-all duration-300 relative overflow-hidden">
      {/* Hover glow line */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 dark:via-matrix to-transparent" />
      </div>

      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-4 text-xs text-gray-500 font-terminal">{headerFile}</span>
        <span className={`ml-auto text-xs font-terminal ${tagColor}`}>{headerTag}</span>
      </div>
      <div className="terminal-body">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 ${iconBg} border ${iconBorder} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-matrix mb-1 group-hover:tracking-wider transition-all duration-300">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-500 text-sm">
              {description}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-matrix/30 group-hover:text-green-600 dark:group-hover:text-matrix group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>
    </div>
  )

  if (to) {
    return <Link to={to} className="block">{content}</Link>
  }
  return <div onClick={onClick}>{content}</div>
}

function Dashboard() {
  const [loaded, setLoaded] = useState(false)
  const [meetings, setMeetings] = useState<MeetingWithRegistration[]>([])
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const { user, userProfile } = useAuth()
  const { isVerifiedOfficer } = useOfficerVerification()
  const [ctfdCreds, setCtfdCreds] = useState<{ ctfd_username: string | null; ctfd_password: string | null } | null>(null)
  const [ctfdCopied, setCtfdCopied] = useState<string | null>(null)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    if (user) {
      getCtfdCredentials().then(setCtfdCreds).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: meetingsData } = await supabase
          .from('meetings_public')
          .select('*')
          .order('date', { ascending: true })

        if (meetingsData && user) {
          const { data: registrationsData } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', user.id)

          const meetingsWithRegistrations: MeetingWithRegistration[] = meetingsData.map(meeting => {
            const registration = registrationsData?.find(r => r.meeting_id === meeting.id)
            return {
              ...meeting as Meeting,
              userRegistration: registration
            }
          })

          setMeetings(meetingsWithRegistrations)
        } else if (meetingsData) {
          setMeetings(meetingsData as Meeting[])
        }

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

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter(m => parseLocalDate(m.date) >= today)
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
  }, [meetings, today])

  const pastMeetings = useMemo(() => {
    return meetings
      .filter(m => {
        const isPast = parseLocalDate(m.date) < today
        const hasAttended = m.userRegistration?.status === 'attended'
        return isPast && hasAttended
      })
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
  }, [meetings, today])

  const displayedMeetings = activeTab === 'upcoming' ? upcomingMeetings : pastMeetings

  const getStatusBadge = (registration?: Registration, isPastEvent = false) => {
    if (!registration || registration.status === 'cancelled') {
      return null
    }

    if (isPastEvent) {
      const pastStatusConfig = {
        attended: { label: 'Attended', color: 'bg-green-100 dark:bg-matrix/20 text-green-800 dark:text-matrix border-green-300 dark:border-matrix/40' },
        registered: { label: 'Registered', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700' },
        waitlist: { label: 'Waitlisted', color: 'bg-yellow-100 dark:bg-hack-yellow/10 text-yellow-800 dark:text-hack-yellow border-yellow-300 dark:border-hack-yellow/30' },
        invited: { label: 'Invited', color: 'bg-orange-100 dark:bg-hack-orange/10 text-orange-800 dark:text-hack-orange border-orange-300 dark:border-hack-orange/30' },
      }
      return pastStatusConfig[registration.status] || null
    }

    const statusConfig = {
      registered: { label: 'Going', color: 'bg-green-100 dark:bg-matrix/20 text-green-800 dark:text-matrix border-green-300 dark:border-matrix/40' },
      waitlist: { label: 'Waitlist', color: 'bg-yellow-100 dark:bg-hack-yellow/10 text-yellow-800 dark:text-hack-yellow border-yellow-300 dark:border-hack-yellow/30' },
      invited: { label: 'Invited', color: 'bg-cyan-100 dark:bg-hack-cyan/10 text-cyan-800 dark:text-hack-cyan border-cyan-300 dark:border-hack-cyan/30' },
      attended: { label: 'Going', color: 'bg-green-100 dark:bg-matrix/20 text-green-800 dark:text-matrix border-green-300 dark:border-matrix/40' },
    }

    return statusConfig[registration.status] || null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className={`mb-10 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix rounded-full animate-pulse" />
            <span className="font-mono text-xs text-gray-400 dark:text-matrix/40 uppercase tracking-widest">
              Dashboard v2.0
            </span>
          </div>
          <div className="flex items-end gap-4 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-matrix uppercase tracking-tight">
              Welcome, {userProfile?.display_name || 'Hacker'}
            </h1>
            <span className="font-mono text-xs text-gray-400 dark:text-matrix/30 mb-1.5">
              [{userProfile?.student_id || 'NO_ID'}]
            </span>
          </div>
        </header>

        {/* Action Cards */}
        <div className="space-y-4 mb-12">
          <ScrollReveal delay={0}>
            <ActionCard
              to="/live"
              icon={CheckCircle}
              title="Mark Attendance"
              description="At a meeting? Enter the secret code to check in and record your attendance."
              headerFile="attendance_check_in.sh"
              headerTag="READY"
              tagColor="text-hack-cyan animate-pulse"
              iconBg="bg-blue-50 dark:bg-matrix/10"
              iconBorder="border-blue-200 dark:border-matrix/30"
              iconColor="text-blue-600 dark:text-matrix"
            />
          </ScrollReveal>

          {isVerifiedOfficer && (
            <ScrollReveal delay={50}>
              <ActionCard
                to="/officer"
                icon={Shield}
                title="Officer Dashboard"
                description="Manage members, view registrations, and access admin tools."
                headerFile="officer_dashboard.sh"
                headerTag="ADMIN"
                tagColor="text-hack-purple"
                iconBg="bg-purple-50 dark:bg-hack-purple/10"
                iconBorder="border-purple-200 dark:border-hack-purple/30"
                iconColor="text-purple-600 dark:text-hack-purple"
              />
            </ScrollReveal>
          )}

          {ctfdCreds?.ctfd_username && (
            <ScrollReveal delay={100}>
              <div className="terminal-window relative overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 dark:via-matrix to-transparent" />
                </div>
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">ctfd_account.sh</span>
                  <span className="ml-auto text-xs text-hack-cyan font-terminal">CTF</span>
                </div>
                <div className="terminal-body">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-3">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-matrix mb-1">Your CTFd Account</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-600 font-terminal w-20 shrink-0">USERNAME</span>
                        <code className="font-mono text-sm text-green-700 dark:text-matrix bg-green-50 dark:bg-matrix/5 px-2 py-0.5 border border-green-200 dark:border-matrix/20">
                          {ctfdCreds.ctfd_username}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ctfdCreds.ctfd_username!)
                            setCtfdCopied('user')
                            setTimeout(() => setCtfdCopied(null), 2000)
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-terminal-alt transition-colors"
                          title="Copy username"
                        >
                          {ctfdCopied === 'user' ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-matrix" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-600 font-terminal w-20 shrink-0">PASSWORD</span>
                        <code className="font-mono text-sm text-green-700 dark:text-matrix bg-green-50 dark:bg-matrix/5 px-2 py-0.5 border border-green-200 dark:border-matrix/20">
                          {ctfdCreds.ctfd_password}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ctfdCreds.ctfd_password!)
                            setCtfdCopied('pass')
                            setTimeout(() => setCtfdCopied(null), 2000)
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-terminal-alt transition-colors"
                          title="Copy password"
                        >
                          {ctfdCopied === 'pass' ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-matrix" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <a
                      href="https://dactf.com/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cli-btn-filled px-5 py-2.5 flex items-center justify-center gap-2 shrink-0 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Go to CTFd
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* Events */}
        <ScrollReveal delay={0}>
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <SectionHeader index="01" title="My Events" />
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
                  <div key={meeting.id} className="flex gap-4 group">
                    {/* Timeline column */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="text-left w-24">
                        <div className="text-sm font-terminal text-gray-700 dark:text-gray-400">
                          {parseLocalDate(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-600 font-terminal">
                          {parseLocalDate(meeting.date).toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                      </div>
                      <div className="flex flex-col items-center flex-1 mt-2">
                        <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 group-hover:bg-green-500 dark:group-hover:bg-matrix transition-colors" />
                        {index < displayedMeetings.length - 1 && (
                          <div className="h-full min-h-[60px] border-l-2 border-dotted border-gray-300 dark:border-gray-700 group-hover:border-green-400 dark:group-hover:border-matrix/30 transition-colors" />
                        )}
                      </div>
                    </div>

                    {/* Event card */}
                    <Link
                      to={`/meetings/${meeting.slug}`}
                      className="flex-1 border border-gray-200 dark:border-matrix/20 p-4 hover:border-green-500 dark:hover:border-matrix/40 hover:bg-green-50/30 dark:hover:bg-matrix/[0.03] hover:translate-x-1 transition-all duration-300 mb-4 relative overflow-hidden group/card"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-matrix scale-y-0 group-hover/card:scale-y-100 transition-transform duration-300 origin-top" />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-500 dark:text-gray-500 text-xs font-terminal flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {meeting.time}
                            </span>
                          </div>
                          <h3 className="text-gray-900 dark:text-matrix font-semibold text-base mb-2 group-hover/card:tracking-wider transition-all duration-300">
                            {meeting.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`inline-block px-2 py-0.5 text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                              {TYPE_LABELS[meeting.type]}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-600">
                              <MapPin className="w-3 h-3" />
                              {meeting.location}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {meeting.userRegistration && getStatusBadge(meeting.userRegistration, activeTab === 'past') ? (
                              <span className={`inline-block px-2 py-0.5 text-xs font-terminal border ${getStatusBadge(meeting.userRegistration, activeTab === 'past')!.color}`}>
                                {getStatusBadge(meeting.userRegistration, activeTab === 'past')!.label}
                              </span>
                            ) : activeTab === 'upcoming' && (
                              <span className="inline-block px-2 py-0.5 text-xs font-terminal border bg-blue-50 dark:bg-hack-cyan/5 text-blue-700 dark:text-hack-cyan border-blue-200 dark:border-hack-cyan/20">
                                Invited
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-matrix/30 group-hover/card:text-green-600 dark:group-hover/card:text-matrix group-hover/card:translate-x-0.5 transition-all shrink-0 mt-1" />
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
                <div className="terminal-body text-center py-14">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {activeTab === 'upcoming' ? 'No upcoming events yet' : 'No past events'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-500 text-sm mb-6">
                      {activeTab === 'upcoming'
                        ? 'Check out our meetings page to discover and register for upcoming events and workshops.'
                        : 'Events you attend will appear here. Register for upcoming events to start building your event history.'}
                    </p>
                    <Link
                      to="/meetings"
                      className="cli-btn-filled px-6 py-2.5 inline-flex items-center gap-2 text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      {activeTab === 'upcoming' ? 'Browse All Events' : 'Explore Events'}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </section>
        </ScrollReveal>

        {/* My Stats */}
        <ScrollReveal delay={0}>
          <section className="mb-12">
            <SectionHeader index="02" title="My Stats" />

            <div className="grid md:grid-cols-3 gap-4">
              {/* Attendance Ring */}
              <div className="border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />

                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-800" />
                      <circle
                        cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                        className="text-green-600 dark:text-matrix"
                        strokeDasharray={`${(attendanceCount / Math.max(pastMeetings.length + attendanceCount, 1)) * 251.2} 251.2`}
                        style={{ transition: 'stroke-dasharray 1s ease-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-green-700 dark:text-matrix">{attendanceCount}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-600 font-terminal">ATTENDED</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-matrix mb-3">Attendance</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-gray-500 dark:text-gray-500">Events Attended</span>
                        <span className="text-green-700 dark:text-matrix">{attendanceCount}</span>
                      </div>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-gray-500 dark:text-gray-500">Total Events</span>
                        <span className="text-gray-700 dark:text-gray-400">{meetings.length}</span>
                      </div>
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-gray-500 dark:text-gray-500">Attendance Rate</span>
                        <span className="text-green-700 dark:text-matrix">
                          {meetings.length > 0 ? Math.round((attendanceCount / meetings.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Types Breakdown */}
              <div className="border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />

                <h3 className="text-base font-semibold text-gray-900 dark:text-matrix mb-4">Events by Type</h3>
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
                        <div className="flex justify-between text-xs mb-1 font-mono">
                          <span className={`${TYPE_COLORS[type as keyof typeof TYPE_COLORS]?.split(' ')[1] || 'text-gray-400'}`}>
                            {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
                          </span>
                          <span className="text-gray-500 dark:text-gray-500">
                            <span className="text-green-700 dark:text-matrix">{stats.attended}</span>/{stats.total}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-800 overflow-hidden flex">
                          <div
                            className={`h-full transition-all duration-700 ${
                              type === 'workshop' ? 'bg-green-500 dark:bg-matrix' :
                              type === 'ctf' ? 'bg-cyan-500 dark:bg-hack-cyan' :
                              type === 'social' ? 'bg-purple-500 dark:bg-hack-purple' :
                              type === 'competition' ? 'bg-orange-500 dark:bg-hack-orange' :
                              'bg-gray-500 dark:bg-gray-400'
                            }`}
                            style={{ width: `${(stats.attended / maxCount) * 100}%` }}
                          />
                          <div
                            className="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-700"
                            style={{ width: `${((stats.total - stats.attended) / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  })()}
                  {Object.keys(meetings.reduce((acc, m) => { acc[m.type] = true; return acc }, {} as Record<string, boolean>)).length === 0 && (
                    <p className="text-gray-500 dark:text-gray-500 text-sm text-center py-4 font-mono">No events yet</p>
                  )}
                </div>
              </div>

              {/* Activity Overview */}
              <OverviewCard meetings={meetings} upcomingMeetings={upcomingMeetings} studentId={userProfile?.student_id} />
            </div>

            {/* Monthly Activity Chart */}
            <div className="border border-gray-200 dark:border-matrix/20 p-5 mt-4 hover:border-green-500 dark:hover:border-matrix/40 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />

              <h3 className="text-base font-semibold text-gray-900 dark:text-matrix mb-4">Monthly Activity</h3>
              <div className="flex items-end gap-2 h-28">
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
                      <div className="w-full flex flex-col items-center justify-end h-20">
                        <div
                          className="w-full max-w-6 bg-gray-300 dark:bg-gray-600 transition-all duration-500"
                          style={{ height: month.total > 0 ? `${Math.max(((month.total - month.attended) / maxEvents) * 100, 0)}%` : '0' }}
                        />
                        <div
                          className={`w-full max-w-6 transition-all duration-500 ${
                            month.attended > 0 ? 'bg-green-500 dark:bg-matrix' : 'bg-gray-200 dark:bg-gray-800'
                          }`}
                          style={{ height: month.attended > 0 ? `${Math.max((month.attended / maxEvents) * 100, 10)}%` : month.total === 0 ? '4px' : '0' }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-600 font-terminal">{month.label}</span>
                    </div>
                  ))
                })()}
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-500 font-mono">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-600 dark:bg-matrix" />
                    Attended
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600" />
                    Not attended
                  </span>
                </div>
                <span><span className="text-green-700 dark:text-matrix">{attendanceCount}</span>/{meetings.length} events</span>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Browse All Events CTA */}
        <ScrollReveal delay={0}>
          <Link
            to="/meetings"
            className="block border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 hover:bg-green-50/30 dark:hover:bg-matrix/[0.03] hover:translate-x-1 transition-all duration-300 group text-center relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-matrix scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
            <div className="flex items-center justify-center gap-3">
              <Calendar className="w-5 h-5 text-green-700 dark:text-matrix" />
              <span className="text-gray-900 dark:text-matrix font-semibold">Browse All Events & Meetings</span>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-matrix/30 group-hover:text-green-600 dark:group-hover:text-matrix group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </ScrollReveal>
      </div>
    </div>
  )
}

// ─── Overview Card (extracted to use useInView) ──────
function OverviewCard({ meetings, upcomingMeetings, studentId }: { meetings: MeetingWithRegistration[]; upcomingMeetings: MeetingWithRegistration[]; studentId: string | null | undefined }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })

  return (
    <div ref={ref} className="border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 transition-colors relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />

      <h3 className="text-base font-semibold text-gray-900 dark:text-matrix mb-4">Quick Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-green-50 dark:bg-matrix/5 border border-green-200 dark:border-matrix/20">
          <div className="text-2xl font-bold text-green-700 dark:text-matrix">
            <AnimatedCounter value={upcomingMeetings.length} inView={inView} />
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-terminal uppercase mt-1">Upcoming</div>
        </div>
        <div className="text-center p-3 bg-cyan-50 dark:bg-hack-cyan/5 border border-cyan-200 dark:border-hack-cyan/20">
          <div className="text-2xl font-bold text-cyan-700 dark:text-hack-cyan">
            <AnimatedCounter value={meetings.filter(m => m.userRegistration && m.userRegistration.status !== 'cancelled').length} inView={inView} />
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-terminal uppercase mt-1">Registered</div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-hack-purple/5 border border-purple-200 dark:border-hack-purple/20">
          <div className="text-2xl font-bold text-purple-700 dark:text-hack-purple">
            <AnimatedCounter value={upcomingMeetings.filter(m => m.userRegistration).length} inView={inView} />
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-terminal uppercase mt-1">RSVPs</div>
        </div>
        <div className={`text-center p-3 border ${
          studentId
            ? 'bg-green-50 dark:bg-matrix/5 border-green-200 dark:border-matrix/20'
            : 'bg-yellow-50 dark:bg-hack-yellow/5 border-yellow-200 dark:border-hack-yellow/20'
        }`}>
          <div className={`text-lg font-bold ${
            studentId ? 'text-green-700 dark:text-matrix' : 'text-yellow-700 dark:text-hack-yellow'
          }`}>
            {studentId ? 'OK' : '??'}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-terminal uppercase mt-1">ID Status</div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
