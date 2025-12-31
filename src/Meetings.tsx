import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Footer from './components/Footer'

interface Meeting {
  id: string
  title: string
  description: string
  date: string // ISO date string
  time: string
  location: string
  type: 'workshop' | 'lecture' | 'ctf' | 'social' | 'general'
  featured: boolean
  topics?: string[]
}

// Sample meeting data - replace with Firebase data later
const MEETINGS_DATA: Meeting[] = [
  {
    id: '1',
    title: 'Introduction to Ethical Hacking',
    description: 'Learn the fundamentals of ethical hacking and penetration testing. We\'ll cover reconnaissance, scanning, and basic exploitation techniques.',
    date: '2025-01-15',
    time: '4:00 PM - 6:00 PM',
    location: 'S43 Room 120',
    type: 'workshop',
    featured: true,
    topics: ['Penetration Testing', 'Kali Linux', 'Nmap']
  },
  {
    id: '2',
    title: 'Security+ Study Session',
    description: 'Group study session for CompTIA Security+ certification. Focus on domain 1: Attacks, Threats, and Vulnerabilities.',
    date: '2025-01-22',
    time: '3:00 PM - 5:00 PM',
    location: 'Library Study Room 3',
    type: 'lecture',
    featured: true,
    topics: ['Security+', 'Certification', 'Study Group']
  },
  {
    id: '3',
    title: 'CTF Practice Night',
    description: 'Practice capture-the-flag challenges together. Beginner-friendly with mentorship from experienced members.',
    date: '2025-01-29',
    time: '5:00 PM - 8:00 PM',
    location: 'Online - Discord',
    type: 'ctf',
    featured: false,
    topics: ['CTF', 'Web Security', 'Cryptography']
  },
  {
    id: '4',
    title: 'Network Security Fundamentals',
    description: 'Deep dive into network security concepts including firewalls, IDS/IPS, and secure network design.',
    date: '2025-02-05',
    time: '4:00 PM - 6:00 PM',
    location: 'S43 Room 120',
    type: 'lecture',
    featured: false,
    topics: ['Networking', 'Firewalls', 'Wireshark']
  },
  {
    id: '5',
    title: 'Web Application Security Workshop',
    description: 'Hands-on workshop covering OWASP Top 10 vulnerabilities with live demonstrations using Burp Suite.',
    date: '2024-12-10',
    time: '4:00 PM - 6:00 PM',
    location: 'S43 Room 120',
    type: 'workshop',
    featured: false,
    topics: ['OWASP', 'Burp Suite', 'SQL Injection']
  },
  {
    id: '6',
    title: 'Club Kickoff Meeting',
    description: 'First meeting of the quarter! Learn about club activities, meet the officers, and sign up for upcoming events.',
    date: '2024-10-02',
    time: '3:00 PM - 4:30 PM',
    location: 'S43 Room 120',
    type: 'general',
    featured: false,
    topics: ['Introduction', 'Community']
  },
  {
    id: '7',
    title: 'Password Cracking & HashCat Demo',
    description: 'Learn how password hashing works and see live demonstrations of password cracking techniques using HashCat.',
    date: '2024-11-15',
    time: '4:00 PM - 6:00 PM',
    location: 'Online - Discord',
    type: 'workshop',
    featured: false,
    topics: ['Password Security', 'HashCat', 'Cryptography']
  },
  {
    id: '8',
    title: 'End of Quarter Social',
    description: 'Celebrate the end of fall quarter with games, food, and networking with fellow cybersecurity enthusiasts!',
    date: '2024-12-05',
    time: '5:00 PM - 7:00 PM',
    location: 'Campus Center Patio',
    type: 'social',
    featured: false,
    topics: ['Networking', 'Social']
  }
]

type FilterType = 'all' | 'upcoming' | 'past'

const TYPE_COLORS: Record<Meeting['type'], string> = {
  workshop: 'text-hack-cyan border-hack-cyan/50',
  lecture: 'text-hack-yellow border-hack-yellow/50',
  ctf: 'text-hack-red border-hack-red/50',
  social: 'text-purple-400 border-purple-400/50',
  general: 'text-matrix border-matrix/50'
}

const TYPE_LABELS: Record<Meeting['type'], string> = {
  workshop: 'WORKSHOP',
  lecture: 'LECTURE',
  ctf: 'CTF',
  social: 'SOCIAL',
  general: 'GENERAL'
}

