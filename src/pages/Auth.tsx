import { useState, useEffect, FormEvent, ChangeEvent, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'

type AuthStep = 'signin' | 'profile'

function Auth() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<AuthStep>('signin')
  const [displayName, setDisplayName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [oauthAvatarUrl, setOauthAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const studentIdRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const { user, userProfile, loading: authLoading, signInWithGitHub, signInWithDiscord, signInWithTwitter, createProfile } = useAuth()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return

    // If user is logged in and has a profile, go to dashboard
    if (user && userProfile) {
      navigate('/dashboard')
      return
    }

    // If user is logged in but no profile, show profile step
    if (user && !userProfile) {
      setStep('profile')
      // Get OAuth avatar from provider metadata
      const avatarUrl = user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        user.user_metadata?.avatar
      if (avatarUrl && !profilePreview) {
        setOauthAvatarUrl(avatarUrl)
        setProfilePreview(avatarUrl)
      }
      // Pre-fill display name from OAuth if available
      const oauthName = user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.user_name ||
        user.user_metadata?.preferred_username
      if (oauthName && !displayName) {
        setDisplayName(oauthName)
      }
      return
    }

    // If not logged in, always show signin (ignore ?step=profile)
    if (!user) {
      setStep('signin')
      // Clear the URL param if someone tries to access ?step=profile without being logged in
      if (searchParams.get('step') === 'profile') {
        navigate('/auth', { replace: true })
      }
    }
  }, [user, userProfile, authLoading, navigate, searchParams, profilePreview, displayName])

  const handleGitHubSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGitHub()
    } catch {
      setError('[ERROR] Failed to sign in with GitHub. Retry.')
      setLoading(false)
    }
  }

  const handleDiscordSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithDiscord()
    } catch {
      setError('[ERROR] Failed to sign in with Discord. Retry.')
      setLoading(false)
    }
  }

  const handleTwitterSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithTwitter()
    } catch {
      setError('[ERROR] Failed to sign in with X. Retry.')
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('[ERROR] Display name required')
      return
    }
    if (!studentId || studentId.length !== 8) {
      setError('[ERROR] Student ID is required (8 digits)')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Pass custom file if uploaded, otherwise pass OAuth avatar URL
      await createProfile(
        displayName,
        studentId,
        profilePicture || undefined,
        !profilePicture && oauthAvatarUrl ? oauthAvatarUrl : undefined
      )
      navigate('/dashboard')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Profile creation error:', err)
      if (errorMessage.includes('already') || errorMessage.includes('duplicate')) {
        setError('[ERROR] Profile already exists.')
      } else if (errorMessage.includes('Database not configured')) {
        setError('[ERROR] Database not configured. Run supabase/setup.sql first.')
      } else {
        setError(`[ERROR] ${errorMessage}`)
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
      // When uploading custom file, clear OAuth avatar (we'll use the file instead)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setProfilePicture(null)
    setProfilePreview(null)
    setOauthAvatarUrl(null)
  }

  const handleStudentIdDigitChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const newId = studentId.split('')

    // Pad with empty strings if needed
    while (newId.length < 8) newId.push('')

    newId[index] = digit
    setStudentId(newId.join(''))

    // Move to next input if digit entered
    if (digit && index < 7) {
      studentIdRefs.current[index + 1]?.focus()
    }
  }

  const handleStudentIdKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!studentId[index] && index > 0) {
        // If current box is empty, move to previous and clear it
        e.preventDefault()
        const newId = studentId.split('')
        while (newId.length < 8) newId.push('')
        newId[index - 1] = ''
        setStudentId(newId.join(''))
        studentIdRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      studentIdRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 7) {
      e.preventDefault()
      studentIdRefs.current[index + 1]?.focus()
    }
  }

  const handleStudentIdPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (pastedData) {
      setStudentId(pastedData)
      // Focus on the last filled input or the next empty one
      const focusIndex = Math.min(pastedData.length, 7)
      studentIdRefs.current[focusIndex]?.focus()
    }
  }

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="flex items-center gap-3 justify-center">
            <svg className="animate-spin h-6 w-6 text-matrix" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-terminal text-lg neon-pulse">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  const renderSignInStep = () => (
    <div className="terminal-window max-w-md mx-auto">
      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-4 text-xs text-gray-500 font-terminal">init_auth.sh</span>
      </div>
      <div className="terminal-body">
        <p className="text-sm text-gray-500 font-terminal mb-6">
          <span className="text-matrix">&gt;</span> Choose your authentication method
        </p>

        <div className="space-y-3">
          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24292e] hover:bg-[#2f363d] border border-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="font-medium">Continue with GitHub</span>
          </button>

          <button
            onClick={handleDiscordSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#5865F2] hover:bg-[#4752c4] border border-[#5865F2] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span className="font-medium">Continue with Discord</span>
          </button>

          <button
            onClick={handleTwitterSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black hover:bg-zinc-900 border border-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="font-medium">Continue with X</span>
          </button>
        </div>

        {error && (
          <div className="text-hack-red text-sm font-terminal mt-4">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-terminal">Redirecting...</span>
          </div>
        )}
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
              <p className="text-xs text-gray-600">
                {oauthAvatarUrl && !profilePicture ? 'From your account' : '(Optional) Max 5MB'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-matrix hover:underline"
                >
                  {profilePreview ? 'Change' : 'Upload'}
                </button>
                {profilePreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs text-hack-red hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
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
            <label className="block text-sm mb-2 text-gray-500 font-terminal">--student-id *</label>
            {/* 8 separate boxes for larger screens */}
            <div className="hidden sm:flex gap-2 justify-between">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <input
                  key={index}
                  ref={(el) => { studentIdRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={studentId[index] || ''}
                  onChange={(e) => handleStudentIdDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleStudentIdKeyDown(index, e)}
                  onPaste={handleStudentIdPaste}
                  className="w-10 h-12 text-center text-lg font-terminal bg-terminal-bg border border-matrix/30 rounded-lg text-matrix focus:border-matrix focus:neon-box outline-none transition-all"
                />
              ))}
            </div>
            {/* Single input for mobile */}
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="8-digit De Anza ID"
              className="sm:hidden input-hack w-full rounded-lg"
            />
            <p className="text-xs text-gray-600 font-terminal mt-2">
              <span className="text-matrix">&gt;</span> De Anza Student ID
              <span className="text-hack-yellow ml-2">(cannot be changed later)</span>
            </p>
          </div>

          {error && (
            <div className="text-hack-red text-sm font-terminal">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !displayName.trim() || studentId.length !== 8}
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
            {step === 'signin' && 'SIGN IN'}
            {step === 'profile' && 'SETUP PROFILE'}
          </h1>
          <p className="text-gray-500">
            <span className="text-hack-cyan">[INFO]</span>{' '}
            {step === 'signin' && 'Securely sign in with a supported provider'}
            {step === 'profile' && 'Complete your profile to finish registration'}
          </p>
        </header>

        {/* Content */}
        <div
          className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          {step === 'signin' && renderSignInStep()}
          {step === 'profile' && renderProfileStep()}
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default Auth
