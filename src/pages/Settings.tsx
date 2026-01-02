import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'

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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { user, userProfile, loading: authLoading, updateUserProfile, deleteAccount } = useAuth()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

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
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-matrix transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-terminal text-sm">cd ../dashboard</span>
          </Link>

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

        {/* Danger Zone */}
        <div
          className={`terminal-window transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '300ms' }}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteModal(false)
              setDeleteError('')
            }}
          />
          <div className="relative terminal-window max-w-md w-full">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-hack-red font-terminal">confirm_delete.sh</span>
            </div>
            <div className="terminal-body">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-hack-red/20 border border-hack-red/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-hack-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-hack-red font-bold text-lg mb-2">DELETE ACCOUNT?</h3>
                <p className="text-gray-500 text-sm">
                  This will permanently delete your account, profile data, and cannot be undone.
                </p>
              </div>

              <p className="text-xs text-gray-600 font-terminal mb-4 text-center">
                <span className="text-matrix">[INFO]</span> This action cannot be undone
              </p>

              {deleteError && (
                <div className="text-hack-red text-sm font-terminal mb-4 text-center">{deleteError}</div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteError('')
                  }}
                  className="btn-hack rounded-lg flex-1"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-hack-red/20 border border-hack-red/50 text-hack-red rounded-lg hover:bg-hack-red/30 transition-colors font-terminal text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      DELETING...
                    </span>
                  ) : (
                    'DELETE FOREVER'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
