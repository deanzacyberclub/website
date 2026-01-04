import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Discord, Calendar, Document, GitHub, Instagram, Globe, X, LinkedIn, Mail, Code, Clock, MapPin, ChevronRight } from '@/lib/cyberIcon'
import { supabase } from '@/lib/supabase'
import { TYPE_COLORS, TYPE_LABELS } from './Meetings'
import type { Meeting } from '@/types/database.types'

const prefetchMeetings = () => import('./Meetings')

// Matrix rain characters
const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}=/\\|'

function MatrixRain() {
  const columns = useMemo(() => {
    const cols = []
    const columnCount = Math.floor(window.innerWidth / 20)
    for (let i = 0; i < columnCount; i++) {
      const chars = Array.from({ length: Math.floor(Math.random() * 20) + 10 }, () =>
        matrixChars[Math.floor(Math.random() * matrixChars.length)]
      ).join('')
      cols.push({
        left: `${(i / columnCount) * 100}%`,
        animationDuration: `${Math.random() * 10 + 8}s`,
        animationDelay: `${Math.random() * 5}s`,
        chars
      })
    }
    return cols
  }, [])

  return (
    <div className="matrix-rain">
      {columns.map((col, i) => (
        <div
          key={i}
          className="matrix-column"
          style={{
            left: col.left,
            animationDuration: col.animationDuration,
            animationDelay: col.animationDelay,
          }}
        >
          {col.chars}
        </div>
      ))}
    </div>
  )
}

