import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'

type AuthStep = 'email' | 'profile'

function Auth() {
  const [searchParams] = useSearchParams()
  const initialStep = searchParams.get('step') === 'profile' ? 'profile' : 'email'

  const [step, setStep] = useState<AuthStep>(initialStep)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { user, userProfile, signInWithMagicLink, verifyOtp, createProfile } = useAuth()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    // If user is logged in and has a profile, go to dashboard
    if (user && userProfile) {
      navigate('/dashboard')
    }
    // If user is logged in but no profile, go to profile step
    if (user && !userProfile && step !== 'profile') {
      setStep('profile')
    }
  }, [user, userProfile, navigate, step])

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('[ERROR] Email address required')
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

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('[ERROR] Display name required')
      return
    }
    if (studentId && studentId.length !== 8) {
      setError('[ERROR] Student ID must be 8 digits')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createProfile(displayName, studentId, profilePicture || undefined)
      navigate('/dashboard')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (errorMessage.includes('already') || errorMessage.includes('duplicate')) {
        setError('[ERROR] Profile already exists.')
      } else {
        setError('[ERROR] Failed to create profile. Retry.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('[ERROR] Image must be under 5MB')
        return
      }
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStudentIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
    setStudentId(value)
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

  const renderEmailStep = () => (
    <div className="terminal-window max-w-md mx-auto">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-4 text-xs text-gray-500 font-terminal">init_auth.sh</span>
      </div>
      <div className="terminal-body">
        <form onSubmit={handleMagicLink} className="space-y-4">
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
  )

  const renderProfileStep = () => (
    <div className="terminal-window max-w-md mx-auto">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-4 text-xs text-gray-500 font-terminal">setup_profile.sh</span>
      </div>
      <div className="terminal-body">
        <p className="text-sm text-gray-500 font-terminal mb-4">
          <span className="text-matrix">&gt;</span> Tell us about yourself
        </p>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center cursor-pointer hover:neon-box transition-shadow overflow-hidden"
            >
              {profilePreview ? (
                <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-matrix/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-matrix font-terminal">Profile Picture</p>
              <p className="text-xs text-gray-600">(Optional) Max 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {profilePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setProfilePicture(null)
                    setProfilePreview(null)
                  }}
                  className="text-xs text-hack-red hover:underline mt-1"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-500 font-terminal">--display-name *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
              className="input-hack w-full rounded-lg"
              placeholder="What should we call you?"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-500 font-terminal">--student-id</label>
            <input
              type="text"
              value={studentId}
              onChange={handleStudentIdChange}
              className="input-hack w-full rounded-lg"
              placeholder="8-digit De Anza ID (optional)"
              maxLength={8}
              inputMode="numeric"
            />
            <p className="text-xs text-gray-600 font-terminal mt-1">
              <span className="text-matrix">&gt;</span> Optional: {studentId.length}/8 digits
            </p>
          </div>

          {error && (
            <div className="text-hack-red text-sm font-terminal">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="btn-hack-filled rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                CREATING PROFILE...
              </span>
            ) : (
              'COMPLETE SETUP'
            )}
          </button>
        </form>
      </div>
    </div>
  )

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
            <span className="text-gray-400 font-terminal">./authenticate --secure</span>
          </div>

          <h1 className="text-3xl font-bold neon-text tracking-tight mb-2">
            {step === 'email' && 'SIGN IN'}
            {step === 'profile' && 'SETUP PROFILE'}
          </h1>
          <p className="text-gray-500">
            <span className="text-hack-cyan">[INFO]</span>{' '}
            {step === 'email' && 'Enter your email to receive a magic link'}
            {step === 'profile' && 'Complete your profile to finish registration'}
          </p>
        </header>

        {/* Content */}
        <div
          className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          {step === 'email' && renderEmailStep()}
          {step === 'profile' && renderProfileStep()}
        </div>

        {step === 'email' && (
          <div className="text-center text-xs text-gray-600 font-terminal mt-6">
            <span className="text-matrix">[INFO]</span> By signing in, you agree to our{' '}
            <Link to="/terms" className="text-matrix hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-matrix hover:underline">Privacy Policy</Link>
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default Auth
