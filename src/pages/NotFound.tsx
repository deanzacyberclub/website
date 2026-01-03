import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, Calendar } from '@/lib/cyberIcon'

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
                <Home className="w-4 h-4" />
                GO HOME
              </Link>
              <Link
                to="/meetings"
                className="btn-hack px-6 py-3 rounded-lg inline-flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
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
