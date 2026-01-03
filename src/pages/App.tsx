import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Discord, Calendar, Document, GitHub, Instagram, Globe, X, LinkedIn, Mail, Code } from '@/lib/cyberIcon'

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

  useEffect(() => {
    setLoaded(true)
    trackVisit()
  }, [])

  const trackVisit = async () => {
    try {
      await fetch('/api/track-visit', { method: 'POST' })
    } catch {
      console.error("Failed to track visit")
    }
  }

  const renderContent = () => (
    <div className="relative max-w-4xl mx-auto px-6">
      {/* ASCII Header */}
      <header className={`mb-16 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <pre className="ascii-border text-xs mb-6 hidden md:block opacity-50">
          {`╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║`}
        </pre>

        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <img
              src="/logo.jpeg"
              alt="DACC Logo"
              className="w-16 h-16 rounded-lg border border-matrix/30"
              style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 65, 0.3))' }}
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-matrix rounded-full animate-pulse shadow-neon" />
          </div>
          <div>
            <h1
              className="glitch text-3xl font-bold tracking-tight neon-text"
              data-text="DACC"
            >
              DACC
            </h1>
            <p className="text-sm font-terminal text-matrix-dim tracking-widest">
              DE ANZA CYBERSECURITY CLUB
            </p>
          </div>
        </div>

        <div className="terminal-window mb-6">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">root@dacc:~</span>
          </div>
          <div className="terminal-body">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-matrix neon-text-subtle">$</span>
              <span className="text-gray-400">cat /etc/motd</span>
            </div>
            <p className="text-matrix/90 leading-relaxed">
              Learn to hack (legally). Break into cybersecurity with hands-on workshops,
              earn industry certifications, and join a crew of future security professionals.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-matrix neon-text-subtle">$</span>
              <span className="cursor-blink text-gray-400" />
            </div>
          </div>
        </div>

        <pre className="ascii-border text-xs hidden md:block opacity-50">
          {`║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝`}
        </pre>
      </header>

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
            className="btn-hack-filled rounded-lg inline-flex items-center gap-3"
          >
            <Discord className="w-5 h-5" />
            JOIN DISCORD
          </a>

          <Link
            to="/meetings"
            className="btn-hack rounded-lg inline-flex items-center gap-3"
            onMouseEnter={prefetchMeetings}
            onFocus={prefetchMeetings}
          >
            <Calendar className="w-5 h-5" />
            EVENTS
          </Link>

          <a
            href="https://docs.google.com/document/d/1-wV6SDBT-5YoyfhNu-sBbnQondH0kmZM/edit?usp=sharing&ouid=111115151815479546677&rtpof=true&sd=true"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hack rounded-lg inline-flex items-center gap-3"
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
