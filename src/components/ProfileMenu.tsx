import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmDialog from './ConfirmDialog'
import { User, Login, Home, Settings, Logout } from '@/lib/cyberIcon'

function ProfileMenu() {
  const navigate = useNavigate()
  const { userProfile, signOut, loading } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setLoggingOut(true)
    await signOut()
    setLoggingOut(false)
    setShowLogoutConfirm(false)
    setShowMenu(false)
    navigate('/')
  }

  // Loading state - show skeleton
  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-terminal-alt border-2 border-gray-700 animate-pulse" />
    )
  }

  // Signed out state
  if (!userProfile) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-600 hover:border-matrix transition-colors focus:outline-none focus:ring-2 focus:ring-matrix/50"
        >
          <div className="w-full h-full bg-terminal-alt flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 py-2 bg-terminal-alt border border-gray-700 rounded-lg shadow-lg z-50">
            <Link
              to="/auth"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-matrix/10 hover:text-matrix transition-colors"
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
        onClick={() => setShowMenu(!showMenu)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-matrix/50 hover:border-matrix transition-colors focus:outline-none focus:ring-2 focus:ring-matrix/50"
      >
        {userProfile.photo_url ? (
          <img
            src={userProfile.photo_url}
            alt={userProfile.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-matrix/20 flex items-center justify-center text-matrix font-bold">
            {userProfile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-terminal-alt border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="px-4 py-2 border-b border-gray-700">
            <p className="text-sm font-semibold text-matrix truncate">{userProfile.display_name}</p>
            <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
          </div>
          <Link
            to="/dashboard"
            onClick={() => setShowMenu(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-matrix/10 hover:text-matrix transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/settings"
            onClick={() => setShowMenu(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-matrix/10 hover:text-matrix transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <div className="border-t border-gray-700 my-1" />
          <button
            onClick={() => {
              setShowMenu(false)
              setShowLogoutConfirm(true)
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-hack-red/10 hover:text-hack-red transition-colors"
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
        icon={<Logout className="w-8 h-8 text-hack-yellow" />}
      />
    </div>
  )
}

export default ProfileMenu
