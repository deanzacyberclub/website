import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'

function Dashboard() {
  const [loaded, setLoaded] = useState(false)
  const { user, userProfile, signOut, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="flex items-center gap-3 justify-center">
            <svg className="animate-spin h-6 w-6 text-matrix" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-terminal text-lg neon-pulse">Loading session...</span>
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
            <span className="text-gray-400 font-terminal">./dashboard --user</span>
          </div>

          <h1 className="text-3xl font-bold neon-text tracking-tight mb-2">DASHBOARD</h1>
          <p className="text-gray-500">
            <span className="text-hack-cyan">[INFO]</span> Welcome to your member portal
          </p>
        </header>

        {/* User Info Terminal Window */}
        <div
          className={`terminal-window mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">user_session.sh</span>
            <span className="ml-auto text-xs text-gray-600 font-terminal status-online">ACTIVE</span>
          </div>
          <div className="terminal-body">
            <div className="flex items-start gap-4 mb-6">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-16 h-16 rounded-lg border border-matrix/40 neon-box"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-matrix/10 border border-matrix/40 flex items-center justify-center neon-box">
                  <svg className="w-8 h-8 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-matrix font-semibold text-lg truncate">
                  {user.displayName || 'Agent'}
                </p>
                <p className="text-gray-500 text-sm truncate">{user.email}</p>
                <div className="mt-2 text-xs text-gray-600 font-terminal">
                  <span className="text-matrix">UID:</span> {user.uid.slice(0, 12)}...
                </div>
              </div>
            </div>

            <div className="border-t border-matrix/20 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-terminal">
                <div>
                  <span className="text-gray-600">STATUS</span>
                  <p className="text-matrix mt-1">AUTHENTICATED</p>
                </div>
                <div>
                  <span className="text-gray-600">AUTH_METHOD</span>
                  <p className="text-matrix mt-1">
                    {user.providerData[0]?.providerId === 'google.com' ? 'GOOGLE' : 'EMAIL'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">STUDENT_ID</span>
                  <p className={`mt-1 ${userProfile?.studentId ? 'text-matrix' : 'text-gray-600'}`}>
                    {userProfile?.studentId || 'NOT SET'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">CREATED</span>
                  <p className="text-matrix mt-1">
                    {user.metadata.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <div className="text-sm text-gray-500 font-terminal mb-4">
            <span className="text-matrix">&gt;</span> Quick navigation:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/meetings"
              className="card-hack rounded-lg p-4 group transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center group-hover:neon-box transition-shadow">
                  <svg className="w-5 h-5 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-matrix font-semibold text-sm">MEETINGS</p>
                  <p className="text-xs text-gray-600">View upcoming events</p>
                </div>
              </div>
            </Link>

            <Link
              to="/live"
              className="card-hack rounded-lg p-4 group transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center group-hover:neon-box transition-shadow">
                  <svg className="w-5 h-5 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-matrix font-semibold text-sm">ATTENDANCE</p>
                  <p className="text-xs text-gray-600">Check in to events</p>
                </div>
              </div>
            </Link>

            <Link
              to="/petition"
              className="card-hack rounded-lg p-4 group transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center group-hover:neon-box transition-shadow">
                  <svg className="w-5 h-5 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="text-matrix font-semibold text-sm">PETITION</p>
                  <p className="text-xs text-gray-600">Sign club petition</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Sign Out Button */}
        <div
          className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '400ms' }}
        >
          <button
            onClick={handleSignOut}
            className="btn-hack rounded-lg inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            TERMINATE SESSION
          </button>
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default Dashboard
