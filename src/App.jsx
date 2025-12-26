import { useState, useEffect, useRef } from 'react'

function App() {
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [chatActive, setChatActive] = useState(false)
  const [name, setName] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [onlineCount, setOnlineCount] = useState(null)
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)
  const chatTrackedRef = useRef(false)
  const contentRef = useRef(null)
  const cloneRef = useRef(null)
  const progressRef = useRef(null)
  const scrollInitialized = useRef(false)
  const chatOpenedAtRef = useRef(null)
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  const pingAudioRef = useRef(null)
  const lastMessageCountRef = useRef(0)

  useEffect(() => {
    setLoaded(true)
    trackVisit('page_view')
  }, [])

  useEffect(() => {
    if (!cloneRef.current || isMobile) return

    const initScroll = () => {
      if (scrollInitialized.current) return
      const cloneHeight = cloneRef.current?.offsetHeight
      if (cloneHeight > 0) {
        window.scrollTo({ top: cloneHeight, behavior: 'instant' })
        scrollInitialized.current = true
      }
    }

    initScroll()
    const timeout = setTimeout(initScroll, 100)
    return () => clearTimeout(timeout)
  }, [loaded, isMobile])

  useEffect(() => {
    const handleScroll = () => {
      if (!cloneRef.current || !contentRef.current || !progressRef.current) return

      const scrollTop = window.scrollY
      const cloneHeight = cloneRef.current.offsetHeight
      const contentHeight = contentRef.current.offsetHeight

      // Clone 2 starts after Clone 1 + Content
      const clone2Start = cloneHeight + contentHeight

      // Progress bar tracks position through the content section (0-100%)
      const scrollInContent = Math.max(0, scrollTop - cloneHeight)
      const progress = contentHeight > 0 ? (scrollInContent / contentHeight) * 100 : 0
      progressRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, progress / 100))})`

      // Skip infinite scroll wrapping on mobile
      if (isMobile) return

      // Wrap when entering Clone 2 (scrolling down past content)
      if (scrollTop >= clone2Start) {
        window.scrollTo({ top: scrollTop - contentHeight, behavior: 'instant' })
      }
      // Wrap when entering Clone 1 (scrolling up past content start)
      else if (scrollTop < cloneHeight) {
        window.scrollTo({ top: scrollTop + contentHeight, behavior: 'instant' })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile])

  useEffect(() => {
    const bgColor = darkMode ? '#09090b' : '#f4f4f5'
    document.documentElement.style.backgroundColor = bgColor
    document.body.style.backgroundColor = bgColor
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

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
      const res = await fetch('/api/get-messages')
      if (res.ok) {
        const data = await res.json()
        const openedAt = chatOpenedAtRef.current
        if (!openedAt) return

        const newMessages = data.filter(msg => new Date(msg.timestamp).getTime() > openedAt)

        const prevCount = lastMessageCountRef.current
        const hasNewResponse = newMessages.length > prevCount &&
          newMessages.some(msg => !msg.isWebhook &&
            new Date(msg.timestamp).getTime() > openedAt + 1000)

        if (hasNewResponse && pingAudioRef.current) {
          pingAudioRef.current.play().catch(() => {})
        }

        lastMessageCountRef.current = newMessages.length
        setMessages(newMessages)
      }
    } catch (e) {}
  }

  const fetchOnlineCount = async () => {
    try {
      const res = await fetch('/api/get-online-count')
      if (res.ok) {
        const data = await res.json()
        setOnlineCount(data.online)
      }
    } catch (e) {}
  }

  const getVisitorData = () => ({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screen: `${window.screen.width}x${window.screen.height}`,
    platform: navigator.platform,
    referrer: document.referrer || 'Direct',
    userAgent: navigator.userAgent
  })

  const trackVisit = async (type) => {
    try {
      if (type === 'page_view') {
        const lastVisit = localStorage.getItem('dacc_last_visit')
        const now = Date.now()
        const tenMinutes = 10 * 60 * 1000

        if (lastVisit && (now - parseInt(lastVisit)) < tenMinutes) {
          return
        }
        localStorage.setItem('dacc_last_visit', now.toString())
      }

      const payload = { type }
      if (type === 'chat_opened') {
        payload.visitorData = getVisitorData()
      }
      await fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (e) {}
  }

  const parseContent = (content, isWebhook) => {
    if (isWebhook) {
      return content.replace(/\*\*/g, '')
    }
    return content
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    const messageText = message.trim()
    const displayName = name.trim() || 'visitor'

    setError('')
    setSending(true)
    if (!chatActive) {
      setChatActive(true)
      if (!chatTrackedRef.current) {
        chatTrackedRef.current = true
        trackVisit('chat_opened')
      }
    }

    const optimisticMessage = {
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
        setError('Failed to send')
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      setError('Failed to send')
    } finally {
      setSending(false)
    }
  }

  const renderContent = (isClone = false) => (
    <div className="relative max-w-3xl mx-auto px-6 py-16 md:py-24">
      <header className={`mb-16 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-4 mb-8">
          <img
            src="/logo.png"
            alt="DACC Logo"
            className="w-14 h-14 rounded-lg"
          />
          <div>
            <h1 className={`text-2xl font-semibold tracking-tight transition-colors duration-300 ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>DACC</h1>
            <p className={`text-sm font-mono transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>De Anza Cybersecurity Club</p>
          </div>
        </div>

        <div className={`font-mono text-sm mb-6 transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
          <span className={`transition-colors duration-300 cyber-text-glow ${darkMode ? 'text-cyber-400' : 'text-cyber-600'}`}>$</span> cat welcome.txt
        </div>

        <p className={`text-lg leading-relaxed transition-colors duration-300 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
          A student-led community for learning cybersecurity fundamentals,
          earning certifications, and getting hands-on with industry tools.
        </p>
      </header>

      <section className={`mb-16 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className={`font-mono text-sm mb-4 transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
          <span className={`transition-colors duration-300 cyber-text-glow ${darkMode ? 'text-cyber-400' : 'text-cyber-600'}`}>$</span> ls ./goals/
        </div>

        <div className="space-y-4">
          <div className={`group p-4 rounded-lg border transition-all duration-300 ${darkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-300 hover:border-zinc-400 bg-white/50'}`}>
            <h3 className={`font-medium mb-1 transition-colors duration-300 ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Security Foundations</h3>
            <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>Core cybersecurity concepts applicable across all programming disciplines</p>
          </div>

          <div className={`group p-4 rounded-lg border transition-all duration-300 ${darkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-300 hover:border-zinc-400 bg-white/50'}`}>
            <h3 className={`font-medium mb-1 transition-colors duration-300 ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Security+ Certification</h3>
            <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>Structured curriculum to help members achieve CompTIA Security+ certification</p>
          </div>

          <div className={`group p-4 rounded-lg border transition-all duration-300 ${darkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-300 hover:border-zinc-400 bg-white/50'}`}>
            <h3 className={`font-medium mb-1 transition-colors duration-300 ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Hands-On Tools</h3>
            <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>Practical experience with Burp Suite, Nmap, Wireshark, and more</p>
          </div>
        </div>
      </section>

      <section className={`mb-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className={`font-mono text-sm mb-4 transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
          <span className={`transition-colors duration-300 cyber-text-glow ${darkMode ? 'text-cyber-400' : 'text-cyber-600'}`}>$</span> ./join.sh
        </div>

        <p className={`mb-6 transition-colors duration-300 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          No prior experience required. Just bring curiosity and willingness to learn.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://discord.gg/AmjfRrJd5j"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyber-600 hover:bg-cyber-500 text-white rounded-lg font-medium transition-colors cyber-btn-glow-subtle"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Discord
          </a>

          <a
            href="https://docs.google.com/document/d/1-wV6SDBT-5YoyfhNu-sBbnQondH0kmZM/edit?usp=sharing&ouid=111115151815479546677&rtpof=true&sd=true"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-5 py-2.5 border rounded-lg font-medium transition-colors ${darkMode ? 'border-zinc-700 hover:border-zinc-600 text-zinc-300' : 'border-zinc-400 hover:border-zinc-500 text-zinc-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Constitution
          </a>
        </div>
      </section>

      {!isClone && (
        <section className={`mb-16 transition-all duration-700 delay-350 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className={`font-mono text-sm mb-4 transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
            <span className={`transition-colors duration-300 cyber-text-glow ${darkMode ? 'text-cyber-400' : 'text-cyber-600'}`}>$</span> ./petition.sh
          </div>

          <a
            href="/petition"
            className={`group block p-5 rounded-xl border transition-all duration-300 ${darkMode ? 'border-zinc-800 hover:border-cyber-800 bg-zinc-900/50 hover:bg-cyber-950/30' : 'border-zinc-300 hover:border-cyber-300 bg-white/50 hover:bg-cyber-50/50'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <h3 className={`font-medium transition-colors duration-300 ${darkMode ? 'text-zinc-100 group-hover:text-cyber-400' : 'text-zinc-900 group-hover:text-cyber-600'}`}>
                Sign the Club Petition
              </h3>
              <svg className={`w-5 h-5 transition-all duration-300 group-hover:translate-x-1 ${darkMode ? 'text-zinc-600 group-hover:text-cyber-400' : 'text-zinc-400 group-hover:text-cyber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </section>
      )}

      {!isClone && (
        <section className={`mb-16 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className={`font-mono text-sm mb-4 transition-colors duration-300 ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
            <span className={`transition-colors duration-300 cyber-text-glow ${darkMode ? 'text-cyber-400' : 'text-cyber-600'}`}>$</span> echo "message us" <span className={`transition-colors duration-300 ${darkMode ? 'text-zinc-600' : 'text-zinc-500'}`}># live chat (might not respond immediately) - #general</span>
          </div>

          {chatActive && onlineCount !== null && (
            <div className={`flex items-center gap-2 mb-3 text-xs font-mono ${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-500"></span>
              </span>
              {onlineCount} online
            </div>
          )}

          {chatActive && (
            <div className="mb-4 max-h-48 overflow-y-auto space-y-1">
              {messages.length === 0 ? (
                <p className={`text-xs font-mono ${darkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>
                  May not get a response immediately
                </p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="font-mono text-sm">
                    <span className={darkMode ? 'text-zinc-600' : 'text-zinc-500'}>[{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>{' '}
                    <span className={msg.isWebhook ? 'text-cyan-500' : (darkMode ? 'text-cyber-400' : 'text-cyber-600')}>{msg.author}:</span>{' '}
                    <span className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>{parseContent(msg.content, msg.isWebhook)}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          <form onSubmit={sendMessage} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                className={`flex-1 px-3 py-2 bg-transparent border rounded-lg text-sm focus:outline-none transition-colors ${darkMode ? 'border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700' : 'border-zinc-300 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400'}`}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-100' : 'bg-zinc-200 hover:bg-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 text-zinc-900'}`}
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
            <div className="group flex items-center gap-2">
              <span className={`text-xs transition-colors ${darkMode ? 'text-zinc-600 group-hover:text-zinc-400' : 'text-zinc-500 group-hover:text-zinc-700'}`}>
                + add name
              </span>
              <input
                type="text"
                placeholder="Username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className={`w-0 opacity-0 group-hover:w-24 group-hover:opacity-100 focus:w-24 focus:opacity-100 px-2 py-1 bg-transparent border rounded text-xs focus:outline-none transition-all duration-200 ${darkMode ? 'border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700' : 'border-zinc-300 text-zinc-900 placeholder-zinc-500 focus:border-zinc-400'}`}
              />
            </div>
          </form>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </section>
      )}

      <footer className={`pt-8 border-t transition-all duration-700 delay-500 ${darkMode ? 'border-zinc-800' : 'border-zinc-300'} ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className={`text-sm font-mono transition-colors duration-300 ${darkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>
          <span className={`transition-colors duration-300 cyber-text-glow ${darkMode ? 'text-cyber-400' : 'text-cyber-600'}`}>$</span> curl{' '}
          <a href="https://www.deanza.edu" target="_blank" rel="noopener noreferrer" className={`transition-colors hover:underline ${darkMode ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-800'}`}>deanza.edu</a>
        </p>
      </footer>
    </div>
  )

  return (
    <div className={`transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-900 light'}`}>
      <audio ref={pingAudioRef} src="/discord_ping_sound_effect.mp3" preload="auto" />
      <div
        ref={progressRef}
        className="fixed top-0 left-0 w-full h-0.5 bg-cyber-400 z-50 origin-left cyber-bar-glow"
        style={{ transform: 'scaleX(0)' }}
      />

      <div className={`fixed inset-0 pointer-events-none transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-cyber-950/20 via-transparent to-cyan-950/20' : 'bg-gradient-to-br from-cyber-100/40 via-transparent to-cyan-100/40'}`} />

      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-6 right-6 z-40 p-2.5 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-12 ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400' : 'bg-white hover:bg-zinc-200 text-zinc-700 shadow-md'}`}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      {!isMobile && <div ref={cloneRef} aria-hidden="true">{renderContent(true)}</div>}

      <div ref={contentRef}>{renderContent(false)}</div>

      {!isMobile && <div aria-hidden="true">{renderContent(true)}</div>}
    </div>
  )
}

export default App
