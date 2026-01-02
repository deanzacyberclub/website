import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'

function Login() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const navigate = useNavigate()
  const { user, signInWithMagicLink, verifyOtp } = useAuth()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('[ERROR] Email required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signInWithMagicLink(email)
      setMagicLinkSent(true)
    } catch {
      setError('[ERROR] Failed to send magic link. Retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6)
    setOtpCode(digitsOnly)
  }

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      setOtpError('[ERROR] Please enter a 6-digit code')
      return
    }
    setOtpLoading(true)
    setOtpError('')
    try {
      await verifyOtp(email, otpCode)
      // Auth state change will handle navigation
    } catch {
      setOtpError('[ERROR] Invalid or expired code. Retry.')
    } finally {
      setOtpLoading(false)
    }
  }

  // Magic link sent confirmation
  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix">
        <div className="crt-overlay" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
          <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-matrix transition-colors mb-6 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-terminal text-sm">cd ..</span>
            </Link>
          </header>

          <div className="terminal-window max-w-md mx-auto">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">magic_link_sent.sh</span>
            </div>
            <div className="terminal-body text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center neon-box">
                <svg className="w-8 h-8 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-matrix font-bold text-lg mb-2">CHECK YOUR EMAIL</h3>
              <p className="text-gray-500 text-sm mb-4">
                We sent a magic link to <span className="text-matrix">{email}</span>
              </p>
              <p className="text-xs text-gray-600 font-terminal mb-6">
                Click the link in the email to sign in
              </p>

              {/* OTP Code Entry */}
              {showOtpInput ? (
                <form onSubmit={handleOtpSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-sm mb-2 text-gray-500 font-terminal">--verification-code</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      className="input-hack w-full rounded-lg text-center text-2xl tracking-[0.5em] font-terminal"
                      placeholder="000000"
                      maxLength={6}
                      inputMode="numeric"
                      autoFocus
                    />
                    <p className="text-xs text-gray-600 font-terminal mt-1 text-center">
                      <span className="text-matrix">&gt;</span> Enter the 6-digit code from your email
                    </p>
                  </div>

                  {otpError && (
                    <div className="text-hack-red text-sm font-terminal text-center">{otpError}</div>
                  )}

                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="btn-hack-filled rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        VERIFYING...
                      </span>
                    ) : (
                      'VERIFY CODE'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpInput(false)
                      setOtpCode('')
                      setOtpError('')
                    }}
                    className="text-gray-500 hover:text-matrix text-xs font-terminal transition-colors w-full"
                  >
                    Back to waiting for link
                  </button>
                </form>
              ) : (
                <>
                  <button
                    onClick={() => setShowOtpInput(true)}
                    className="text-gray-500 hover:text-matrix text-xs font-terminal transition-colors mb-4"
                  >
                    Having trouble with the link? Enter code manually
                  </button>

                  <div>
                    <button
                      onClick={() => {
                        setMagicLinkSent(false)
                        setEmail('')
                        setShowOtpInput(false)
                        setOtpCode('')
                      }}
                      className="btn-hack rounded-lg"
                    >
                      BACK
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <Footer />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-matrix transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-terminal text-sm">cd ..</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">./login --secure</span>
          </div>

          <h1 className="text-3xl font-bold neon-text tracking-tight mb-2">SIGN IN</h1>
          <p className="text-gray-500">
            <span className="text-hack-cyan">[INFO]</span> Welcome back, agent
          </p>
        </header>

        {/* Login Form */}
        <div
          className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="terminal-window max-w-md mx-auto">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">session_login.sh</span>
            </div>
            <div className="terminal-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-500 font-terminal">--email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="input-hack w-full rounded-lg"
                    placeholder="agent@domain.com"
                  />
                </div>

                <p className="text-xs text-gray-600 font-terminal">
                  <span className="text-matrix">&gt;</span> We'll send you a magic link to sign in
                </p>

                {error && (
                  <div className="text-hack-red text-sm font-terminal">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-hack-filled rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      SENDING...
                    </span>
                  ) : (
                    'SEND MAGIC LINK'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 font-terminal mt-6">
          <span className="text-matrix">[INFO]</span> By signing in, you agree to our{' '}
          <Link to="/terms" className="text-matrix hover:underline">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-matrix hover:underline">Privacy Policy</Link>
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default Login
