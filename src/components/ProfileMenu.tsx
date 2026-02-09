import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from './ConfirmDialog'
import { User, Login, Home, Settings, Logout } from '@/lib/cyberIcon'

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
    }, 200) // Match animation duration
  }

  const toggleMenu = () => {
    if (!showMenu) {
      setShowMenu(true)
      // Ignore the next outside click (which is the current click event bubbling)
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
      if (ignoreNextOutsideClick.current) {
        return
      }
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
      <div className="w-10 h-10 bg-gray-100 dark:bg-terminal-alt border-2 border-gray-300 dark:border-gray-700 animate-pulse" />
    )
  }

  // Signed out state
  if (!userProfile) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={toggleMenu}
          className="w-10 h-10 overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-matrix transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-matrix/50"
        >
          <div className="w-full h-full bg-gray-100 dark:bg-terminal-alt flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-500" />
          </div>
        </button>

        {showMenu && (
          <div className={`absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 shadow-lg z-50 origin-top-right transition-all duration-200 ease-out ${
            isClosing ? 'animate-[slideUp_0.2s_ease-out]' : 'animate-[slideDown_0.2s_ease-out]'
          }`}>
            <Link
              to="/auth"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-matrix/10 hover:text-blue-600 dark:hover:text-matrix transition-colors"
            >
              <Login className="w-4 h-4" />
              Sign in
            </Link>
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
        className="w-10 h-10 overflow-hidden border-2 border-blue-300 dark:border-matrix/50 hover:border-blue-500 dark:hover:border-matrix transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-matrix/50"
      >
        {userProfile.photo_url ? (
          <img
            src={userProfile.photo_url}
            alt={userProfile.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-100 dark:bg-matrix/20 flex items-center justify-center text-blue-600 dark:text-matrix font-bold">
            {userProfile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {showMenu && (
        <div className={`absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 shadow-lg z-50 origin-top-right transition-all duration-200 ease-out ${
          isClosing ? 'animate-[slideUp_0.2s_ease-out]' : 'animate-[slideDown_0.2s_ease-out]'
        }`}>
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-blue-600 dark:text-matrix truncate">{userProfile.display_name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-500 truncate">{userProfile.email}</p>
          </div>
          <Link
            to="/dashboard"
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-matrix/10 hover:text-blue-600 dark:hover:text-matrix transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/settings"
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-matrix/10 hover:text-blue-600 dark:hover:text-matrix transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <button
            onClick={() => {
              closeMenu()
              setShowLogoutConfirm(true)
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-hack-red/10 hover:text-red-600 dark:hover:text-hack-red transition-colors"
          >
            <Logout className="w-4 h-4" />
            Logout
          </button>
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