function App() {
  const [loaded, setLoaded] = useState(false)
  const [featuredMeetings, setFeaturedMeetings] = useState<Meeting[]>([])

  useEffect(() => {
    setLoaded(true)
    trackVisit()
    fetchFeaturedMeetings()
  }, [])

  const fetchFeaturedMeetings = async () => {
    try {
      const { data } = await supabase
        .from('meetings')
        .select('*')
        .eq('featured', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(3)

      if (data) setFeaturedMeetings(data)
    } catch (err) {
      console.error('Error fetching featured meetings:', err)
    }
  }

  const trackVisit = async () => {
    try {
      await fetch('/api/track-visit', { method: 'POST' })
    } catch {
      console.error("Failed to track visit")
    }
  }

  const renderContent = () => (
    <div className="relative">
      {/* Hero Section - Full Viewport */}
      <section className={`min-h-screen flex items-center justify-center transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div>
              <div className="mb-8">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                  <span className="text-white">Learn to</span>
                  <br />
                  <span className="text-white">hack </span>
                  <span className="glitch neon-text" data-text="(legally)">
                    (legally)
                  </span>
                </h1>
                <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8">
                  Break into cybersecurity with hands-on workshops, earn industry certifications,
                  and join a crew of future security professionals.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://discord.gg/AmjfRrJd5j"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hack-filled rounded-lg px-8 py-4 text-lg flex items-center gap-3"
                >
                  <Discord className="w-5 h-5" />
                  Join Discord
                </a>
                <Link
                  to="/meetings"
                  className="btn-hack rounded-lg px-8 py-4 text-lg flex items-center gap-3"
                >
                  <Calendar className="w-5 h-5" />
                  View Events
                </Link>
              </div>
            </div>

            {/* Right side - Featured Events Scroll */}
            <div className="relative">
              {featuredMeetings.length > 0 ? (
                <div className="relative">
                  <h3 className="text-gray-400 text-sm font-terminal mb-4 uppercase tracking-wider">Featured Events</h3>
                  <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-matrix/30 scrollbar-track-transparent">
                    <div className="flex gap-4" style={{ width: 'max-content' }}>
                      {featuredMeetings.map((meeting) => (
                        <Link
                          key={meeting.id}
                          to={`/meetings/${meeting.slug}`}
                          className="block card-hack rounded-lg p-5 group hover:scale-[1.02] transition-transform w-80 shrink-0"
                        >
                          {/* Date Box */}
                          <div className="flex items-start gap-4 mb-3">
                            <div className="text-center shrink-0 w-14">
                              <div className="text-2xl font-bold text-matrix">
                                {new Date(meeting.date).getDate()}
                              </div>
                              <div className="text-xs text-gray-500 uppercase font-terminal">
                                {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                                  {TYPE_LABELS[meeting.type]}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Meeting Info */}
                          <h3 className="text-matrix font-semibold text-lg mb-2 group-hover:neon-text-subtle transition-all line-clamp-2">
                            {meeting.title}
                          </h3>
                          <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                            {meeting.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {meeting.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {meeting.location}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <Link
                    to="/meetings"
                    className="block w-full btn-hack rounded-lg p-4 text-center group hover:scale-[1.01] transition-transform mt-4"
                    onMouseEnter={prefetchMeetings}
                    onFocus={prefetchMeetings}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold text-sm">VIEW ALL EVENTS</span>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src="/logo.jpeg"
                    alt="DACC Logo"
                    className="w-full max-w-md mx-auto rounded-2xl border border-matrix/30"
                    style={{ filter: 'drop-shadow(0 0 40px rgba(0, 255, 65, 0.3))' }}
                  />
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-matrix rounded-full animate-pulse shadow-neon" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* All existing content sections */}
      <div className="max-w-4xl mx-auto px-6 py-20">

        {/* Petition Section - PROMINENT */}
        <section className={`mb-16 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-matrix neon-text-subtle text-lg">$</span>
          <span className="text-gray-400 font-terminal">./sign_petition.sh</span>
        </div>

        <div
          className="group block relative overflow-hidden rounded-xl border-2 border-matrix bg-gradient-to-br from-matrix/10 via-terminal-bg to-matrix/5 p-8 transition-all duration-300 hover:shadow-neon-strong hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
              <div className="w-16 h-16 rounded-xl bg-matrix/20 border border-matrix/50 flex items-center justify-center shadow-neon flex-shrink-0">
                <Pencil className="w-8 h-8 text-matrix neon-text" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-matrix neon-text tracking-wide mb-1">
                  THANK YOU FOR SIGNING!
                </h3>
                <p className="text-gray-400 text-sm md:text-base">Petition is now being reviewed by ICC!</p>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Access Section */}
        <section className={`mb-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-matrix neon-text-subtle text-lg">$</span>
          <span className="text-gray-400 font-terminal">./join --no-experience-required</span>
        </div>

        <div className="terminal-window mb-6">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">access_granted</span>
          </div>
          <div className="terminal-body">
            <p className="text-matrix/80 mb-4">
              <span className="text-hack-cyan">[INFO]</span> Zero experience? Perfect.
              We'll teach you everything from the ground up. All you need is curiosity.
            </p>
            <p className="text-gray-500 text-sm">
              <span className="text-matrix">STATUS:</span> RECRUITING |
              <span className="text-matrix ml-2">SPOTS:</span> OPEN
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <a
            href="https://discord.gg/AmjfRrJd5j"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hack-filled rounded-lg flex-1 flex items-center justify-center gap-3"
          >
            <Discord className="w-5 h-5" />
            JOIN DISCORD
          </a>

          <a
            href="https://docs.google.com/document/d/1-wV6SDBT-5YoyfhNu-sBbnQondH0kmZM/edit?usp=sharing&ouid=111115151815479546677&rtpof=true&sd=true"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hack rounded-lg flex-1 flex items-center justify-center gap-3"
          >
            <Document className="w-5 h-5" />
            CONSTITUTION
            </a>
          </div>
        </section>

        {/* Club Officers Section */}
        <section className={`mb-16 transition-all duration-700 delay-375 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-matrix neon-text-subtle text-lg">$</span>
          <span className="text-gray-400 font-terminal">cat /etc/officers.conf</span>
        </div>

        <div className="terminal-window">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">club_leadership</span>
          </div>
          <div className="terminal-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* President */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="/neel-anshu.jpeg"
                    alt="Neel Anshu"
                    className="w-10 h-10 rounded-lg border border-matrix/40 object-cover"
                  />
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">President</p>
                    <p className="text-matrix font-semibold">Neel Anshu</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-13">
                  <a href="https://github.com/boredcreator" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <GitHub className="w-4 h-4" />
                  </a>
                  <a href="https://instagram.com/neel_reddy455" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="https://flippedbyneel.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <Globe className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Vice President */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="/aaron-ma.jpeg"
                    alt="Aaron Ma"
                    className="w-10 h-10 rounded-lg border border-matrix/40 object-cover"
                  />
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">Vice President</p>
                    <p className="text-matrix font-semibold">Aaron Ma</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-13">
                  <a href="https://github.com/aaronhma" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <GitHub className="w-4 h-4" />
                  </a>
                  <a href="https://x.com/aaronhma" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <X className="w-4 h-4" />
                  </a>
                  <a href="https://www.linkedin.com/in/air-rn/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <LinkedIn className="w-4 h-4" />
                  </a>
                  <a href="mailto:hi@aaronhma.com" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <Mail className="w-4 h-4" />
                  </a>
                  <a href="https://aaronhma.com/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <Globe className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Secretary */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src="/ricardo-villasenor.jpeg"
                    alt="Ricardo Villasenor"
                    className="w-10 h-10 rounded-lg border border-matrix/40 object-cover"
                  />
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">Secretary</p>
                    <p className="text-matrix font-semibold">Ricardo Villasenor</p>
                  </div>
                </div>
              </div>

              {/* Officer - Thant Thu Hein */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center">
                    <Code className="w-5 h-5 text-matrix" />
                  </div>
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">Outreach Manager</p>
                    <p className="text-matrix font-semibold">Thant Thu Hein</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-13">
                  <a href="https://www.instagram.com/butter.daxxton" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <Instagram className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Officer - Mobin Norouzi */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center">
                    <Code className="w-5 h-5 text-matrix" />
                  </div>
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">Curriculum Lead</p>
                    <p className="text-matrix font-semibold">Mobin Norouzi</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className={`transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-matrix neon-text-subtle text-lg">$</span>
          <span className="text-gray-400 font-terminal">ls -la ./what-youll-learn/</span>
        </div>

        <div className="space-y-4">
          <div className="card-hack p-5 rounded-lg group">
            <div className="flex items-start gap-4">
              <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">01</div>
              <div>
                <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                  hacking_fundamentals.sh
                </h3>
                <p className="text-sm text-gray-500">
                  Think like an attacker. Learn reconnaissance, exploitation, and how real breaches happen.
                </p>
              </div>
            </div>
          </div>

          <div className="card-hack p-5 rounded-lg group">
            <div className="flex items-start gap-4">
              <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">02</div>
              <div>
                <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                  get_certified.sh
                </h3>
                <p className="text-sm text-gray-500">
                  Study groups for Security+, Network+, and more. Land your first cybersecurity job.
                </p>
              </div>
            </div>
          </div>

          <div className="card-hack p-5 rounded-lg group">
            <div className="flex items-start gap-4">
              <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">03</div>
              <div>
                <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                  real_tools.sh
                </h3>
                <p className="text-sm text-gray-500">
                  Get hands-on with Burp Suite, Nmap, Wireshark, Metasploit—the same tools pros use.
                </p>
              </div>
            </div>
          </div>

          <div className="card-hack p-5 rounded-lg group">
            <div className="flex items-start gap-4">
              <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">04</div>
              <div>
                <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                  ctf_competitions.sh
                </h3>
                <p className="text-sm text-gray-500">
                  Compete in capture-the-flag events. Solve puzzles. Win bragging rights (and prizes).
                </p>
              </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* CRT Scanline Overlay */}
      <div className="crt-overlay" />

      {/* Main Content */}
      <div className="relative z-10">
        {renderContent()}
      </div>
    </div>
  )
}

export default App
