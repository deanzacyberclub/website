import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from '@/components/ConfirmDialog'
import { GitHubAlt, Discord, LinkedIn, Spinner, User, Unlink, Check, Key, AlertTriangle, Code } from '@/lib/cyberIcon'
import { useInView } from '@/hooks/useInView'

// ─── Scroll Reveal Wrapper ───────────────────────────
function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─── Section Header ──────────────────────────────────
function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="font-mono text-xs text-green-600/40 dark:text-matrix/30">[{index}]</span>
      <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-matrix uppercase tracking-wide">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-matrix/20 to-transparent" />
    </div>
  )
}

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
  const { user, userProfile, updateUserProfile, deleteAccount, linkIdentity, unlinkIdentity } = useAuth()

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

  const handleLinkAccount = async (provider: 'github' | 'discord' | 'linkedin_oidc') => {
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
      lightBg: 'bg-gray-100',
      hoverColor: 'hover:bg-[#2f363d]',
      borderColor: 'border-gray-700 dark:border-gray-600',
      textColor: 'text-gray-900 dark:text-white',
      accentColor: 'text-gray-600 dark:text-gray-400',
    },
    discord: {
      name: 'Discord',
      icon: <Discord className="w-5 h-5" />,
      bgColor: 'bg-[#5865F2]',
      lightBg: 'bg-indigo-50',
      hoverColor: 'hover:bg-[#4752c4]',
      borderColor: 'border-indigo-300 dark:border-[#5865F2]/50',
      textColor: 'text-indigo-700 dark:text-white',
      accentColor: 'text-indigo-600 dark:text-indigo-300',
    },
    linkedin_oidc: {
      name: 'LinkedIn',
      icon: <LinkedIn className="w-5 h-5" />,
      bgColor: 'bg-[#0A66C2]',
      lightBg: 'bg-blue-50',
      hoverColor: 'hover:bg-[#004182]',
      borderColor: 'border-blue-300 dark:border-[#0A66C2]/50',
      textColor: 'text-blue-700 dark:text-white',
      accentColor: 'text-blue-600 dark:text-blue-300',
    }
  }

  const isLinked = (provider: string) => linkedAccounts.some(a => a.provider === provider)
  const getLinkedAccount = (provider: string) => linkedAccounts.find(a => a.provider === provider)

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className={`mb-10 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix rounded-full animate-pulse" />
            <span className="font-mono text-xs text-gray-400 dark:text-matrix/40 uppercase tracking-widest">
              System Settings
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-matrix uppercase tracking-tight mb-2">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-500 font-mono text-sm">
            <span className="text-green-700 dark:text-matrix">$</span> ./settings --edit-profile
          </p>
        </header>

        {/* Profile Form */}
        <ScrollReveal delay={0}>
          <section className="mb-10">
            <SectionHeader index="01" title="Edit Profile" />
            <div className="terminal-window group">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">edit_profile.sh</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-matrix/40 font-terminal">
                  {userProfile?.id?.slice(0, 8)}...
                </span>
              </div>
              <div className="terminal-body">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-start gap-5">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 bg-green-50 dark:bg-matrix/5 border border-green-200 dark:border-matrix/30 flex items-center justify-center cursor-pointer hover:border-green-500 dark:hover:border-matrix/50 transition-all overflow-hidden group/photo relative"
                    >
                      {profilePreview ? (
                        <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-green-300 dark:text-matrix/40" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <span className="text-white text-[10px] font-terminal uppercase">Change</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-700 dark:text-matrix font-terminal mb-1">Profile Picture</p>
                      <p className="text-xs text-gray-500 dark:text-gray-600 mb-3">Max 5MB, click to change</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-terminal text-green-700 dark:text-matrix hover:underline flex items-center gap-1"
                        >
                          <Code className="w-3 h-3" />
                          Upload new
                        </button>
                        {profilePreview && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-xs font-terminal text-red-600 dark:text-hack-red hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-xs mb-2 text-gray-500 dark:text-gray-500 font-terminal uppercase tracking-wider">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="input-hack w-full"
                      placeholder="Your display name"
                    />
                  </div>

                  {/* Student ID (read-only) */}
                  <div>
                    <label className="block text-xs mb-2 text-gray-500 dark:text-gray-500 font-terminal uppercase tracking-wider">
                      Student ID <span className="text-gray-400 dark:text-gray-600 font-normal normal-case">(read-only)</span>
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      disabled
                      className="input-hack w-full opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-600 font-terminal mt-2">
                      <span className="text-green-700 dark:text-matrix">&gt;</span> Student ID cannot be changed after account creation
                    </p>
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-xs mb-2 text-gray-500 dark:text-gray-500 font-terminal uppercase tracking-wider">
                      Email <span className="text-gray-400 dark:text-gray-600 font-normal normal-case">(read-only)</span>
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input-hack w-full opacity-50 cursor-not-allowed"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-hack-red text-sm font-terminal border border-red-200 dark:border-hack-red/30 p-3 bg-red-50 dark:bg-hack-red/5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 text-green-700 dark:text-matrix text-sm font-terminal border border-green-200 dark:border-matrix/30 p-3 bg-green-50 dark:bg-matrix/5">
                      <Check className="w-4 h-4 shrink-0" />
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="cli-btn-filled disabled:opacity-50 disabled:cursor-not-allowed"
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
          </section>
        </ScrollReveal>

        {/* Linked Accounts */}
        <ScrollReveal delay={50}>
          <section className="mb-10">
            <SectionHeader index="02" title="Linked Accounts" />
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">link_accounts.sh</span>
              </div>
              <div className="terminal-body">
                <p className="text-sm text-gray-500 dark:text-gray-500 font-terminal mb-5">
                  <span className="text-green-700 dark:text-matrix">$</span> Link additional accounts to sign in with multiple providers
                </p>

                {linkError && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-hack-red text-sm font-terminal border border-red-200 dark:border-hack-red/30 p-3 bg-red-50 dark:bg-hack-red/5 mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {linkError}
                  </div>
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
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-terminal-bg/50 hover:border-green-500 dark:hover:border-matrix/30 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 ${config.bgColor} ${config.lightBg} border ${config.borderColor} transition-colors`}>
                            <div className={config.textColor}>
                              {config.icon}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">{config.name}</span>
                              {linked && (
                                <span className="text-[10px] text-green-700 dark:text-matrix font-terminal border border-green-200 dark:border-matrix/30 px-1.5 py-0.5 bg-green-50 dark:bg-matrix/5">
                                  LINKED
                                </span>
                              )}
                            </div>
                            {linkedAccount?.provider_username && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-0.5">
                                @{linkedAccount.provider_username}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          {linked ? (
                            <button
                              onClick={() => setUnlinkConfirmProvider(provider)}
                              disabled={linkedAccounts.length <= 1}
                              className="px-3 py-1.5 text-xs font-terminal border border-red-300 dark:border-hack-red/50 text-red-600 dark:text-hack-red hover:bg-red-50 dark:hover:bg-hack-red/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={linkedAccounts.length <= 1 ? 'You must have at least one linked account' : undefined}
                            >
                              UNLINK
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLinkAccount(provider)}
                              disabled={isLinking}
                              className="px-3 py-1.5 text-xs font-terminal border border-green-300 dark:border-matrix/50 text-green-700 dark:text-matrix hover:bg-green-50 dark:hover:bg-matrix/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              {isLinking ? (
                                <>
                                  <Spinner className="animate-spin h-3 w-3" />
                                  LINKING...
                                </>
                              ) : (
                                <>
                                  <Key className="w-3 h-3" />
                                  LINK
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-600 font-terminal mt-4">
                  <span className="text-green-700 dark:text-matrix">&gt;</span> You can sign in with any linked account
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Danger Zone */}
        <ScrollReveal delay={100}>
          <section>
            <SectionHeader index="03" title="Danger Zone" />
            <div className="terminal-window relative overflow-hidden">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-red-600 dark:text-hack-red font-terminal">danger_zone.sh</span>
                <span className="ml-auto text-xs text-red-600/60 dark:text-hack-red/40 font-terminal animate-pulse">WARNING</span>
              </div>
              <div className="terminal-body">
                <div className="border border-red-200 dark:border-hack-red/30 p-5 bg-red-50/50 dark:bg-hack-red/5 relative overflow-hidden group">
                  {/* Corner brackets */}
                  <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-300 dark:border-hack-red/40" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-300 dark:border-hack-red/40" />
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-300 dark:border-hack-red/40" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-300 dark:border-hack-red/40" />

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 border border-red-300 dark:border-hack-red/40 bg-red-100 dark:bg-hack-red/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-hack-red" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-red-700 dark:text-hack-red font-semibold mb-1">Delete Account</h3>
                      <p className="text-gray-600 dark:text-gray-500 text-sm mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-100 dark:bg-hack-red/20 border border-red-300 dark:border-hack-red/50 text-red-700 dark:text-hack-red hover:bg-red-200 dark:hover:bg-hack-red/30 transition-colors font-terminal text-sm flex items-center gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        DELETE ACCOUNT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
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
