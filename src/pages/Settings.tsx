import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/components/ConfirmDialog'
import { GitHubAlt, Discord, X, LinkedIn, Spinner, User, Unlink } from '@/lib/cyberIcon'

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

  const handleLinkAccount = async (provider: 'github' | 'discord' | 'x' | 'linkedin_oidc') => {
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
      icon: <GitHubAlt className="w-5 h-5" />,
      bgColor: 'bg-[#24292e]',
      hoverColor: 'hover:bg-[#2f363d]',
      borderColor: 'border-gray-700'
    },
    discord: {
      name: 'Discord',
      icon: <Discord className="w-5 h-5" />,
      bgColor: 'bg-[#5865F2]',
      hoverColor: 'hover:bg-[#4752c4]',
      borderColor: 'border-[#5865F2]'
    },
    x: {
      name: 'X',
      icon: <X className="w-5 h-5" />,
      bgColor: 'bg-black',
      hoverColor: 'hover:bg-zinc-900',
      borderColor: 'border-zinc-700'
    },
    linkedin_oidc: {
      name: 'LinkedIn',
      icon: <LinkedIn className="w-5 h-5" />,
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
            <Spinner className="animate-spin h-6 w-6 text-matrix" />
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

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Header */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
                    <User className="w-8 h-8 text-matrix/50" />
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
                    <Spinner className="animate-spin h-4 w-4" />
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
                              <Spinner className="animate-spin h-3 w-3" />
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
        icon={<Unlink className="w-8 h-8 text-hack-yellow" />}
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
