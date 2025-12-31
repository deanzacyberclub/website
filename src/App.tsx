import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Footer from './components/Footer'

const prefetchPetition = () => import('./Petition')
const prefetchMeetings = () => import('./Meetings')

interface Message {
  id: string
  content: string
  author: string
  timestamp: string
  isWebhook: boolean
}

interface VisitorData {
  timezone: string
  language: string
  screen: string
  platform: string
  referrer: string
  userAgent: string
  colorDepth: number
  deviceMemory: number | null
  hardwareConcurrency: number
  cookiesEnabled: boolean
  doNotTrack: string | null
  online: boolean
  connectionType: string | null
  touchSupport: boolean
  maxTouchPoints: number
  devicePixelRatio: number
  pageUrl: string
  viewportSize: string
}

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
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [chatActive, setChatActive] = useState(false)
  const [name, setName] = useState('')
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatTrackedRef = useRef(false)
  const chatOpenedAtRef = useRef<number | null>(null)
  const pingAudioRef = useRef<HTMLAudioElement>(null)
  const lastMessageCountRef = useRef(0)

  useEffect(() => {
    setLoaded(true)
    // trackVisit('page_view')
  }, [])

  useEffect(() => {
    if (chatActive) {
      if (!chatOpenedAtRef.current) {
        chatOpenedAtRef.current = Date.now()
      }
      fetchOnlineCount()
      pollingRef.current = setInterval(fetchMessages, 3000)
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [chatActive])

  const fetchMessages = async () => {
    try {
      const openedAt = chatOpenedAtRef.current
      if (!openedAt) return

      const res = await fetch(`/api/get-messages?after=${openedAt}`)
      if (res.ok) {
        const data: Message[] = await res.json()
        const prevCount = lastMessageCountRef.current
        const hasNewResponse = data.length > prevCount &&
          data.some(msg => !msg.isWebhook &&
            new Date(msg.timestamp).getTime() > openedAt + 1000)

        if (hasNewResponse && pingAudioRef.current) {
          pingAudioRef.current.play().catch(() => { })
        }

        lastMessageCountRef.current = data.length
        setMessages(data)
      }
    } catch {
      // Silently handle fetch errors
    }
  }

  const fetchOnlineCount = async () => {
    try {
      const res = await fetch('/api/get-online-count')
      if (res.ok) {
        const data = await res.json()
        setOnlineCount(data.online)
      }
    } catch {
      // Silently handle fetch errors
    }
  }

  const getVisitorData = (): VisitorData => {
    const nav = navigator as Navigator & {
      deviceMemory?: number
      connection?: { effectiveType?: string }
    }
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      platform: navigator.platform,
      referrer: document.referrer || 'Direct',
      userAgent: navigator.userAgent,
      colorDepth: window.screen.colorDepth,
      deviceMemory: nav.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      online: navigator.onLine,
      connectionType: nav.connection?.effectiveType || null,
      touchSupport: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      devicePixelRatio: window.devicePixelRatio || 1,
      pageUrl: window.location.href,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    }
  }

  const trackVisit = async (type: string) => {
    try {
      if (type === 'page_view') {
        const lastVisit = localStorage.getItem('dacc_last_visit')
        const now = Date.now()
        const tenMinutes = 10 * 60 * 1000
        if (lastVisit && (now - parseInt(lastVisit)) < tenMinutes) return
        localStorage.setItem('dacc_last_visit', now.toString())
      }
      const payload = { type, visitorData: getVisitorData() }
      await fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch {
      // Silently handle fetch errors
    }
  }

  const parseContent = (content: string, isWebhook: boolean): string => {
    if (isWebhook) return content.replace(/\*\*/g, '')
    return content
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    const messageText = message.trim()
    const displayName = name.trim() || 'anonymous'

    setError('')
    setSending(true)
    if (!chatActive) {
      setChatActive(true)
      if (!chatTrackedRef.current) {
        chatTrackedRef.current = true
        trackVisit('chat_opened')
      }
    }

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageText,
      author: displayName,
      timestamp: new Date().toISOString(),
      isWebhook: true
    }
    setMessages(prev => [...prev, optimisticMessage])
    setMessage('')

    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, name: displayName })
      })
      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
        setError('[ERROR] Transmission failed')
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      setError('[ERROR] Transmission failed')
    } finally {
      setSending(false)
    }
  }

  const renderContent = () => (
    <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
      {/* ASCII Header */}
      <header className={`mb-16 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <pre className="ascii-border text-xs mb-6 hidden md:block opacity-50">
          {`╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║`}
        </pre>

        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <img
              src="/logo.png"
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
              A student-led community for learning cybersecurity fundamentals,
              earning certifications, and getting hands-on with industry tools.
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
          <span className="text-gray-400 font-terminal">./sign_petition.sh --urgent</span>
        </div>

        <a
          href="/petition"
          className="group block relative overflow-hidden rounded-xl border-2 border-matrix bg-gradient-to-br from-matrix/10 via-terminal-bg to-matrix/5 p-8 transition-all duration-300 hover:shadow-neon-strong hover:scale-[1.02]"
          onMouseEnter={prefetchPetition}
          onFocus={prefetchPetition}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
              <div className="w-16 h-16 rounded-xl bg-matrix/20 border border-matrix/50 flex items-center justify-center shadow-neon flex-shrink-0">
                <svg className="w-8 h-8 text-matrix neon-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-matrix neon-text tracking-wide mb-1">
                  SIGN THE CLUB PETITION
                </h3>
                <p className="text-gray-400 text-sm md:text-base">Help establish DACC as an official De Anza club</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="btn-hack-filled rounded-lg px-6 py-3 text-sm group-hover:shadow-neon-strong transition-all">
                SIGN NOW
              </span>
              <svg className="w-6 h-6 text-matrix group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </a>
      </section>

      {/* Modules Section */}
      <section className={`mb-16 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-matrix neon-text-subtle text-lg">$</span>
          <span className="text-gray-400 font-terminal">ls -la ./modules/</span>
        </div>

        <div className="space-y-4">
          <div className="card-hack p-5 rounded-lg group">
            <div className="flex items-start gap-4">
              <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">01</div>
              <div>
                <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                  security_foundations.sh
                </h3>
                <p className="text-sm text-gray-500">
                  Core cybersecurity concepts applicable across all programming disciplines
                </p>
              </div>
            </div>
          </div>

          <div className="card-hack p-5 rounded-lg group">
            <div className="flex items-start gap-4">
              <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">02</div>
              <div>
                <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                  security+_certification.sh
                </h3>
                <p className="text-sm text-gray-500">
                  Structured curriculum to help members achieve CompTIA Security+ certification
                </p>
              </div>
            </div>
          </div>

          <div className="card-hack p-5 rounded-lg group">
            <div className="flex items-start gap-4">
              <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">03</div>
              <div>
                <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                  hands_on_tools.sh
                </h3>
                <p className="text-sm text-gray-500">
                  Practical experience with Burp Suite, Nmap, Wireshark, and more
                </p>
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
              <span className="text-hack-cyan">[INFO]</span> No prior experience required.
              Just bring curiosity and willingness to learn.
            </p>
            <p className="text-gray-500 text-sm">
              <span className="text-matrix">ACCESS:</span> GRANTED |
              <span className="text-matrix ml-2">CLEARANCE:</span> PUBLIC
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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            CONNECT
          </a>

          <a
            href="https://docs.google.com/document/d/1-wV6SDBT-5YoyfhNu-sBbnQondH0kmZM/edit?usp=sharing&ouid=111115151815479546677&rtpof=true&sd=true"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-hack rounded-lg inline-flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CONSTITUTION
          </a>

          <Link
            to="/meetings"
            className="btn-hack rounded-lg inline-flex items-center gap-3"
            onMouseEnter={prefetchMeetings}
            onFocus={prefetchMeetings}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            MEETINGS
          </Link>
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
                    src="/Neel A.jpg"
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
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                  </a>
                  <a href="https://instagram.com/neel_reddy455" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  </a>
                  <a href="https://flippedbyneel.com" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
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
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                  </a>
                  <a href="https://x.com/aaronhma" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a href="https://www.linkedin.com/in/air-rn/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                  <a href="mailto:hi@aaronhma.com" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </a>
                  <a href="https://aaronhma.com/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                  </a>
                </div>
              </div>

              {/* Secretary */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src="/ricardo villasenor.png"
                    alt="Ricardo Villasenor"
                    className="w-10 h-10 rounded-lg border border-matrix/40 object-cover"
                  />
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">Secretary</p>
                    <p className="text-matrix font-semibold">Ricardo Villasenor</p>
                  </div>
                </div>
              </div>

              {/* Officer - Aarush */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center">
                    <svg className="w-5 h-5 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">Officer</p>
                    <p className="text-matrix font-semibold">Aarush</p>
                  </div>
                </div>
              </div>

              {/* Officer - Thant Thu Hein */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center">
                    <svg className="w-5 h-5 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">Officer</p>
                    <p className="text-matrix font-semibold">Thant Thu Hein</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-13">
                  <a href="https://www.instagram.com/butter.daxxton" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  </a>
                </div>
              </div>

              {/* Officer - Mobin Norouzi */}
              <div className="card-hack p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center">
                    <svg className="w-5 h-5 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">Officer</p>
                    <p className="text-matrix font-semibold">Mobin Norouzi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Chat Section */}
      <section className={`mb-16 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-matrix neon-text-subtle text-lg">$</span>
          <span className="text-gray-400 font-terminal">cat /dev/discord</span>
        </div>

        <div className="terminal-window">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">#general</span>
            {chatActive && onlineCount !== null && (
              <span className="ml-auto status-online text-xs text-matrix">
                {onlineCount} connected
              </span>
            )}
          </div>
          <div className="terminal-body">
            {chatActive && (
              <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
                {messages.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    <span className="text-hack-yellow">[WAITING]</span> Connection established. Awaiting response...
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="text-gray-600">[{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>{' '}
                      <span className={msg.isWebhook ? 'text-hack-cyan' : 'text-matrix neon-text-subtle'}>{msg.author}:</span>{' '}
                      <span className="text-gray-400">{parseContent(msg.content, msg.isWebhook)}</span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            <form onSubmit={sendMessage} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    className="input-hack w-full rounded-lg pl-8"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="btn-hack rounded-lg px-6 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {sending ? '...' : 'SEND'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">--user</span>
                <input
                  type="text"
                  placeholder="anonymous"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  className="input-hack rounded text-xs py-1 px-2 w-32"
                />
              </div>
            </form>
            {error && <p className="text-hack-red text-xs mt-3">{error}</p>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer className={`mt-0 transition-all duration-700 delay-500 border-matrix/20 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-gray-600 font-terminal">
            <span className="text-matrix neon-text-subtle">$</span> ping{' '}
            <a
              href="https://www.deanza.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-matrix/70 hover:text-matrix hover:neon-text-subtle transition-all"
            >
              https://deanza.edu
            </a>
          </p>
          <div className="text-xs text-gray-700 font-terminal">
            <span className="text-matrix/50">[</span>
            SYSTEM ACTIVE
            <span className="text-matrix/50">]</span>
          </div>
        </div>
      </Footer>
    </div>
  )

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* CRT Scanline Overlay */}
      <div className="crt-overlay" />

      {/* Audio */}
      <audio ref={pingAudioRef} src="/discord_ping_sound_effect.mp3" preload="auto" />

      {/* Main Content */}
      <div className="relative z-10">
        {renderContent()}
      </div>
    </div>
  )
}

export default App
