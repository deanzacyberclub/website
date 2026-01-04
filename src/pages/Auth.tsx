import { useState, useEffect, FormEvent, ChangeEvent, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner, GitHubAlt, Discord, LinkedIn, Plus } from '@/lib/cyberIcon'

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
  const { user, userProfile, loading: authLoading, signInWithGitHub, signInWithDiscord, signInWithLinkedIn, createProfile } = useAuth()

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

  const handleLinkedInSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithLinkedIn()
    } catch {
      setError('[ERROR] Failed to sign in with LinkedIn. Retry.')
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
            <Spinner className="animate-spin h-6 w-6 text-matrix" />
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
            className="w-full flex items-center px-4 py-3 bg-[#24292e] hover:bg-[#2f363d] border border-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitHubAlt className="w-5 h-5 shrink-0" />
            <span className="font-medium flex-1 text-center">Continue with GitHub</span>
          </button>

          <button
            onClick={handleDiscordSignIn}
            disabled={loading}
            className="w-full flex items-center px-4 py-3 bg-[#5865F2] hover:bg-[#4752c4] border border-[#5865F2] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Discord className="w-5 h-5 shrink-0" />
            <span className="font-medium flex-1 text-center">Continue with Discord</span>
          </button>

          <button
            onClick={handleLinkedInSignIn}
            disabled={loading}
            className="w-full flex items-center px-4 py-3 bg-[#0A66C2] hover:bg-[#004182] border border-[#0A66C2] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkedIn className="w-5 h-5 shrink-0" />
            <span className="font-medium flex-1 text-center">Continue with LinkedIn</span>
          </button>
        </div>

        {error && (
          <div className="text-hack-red text-sm font-terminal mt-4">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
            <Spinner className="animate-spin h-4 w-4" />
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
                <Plus className="w-8 h-8 text-matrix/50" />
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
                <Spinner className="animate-spin h-4 w-4" />
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

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
      </div>
    </div>
  )
}

export default Auth
