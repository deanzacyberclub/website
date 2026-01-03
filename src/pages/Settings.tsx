import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'
import PageHeader from '@/components/PageHeader'
import ConfirmDialog from '@/components/ConfirmDialog'

function Settings() {
  const [loaded, setLoaded] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)
  const [unlinkConfirmProvider, setUnlinkConfirmProvider] = useState<string | null>(null)
  const [unlinkLoading, setUnlinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, userProfile, loading: authLoading, updateUserProfile, deleteAccount, linkIdentity, unlinkIdentity } = useAuth()

  const linkedAccounts = userProfile?.linked_accounts || []

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  // Handle linking errors from URL
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'already_linked') {
        setLinkError('[ERROR] This account is already linked to another user')
      } else if (errorParam === 'linking_failed') {
        setLinkError('[ERROR] Failed to link account')
      } else {
        setLinkError(`[ERROR] ${decodeURIComponent(errorParam)}`)
      }
      // Clear the error from URL
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.display_name || '')
      setStudentId(userProfile.student_id || '')
      if (userProfile.photo_url) {
        setProfilePreview(userProfile.photo_url)
      }
    }
  }, [userProfile])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('[ERROR] Image must be under 5MB')
        return
      }
      setProfilePicture(file)
      setRemovePhoto(false)
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
    setRemovePhoto(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('[ERROR] Display name required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const pictureToUpload = removePhoto ? null : profilePicture
      // Student ID is passed but won't be changed (read-only)
      await updateUserProfile(displayName.trim(), studentId, pictureToUpload)
      setSuccess('[SUCCESS] Profile updated')
      setProfilePicture(null)
      setRemovePhoto(false)
    } catch {
      setError('[ERROR] Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError('')

    try {
      await deleteAccount()
      navigate('/')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setDeleteError(`[ERROR] ${errorMessage}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleLinkAccount = async (provider: 'github' | 'discord' | 'twitter' | 'linkedin_oidc') => {
    setLinkingProvider(provider)
    setLinkError('')
    try {
      await linkIdentity(provider)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setLinkError(`[ERROR] ${errorMessage}`)
      setLinkingProvider(null)
    }
  }

  const handleUnlinkAccount = async () => {
    if (!unlinkConfirmProvider) return

    if (linkedAccounts.length <= 1) {
      setLinkError('[ERROR] You must have at least one linked account')
      return
    }

    setUnlinkLoading(true)
    setLinkError('')
    try {
      await unlinkIdentity(unlinkConfirmProvider)
      setUnlinkConfirmProvider(null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setLinkError(`[ERROR] ${errorMessage}`)
    } finally {
      setUnlinkLoading(false)
    }
  }

  const getProviderDisplayName = (provider: string) => {
    return providerConfig[provider as keyof typeof providerConfig]?.name || provider
  }

  const providerConfig = {
    github: {
      name: 'GitHub',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
      bgColor: 'bg-[#24292e]',
      hoverColor: 'hover:bg-[#2f363d]',
      borderColor: 'border-gray-700'
    },
    discord: {
      name: 'Discord',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
      bgColor: 'bg-[#5865F2]',
      hoverColor: 'hover:bg-[#4752c4]',
      borderColor: 'border-[#5865F2]'
    },
    twitter: {
      name: 'X',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bgColor: 'bg-black',
      hoverColor: 'hover:bg-zinc-900',
      borderColor: 'border-zinc-700'
    },
    linkedin_oidc: {
      name: 'LinkedIn',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      bgColor: 'bg-[#0A66C2]',
      hoverColor: 'hover:bg-[#004182]',
      borderColor: 'border-[#0A66C2]'
    }
  }

  const isLinked = (provider: string) => linkedAccounts.some(a => a.provider === provider)
  const getLinkedAccount = (provider: string) => linkedAccounts.find(a => a.provider === provider)

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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <PageHeader backTo="/dashboard" backText="cd ../dashboard" />

          <div className="flex items-center gap-3 mb-4">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">./settings --edit-profile</span>
          </div>

          <h1 className="text-3xl font-bold neon-text tracking-tight mb-2">SETTINGS</h1>
          <p className="text-gray-500">
            <span className="text-hack-cyan">[INFO]</span> Manage your profile and account
          </p>
        </header>

        {/* Profile Form */}
        <div
          className={`terminal-window mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">edit_profile.sh</span>
          </div>
          <div className="terminal-body">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-matrix font-terminal">Profile Picture</p>
                  <p className="text-xs text-gray-600 mb-2">Max 5MB, click to change</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-matrix hover:underline"
                    >
                      Upload new
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

              {/* Display Name */}
              <div>
                <label className="block text-sm mb-2 text-gray-500 font-terminal">--display-name *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="input-hack w-full rounded-lg"
                  placeholder="Your display name"
                />
              </div>

              {/* Student ID (read-only) */}
              <div>
                <label className="block text-sm mb-2 text-gray-500 font-terminal">--student-id (read-only)</label>
                <input
                  type="text"
                  value={studentId}
                  disabled
                  className="input-hack w-full rounded-lg opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 font-terminal mt-1">
                  <span className="text-matrix">&gt;</span> Student ID cannot be changed after account creation
                </p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm mb-2 text-gray-500 font-terminal">--email (read-only)</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="input-hack w-full rounded-lg opacity-50 cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="text-hack-red text-sm font-terminal">{error}</div>
              )}

              {success && (
                <div className="text-matrix text-sm font-terminal">{success}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-hack-filled rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    SAVING...
                  </span>
                ) : (
                  'SAVE CHANGES'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Linked Accounts */}
        <div
          className={`terminal-window mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '250ms' }}
        >
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">link_accounts.sh</span>
          </div>
          <div className="terminal-body">
            <p className="text-sm text-gray-500 font-terminal mb-4">
              <span className="text-matrix">&gt;</span> Link additional accounts to sign in with multiple providers
            </p>

            {linkError && (
              <div className="text-hack-red text-sm font-terminal mb-4">{linkError}</div>
            )}

            <div className="space-y-3">
              {(Object.keys(providerConfig) as Array<keyof typeof providerConfig>).map((provider) => {
                const config = providerConfig[provider]
                const linked = isLinked(provider)
                const linkedAccount = getLinkedAccount(provider)
                const isLinking = linkingProvider === provider

                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-terminal-bg/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        {config.icon}
                      </div>
                      <div>
                        <span className="font-medium">{config.name}</span>
                        {linked && (
                          <span className="ml-2 text-xs text-matrix font-terminal">[LINKED]</span>
                        )}
                        {linkedAccount?.provider_username && (
                          <p className="text-xs text-gray-500">@{linkedAccount.provider_username}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {linked ? (
                        <button
                          onClick={() => setUnlinkConfirmProvider(provider)}
                          disabled={linkedAccounts.length <= 1}
                          className="px-3 py-1.5 text-xs font-terminal border border-hack-red/50 text-hack-red rounded-lg hover:bg-hack-red/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={linkedAccounts.length <= 1 ? 'You must have at least one linked account' : undefined}
                        >
                          UNLINK
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLinkAccount(provider)}
                          disabled={isLinking}
                          className="px-3 py-1.5 text-xs font-terminal border border-matrix/50 text-matrix rounded-lg hover:bg-matrix/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLinking ? (
                            <span className="flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              LINKING...
                            </span>
                          ) : (
                            'LINK'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-gray-600 font-terminal mt-4">
              <span className="text-matrix">&gt;</span> You can sign in with any linked account
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div
          className={`terminal-window transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '350ms' }}
        >
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-hack-red font-terminal">danger_zone.sh</span>
          </div>
          <div className="terminal-body">
            <div className="border border-hack-red/30 rounded-lg p-4 bg-hack-red/5">
              <h3 className="text-hack-red font-semibold mb-2">Delete Account</h3>
              <p className="text-gray-500 text-sm mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-hack-red/20 border border-hack-red/50 text-hack-red rounded-lg hover:bg-hack-red/30 transition-colors font-terminal text-sm"
              >
                DELETE ACCOUNT
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        isOpen={unlinkConfirmProvider !== null}
        onClose={() => {
          setUnlinkConfirmProvider(null)
          setLinkError('')
        }}
        onConfirm={handleUnlinkAccount}
        title={`UNLINK ${unlinkConfirmProvider ? getProviderDisplayName(unlinkConfirmProvider).toUpperCase() : ''}?`}
        message={`This will unlink your ${unlinkConfirmProvider ? getProviderDisplayName(unlinkConfirmProvider) : ''} account. You won't be able to sign in with it anymore.`}
        confirmText="UNLINK"
        loading={unlinkLoading}
        error={linkError}
        variant="warning"
        icon={
          <svg className="w-8 h-8 text-hack-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.181 8.68l-5.629 5.629m0 0l.884 3.177 3.177.884m-4.06-4.06l-1.768-1.768a2 2 0 010-2.828l6.364-6.364a2 2 0 012.829 0l1.767 1.768" />
          </svg>
        }
      />

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteError('')
        }}
        onConfirm={handleDeleteAccount}
        title="DELETE ACCOUNT?"
        message="This will permanently delete your account, profile data, and cannot be undone."
        confirmText="DELETE FOREVER"
        loading={deleteLoading}
        error={deleteError}
        variant="danger"
      />
    </div>
  )
}

export default Settings
