import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getCtfdCredentials } from '@/lib/ctfd'
import { Copy, Check, ExternalLink, Spinner, Shield } from '@/lib/cyberIcon'

function CtfdCredentialsPopup() {
  const { user, userProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [credentials, setCredentials] = useState<{
    ctfd_username: string | null
    ctfd_password: string | null
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!user || !userProfile) {
      setCredentials(null)
      return
    }

    let cancelled = false

    const checkCredentials = async () => {
      setLoading(true)
      try {
        const creds = await getCtfdCredentials()
        if (cancelled) return
        setCredentials(creds)

        if (creds?.ctfd_username && creds?.ctfd_password) {
          const dismissed = sessionStorage.getItem('ctfd_popup_dismissed')
          if (!dismissed) {
            setIsOpen(true)
          }
        }
      } catch {
        // Credentials not available yet
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkCredentials()
    return () => { cancelled = true }
  }, [user, userProfile])

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowPassword(false)
    sessionStorage.setItem('ctfd_popup_dismissed', 'true')
  }

  if (!user || !userProfile) return null
  if (!credentials?.ctfd_username && !loading) return null
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative terminal-window max-w-md w-full">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="ml-4 text-xs font-terminal text-blue-600 dark:text-matrix">
            ctfd_credentials.sh
          </span>
        </div>
        <div className="terminal-body">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 border border-blue-300 dark:border-matrix/50 bg-blue-50 dark:bg-matrix/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600 dark:text-matrix" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-blue-700 dark:text-matrix">
              Your CTFd Account
            </h3>
            <p className="text-gray-600 dark:text-gray-500 text-sm">
              Use these credentials to log into the CTF competition platform.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
              <Spinner className="animate-spin h-5 w-5" />
              <span className="font-terminal text-sm">Loading...</span>
            </div>
          ) : credentials?.ctfd_username ? (
            <div className="space-y-3 mb-6">
              <div className="border border-gray-200 dark:border-gray-700 p-3">
                <label className="text-xs text-gray-500 dark:text-gray-600 font-terminal block mb-1">
                  USERNAME
                </label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-700 dark:text-matrix text-sm">
                    {credentials.ctfd_username}
                  </span>
                  <button
                    onClick={() => handleCopy(credentials.ctfd_username!, 'username')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-terminal-alt transition-colors"
                    title="Copy username"
                  >
                    {copiedField === 'username' ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-matrix" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 p-3">
                <label className="text-xs text-gray-500 dark:text-gray-600 font-terminal block mb-1">
                  PASSWORD
                </label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-700 dark:text-matrix text-sm">
                    {showPassword ? credentials.ctfd_password : '••••••••••'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-terminal-alt transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="text-xs text-gray-400">{showPassword ? 'HIDE' : 'SHOW'}</span>
                    </button>
                    <button
                      onClick={() => handleCopy(credentials.ctfd_password!, 'password')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-terminal-alt transition-colors"
                      title="Copy password"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-green-600 dark:text-matrix" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="cli-btn-dashed flex-1"
            >
              CLOSE
            </button>
            <a
              href="https://dactf.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="cli-btn-filled flex-1 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              GO TO CTFd
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CtfdCredentialsPopup
