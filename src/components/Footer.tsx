import { Link, useLocation } from 'react-router-dom'

interface FooterProps {
  className?: string
}

function Footer({ className = '' }: FooterProps) {
  const location = useLocation()
  const fullUrl = `${window.location.origin.replace('https://', '').replace('http://', '')}${location.pathname}`
  const maxLength = 30
  const displayUrl = fullUrl.length > maxLength
    ? fullUrl.slice(0, maxLength) + '...'
    : fullUrl

  return (
    <footer className={`mt-16 pb-10 pt-8 border-t border-terminal-border ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-gray-600 font-terminal">
            <span className="text-matrix neon-text-subtle">$</span> ping{' '}
            <span className="text-matrix/70" title={fullUrl}>{displayUrl}</span>
          </p>
          <div className="text-sm text-gray-600 font-terminal">
            <span className="text-matrix/50">[</span>
            <span className="text-matrix neon-text">200</span> OK
            <span className="text-matrix/50">]</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center">
          Made with ❤️ from Cupertino, CA by{' '}
          <a
            href="https://github.com/aaronhma"
            target="_blank"
            rel="noopener noreferrer"
            className="text-matrix/70 hover:text-matrix hover:neon-text-subtle transition-all"
          >
            Aaron Ma ↗
          </a>
          {' '}and{' '}
          <a
            href="https://github.com/boredcreator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-matrix/70 hover:text-matrix hover:neon-text-subtle transition-all"
          >
            Neel Anshu ↗
          </a>
          .
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <Link to="/terms" className="text-matrix/70 hover:text-matrix hover:neon-text-subtle transition-all">
            Terms of Service
          </Link>
          <span className="text-gray-700">|</span>
          <Link to="/privacy" className="text-matrix/70 hover:text-matrix hover:neon-text-subtle transition-all">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