function Meetings() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [loaded, setLoaded] = useState(false)

  useState(() => {
    setLoaded(true)
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const featuredMeetings = useMemo(() => {
    return MEETINGS_DATA.filter(m => m.featured && new Date(m.date) >= today)
  }, [])

  const filteredMeetings = useMemo(() => {
    let meetings = MEETINGS_DATA.filter(m => !m.featured || new Date(m.date) < today)

    // Apply time filter
    if (filter === 'upcoming') {
      meetings = meetings.filter(m => new Date(m.date) >= today)
    } else if (filter === 'past') {
      meetings = meetings.filter(m => new Date(m.date) < today)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      meetings = meetings.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query) ||
        m.topics?.some(t => t.toLowerCase().includes(query))
      )
    }

    // Sort by date (upcoming first for 'all' and 'upcoming', past first for 'past')
    meetings.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (filter === 'past') {
        return dateB - dateA // Most recent past first
      }
      return dateA - dateB // Soonest upcoming first
    })

    return meetings
  }, [filter, searchQuery])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < today
  }

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <header className={`mb-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-matrix transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle">$</span>
            <span className="text-gray-400 font-terminal">cat /var/log/meetings.log</span>
          </div>

          <h1 className="text-3xl font-bold text-matrix neon-text mb-2">
            Club Meetings
          </h1>
          <p className="text-gray-500">
            Explore our upcoming events and past sessions
          </p>
        </header>

        {/* Featured Section */}
        {featuredMeetings.length > 0 && (
          <section className={`mb-12 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-400 font-terminal">./highlight --featured</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="relative overflow-hidden rounded-xl border-2 border-matrix bg-gradient-to-br from-matrix/10 via-terminal-bg to-matrix/5 p-6 group hover:shadow-neon transition-all duration-300"
                >
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-terminal bg-matrix/20 text-matrix border border-matrix/50">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      FEATURED
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                      {TYPE_LABELS[meeting.type]}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-matrix mb-2 group-hover:neon-text-subtle transition-all">
                    {meeting.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {meeting.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4 text-matrix/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(meeting.date)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4 text-matrix/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {meeting.time}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4 text-matrix/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {meeting.location}
                    </div>
                  </div>

                  {meeting.topics && meeting.topics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {meeting.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 rounded text-xs bg-terminal-alt border border-gray-700 text-gray-400"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search and Filter Section */}
        <section className={`mb-8 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">search_meetings</span>
            </div>
            <div className="terminal-body">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-matrix/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search meetings, topics, locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-hack w-full rounded-lg pl-10"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${
                      filter === 'all'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setFilter('upcoming')}
                    className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${
                      filter === 'upcoming'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                    }`}
                  >
                    UPCOMING
                  </button>
                  <button
                    onClick={() => setFilter('past')}
                    className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${
                      filter === 'past'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                    }`}
                  >
                    PAST
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meetings List */}
        <section className={`mb-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">
              ls -la ./meetings/ {filter !== 'all' && `--filter=${filter}`}
              {searchQuery && ` | grep "${searchQuery}"`}
            </span>
          </div>

          {filteredMeetings.length === 0 ? (
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">no_results</span>
              </div>
              <div className="terminal-body text-center py-8">
                <p className="text-gray-500 mb-2">
                  <span className="text-hack-yellow">[INFO]</span> No meetings found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilter('all')
                  }}
                  className="text-matrix hover:neon-text-subtle transition-all text-sm"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className={`card-hack p-5 rounded-lg group transition-all ${
                    isPast(meeting.date) ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className={`text-2xl font-bold font-terminal ${isPast(meeting.date) ? 'text-gray-500' : 'text-matrix'}`}>
                        {new Date(meeting.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(meeting.date).getFullYear()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                          {TYPE_LABELS[meeting.type]}
                        </span>
                        {isPast(meeting.date) && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-terminal border border-gray-600 text-gray-500">
                            COMPLETED
                          </span>
                        )}
                      </div>

                      <h3 className={`text-lg font-semibold mb-2 group-hover:neon-text-subtle transition-all ${
                        isPast(meeting.date) ? 'text-gray-400' : 'text-matrix'
                      }`}>
                        {meeting.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        {meeting.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-matrix/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {meeting.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-matrix/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {meeting.location}
                        </div>
                      </div>

                      {meeting.topics && meeting.topics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {meeting.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded text-xs bg-terminal-alt border border-gray-700 text-gray-400"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Stats Section */}
        <section className={`mb-16 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">meeting_stats</span>
            </div>
            <div className="terminal-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-matrix neon-text-subtle">
                    {MEETINGS_DATA.length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Total Meetings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-cyan">
                    {MEETINGS_DATA.filter(m => new Date(m.date) >= today).length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Upcoming</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-yellow">
                    {MEETINGS_DATA.filter(m => m.type === 'workshop').length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Workshops</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-red">
                    {MEETINGS_DATA.filter(m => m.type === 'ctf').length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">CTF Events</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer className={`transition-all duration-700 delay-500 border-matrix/20 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-600 font-terminal">
              <span className="text-matrix neon-text-subtle">$</span> tail -f /var/log/meetings.log
            </p>
            <div className="text-xs text-gray-700 font-terminal">
              <span className="text-matrix/50">[</span>
              EVENTS ACTIVE
              <span className="text-matrix/50">]</span>
            </div>
          </div>
        </Footer>
      </div>
    </div>
  )
}

export default Meetings
