import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'

type AuthStep = 'email' | 'password' | 'create-password' | 'profile'

interface PasswordStrength {
  score: number
  label: string
  color: string
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'WEAK', color: 'bg-hack-red' }
  if (score <= 2) return { score, label: 'FAIR', color: 'bg-hack-orange' }
  if (score <= 3) return { score, label: 'GOOD', color: 'bg-hack-yellow' }
  return { score, label: 'STRONG', color: 'bg-matrix' }
}

function Auth() {
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { user, checkEmailExists, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

  const passwordStrength = getPasswordStrength(password)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('[ERROR] Email address required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const exists = await checkEmailExists(email)
      setIsNewUser(!exists)
      setStep(exists ? 'password' : 'create-password')
    } catch {
      setError('[ERROR] Failed to verify email. Retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('[ERROR] Password required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signInWithEmail(email, password)
      navigate('/dashboard')
    } catch {
      setError('[ERROR] Invalid credentials. Check password.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordCreate = (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('[ERROR] Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('[ERROR] Passwords do not match')
      return
    }
    if (passwordStrength.score < 2) {
      setError('[ERROR] Password too weak. Add numbers or symbols.')
      return
    }
    setError('')
    setStep('profile')
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
      await signUpWithEmail(email, password, displayName, studentId, profilePicture || undefined)
      navigate('/dashboard')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (errorMessage.includes('email-already-in-use')) {
        setError('[ERROR] Email already registered. Try signing in.')
      } else {
        setError('[ERROR] Registration failed. Retry.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch {
      setError('[ERROR] Google auth rejected. Retry.')
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

  const goBack = () => {
    setError('')
    if (step === 'password' || step === 'create-password') {
      setStep('email')
      setPassword('')
      setConfirmPassword('')
    } else if (step === 'profile') {
      setStep('create-password')
    }
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
        <form onSubmit={handleEmailSubmit} className="space-y-4">
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
            <span className="text-matrix">&gt;</span> Enter your email to continue
          </p>

          {error && (
            <div className="text-hack-red text-sm font-terminal">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-hack-filled rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                VERIFYING...
              </span>
            ) : (
              'CONTINUE'
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 py-4 mt-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-matrix/30 to-transparent" />
          <span className="text-xs text-gray-600 font-terminal">OR</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-matrix/30 to-transparent" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full group card-hack rounded-lg p-4 text-left transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center group-hover:neon-box transition-shadow">
              <svg className="w-5 h-5 text-matrix" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-matrix font-semibold text-sm">CONTINUE WITH GOOGLE</div>
              <div className="text-xs text-gray-500 font-terminal">OAuth 2.0</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )

  const renderPasswordStep = () => (
    <div className="terminal-window max-w-md mx-auto">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-4 text-xs text-gray-500 font-terminal">sign_in.sh</span>
      </div>
      <div className="terminal-body">
        <div className="mb-4 p-3 rounded-lg bg-matrix/5 border border-matrix/20">
          <p className="text-xs text-gray-500 font-terminal">SIGNING IN AS</p>
          <p className="text-matrix font-semibold">{email}</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-gray-500 font-terminal">--password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="input-hack w-full rounded-lg pr-12"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-matrix transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-hack-red text-sm font-terminal">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="btn-hack rounded-lg"
            >
              BACK
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-hack-filled rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AUTHENTICATING...
                </span>
              ) : (
                'SIGN IN'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  const renderCreatePasswordStep = () => (
    <div className="terminal-window max-w-md mx-auto">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-4 text-xs text-gray-500 font-terminal">create_password.sh</span>
      </div>
      <div className="terminal-body">
        <div className="mb-4 p-3 rounded-lg bg-matrix/5 border border-matrix/20">
          <p className="text-xs text-gray-500 font-terminal">CREATING ACCOUNT FOR</p>
          <p className="text-matrix font-semibold">{email}</p>
        </div>

        <form onSubmit={handlePasswordCreate} className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-gray-500 font-terminal">--password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="input-hack w-full rounded-lg pr-12"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-matrix transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-terminal ${passwordStrength.score >= 3 ? 'text-matrix' : passwordStrength.score >= 2 ? 'text-hack-yellow' : 'text-hack-red'}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-terminal">
                  <span className="text-matrix">&gt;</span> Use 8+ chars, mixed case, numbers, symbols
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-500 font-terminal">--confirm-password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-hack w-full rounded-lg"
              placeholder="Confirm password"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-hack-red font-terminal mt-1">Passwords do not match</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-matrix font-terminal mt-1">Passwords match</p>
            )}
          </div>

          {error && (
            <div className="text-hack-red text-sm font-terminal">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="btn-hack rounded-lg"
            >
              BACK
            </button>
            <button
              type="submit"
              disabled={!password || !confirmPassword || password !== confirmPassword}
              className="btn-hack-filled rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CONTINUE
            </button>
          </div>
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="btn-hack rounded-lg"
            >
              BACK
            </button>
            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="btn-hack-filled rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  CREATING ACCOUNT...
                </span>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  const getStepIndicator = () => {
    if (step === 'email') return null
    const steps = isNewUser
      ? ['email', 'create-password', 'profile']
      : ['email', 'password']
    const currentIndex = steps.indexOf(step)
    const totalSteps = steps.length

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all ${
              i <= currentIndex ? 'bg-matrix neon-box' : 'bg-gray-700'
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-gray-600 font-terminal">
          {currentIndex + 1}/{totalSteps}
        </span>
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
            <span className="text-gray-400 font-terminal">./authenticate --secure</span>
          </div>

          <h1 className="text-3xl font-bold neon-text tracking-tight mb-2">
            {step === 'email' && 'AUTHENTICATION'}
            {step === 'password' && 'SIGN IN'}
            {step === 'create-password' && 'CREATE PASSWORD'}
            {step === 'profile' && 'SETUP PROFILE'}
          </h1>
          <p className="text-gray-500">
            <span className="text-hack-cyan">[INFO]</span>{' '}
            {step === 'email' && 'Enter your email to continue'}
            {step === 'password' && 'Welcome back! Enter your password'}
            {step === 'create-password' && 'Create a secure password for your account'}
            {step === 'profile' && 'Complete your profile to finish registration'}
          </p>
        </header>

        {/* Step Indicator */}
        {getStepIndicator()}

        {/* Content */}
        <div
          className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          {step === 'email' && renderEmailStep()}
          {step === 'password' && renderPasswordStep()}
          {step === 'create-password' && renderCreatePasswordStep()}
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
