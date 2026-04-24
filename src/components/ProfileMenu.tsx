import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from './ConfirmDialog'
import { User, Login, Home, Settings, Logout, Shield, ChevronRight } from '@/lib/cyberIcon'

function ProfileMenu() {
  const navigate = useNavigate()
  const { userProfile, signOut, loading } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const ignoreNextOutsideClick = useRef(false)

  const closeMenu = () => {
    setIsClosing(true)
    setTimeout(() => {
      setShowMenu(false)
      setIsClosing(false)
    }, 200)
  }

  const toggleMenu = () => {
    if (!showMenu) {
      setShowMenu(true)
      ignoreNextOutsideClick.current = true
      setTimeout(() => {
        ignoreNextOutsideClick.current = false
      }, 0)
    } else {
      closeMenu()
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ignoreNextOutsideClick.current) return
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (showMenu && !isClosing) {
          closeMenu()
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu, isClosing])

  const handleSignOut = async () => {
    setLoggingOut(true)
    await signOut()
    setLoggingOut(false)
    setShowLogoutConfirm(false)
    closeMenu()
    navigate('/')
  }

  // Loading state - show skeleton
  if (loading) {
    return (
      <div className="w-8 h-8 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-terminal-alt animate-pulse" />
    )
  }

  // Signed out state
  if (!userProfile) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={toggleMenu}
          className="w-8 h-8 overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-matrix transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 dark:focus:ring-matrix/50 flex items-center justify-center bg-gray-100 dark:bg-terminal-alt"
        >
          <User className="w-4 h-4 text-gray-500 dark:text-gray-500" />
        </button>

        {showMenu && (
          <div className={`absolute right-0 mt-2 w-52 z-50 origin-top-right transition-all duration-200 ease-out ${
            isClosing ? 'animate-[slideUp_0.2s_ease-out]' : 'animate-[slideDown_0.2s_ease-out]'
          }`}>
            {/* Terminal window dropdown */}
            <div className="terminal-window overflow-hidden">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-3 text-xs text-gray-500 font-terminal">guest.sh</span>
              </div>
              <div className="py-1">
                <Link
                  to="/auth"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-matrix/10 hover:text-green-700 dark:hover:text-matrix transition-all group"
                >
                  <Login className="w-4 h-4 shrink-0" />
                  <span className="flex-1">Sign in</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-matrix/40" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Signed in state
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 group"
      >
        {/* Avatar - square for CLI aesthetic */}
        <div className="w-8 h-8 overflow-hidden border-2 border-green-300 dark:border-matrix/50 hover:border-green-500 dark:hover:border-matrix transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 dark:focus:ring-matrix/50 shrink-0">
          {userProfile.photo_url ? (
            <img
              src={userProfile.photo_url}
              alt={userProfile.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-green-100 dark:bg-matrix/20 flex items-center justify-center text-green-700 dark:text-matrix font-bold text-sm">
              {userProfile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {/* Online indicator dot */}
        <span className="hidden sm:block w-1.5 h-1.5 bg-green-500 dark:bg-matrix rounded-full animate-pulse" />
      </button>

      {showMenu && (
        <div className={`absolute right-0 mt-2 w-56 z-50 origin-top-right transition-all duration-200 ease-out ${
          isClosing ? 'animate-[slideUp_0.2s_ease-out]' : 'animate-[slideDown_0.2s_ease-out]'
        }`}>
          {/* Terminal window dropdown */}
          <div className="terminal-window overflow-hidden">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-3 text-xs text-gray-500 font-terminal truncate max-w-[120px]">
                {userProfile.display_name.toLowerCase().replace(/\s+/g, '_')}.sh
              </span>
              <span className="ml-auto text-[10px] text-green-600 dark:text-matrix/60 font-terminal">
                ONLINE
              </span>
            </div>

            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 overflow-hidden border border-gray-300 dark:border-gray-700 shrink-0">
                  {userProfile.photo_url ? (
                    <img src={userProfile.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-green-100 dark:bg-matrix/20 flex items-center justify-center text-green-700 dark:text-matrix font-bold text-xs">
                      {userProfile.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-matrix truncate">{userProfile.display_name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-600 truncate font-terminal">{userProfile.email}</p>
                </div>
              </div>
              {userProfile.is_officer && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-terminal text-purple-700 dark:text-hack-purple border border-purple-200 dark:border-hack-purple/30 px-2 py-0.5 bg-purple-50 dark:bg-hack-purple/5 w-fit">
                  <Shield className="w-3 h-3" />
                  OFFICER
                </div>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-matrix/10 hover:text-green-700 dark:hover:text-matrix transition-all group relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-matrix scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                <Home className="w-4 h-4 shrink-0" />
                <span className="flex-1">Dashboard</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-matrix/40" />
              </Link>
              <Link
                to="/settings"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-matrix/10 hover:text-green-700 dark:hover:text-matrix transition-all group relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-matrix scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                <Settings className="w-4 h-4 shrink-0" />
                <span className="flex-1">Settings</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-matrix/40" />
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-800" />

            {/* Logout */}
            <div className="py-1">
              <button
                onClick={() => {
                  closeMenu()
                  setShowLogoutConfirm(true)
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-hack-red/10 hover:text-red-600 dark:hover:text-hack-red transition-all group relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 dark:bg-hack-red scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                <Logout className="w-4 h-4 shrink-0" />
                <span className="flex-1">Logout</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-matrix/40" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="SIGN OUT"
        cancelText="CANCEL"
        loading={loggingOut}
        variant="warning"
        icon={<Logout className="w-8 h-8 text-yellow-600 dark:text-hack-yellow" />}
      />
    </div>
  )
}

export default ProfileMenu
