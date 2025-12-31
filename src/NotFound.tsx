import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function NotFound() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen flex items-center justify-center px-6">
      <div className={`max-w-lg w-full transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="terminal-window">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">error_404</span>
          </div>
          <div className="terminal-body text-center py-12">
            <div className="text-6xl font-bold text-hack-red neon-text mb-4 font-terminal">
              404
            </div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-matrix">$</span>
              <span className="text-gray-400 font-terminal">cat /var/www/page</span>
            </div>
            <p className="text-hack-red mb-2 font-terminal">
              [ERROR] File not found
            </p>
            <p className="text-gray-500 text-sm mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="btn-hack-filled px-6 py-3 rounded-lg inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                GO HOME
              </Link>
              <Link
                to="/meetings"
                className="btn-hack px-6 py-3 rounded-lg inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                EVENTS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
