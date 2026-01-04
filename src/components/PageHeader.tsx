import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ProfileMenu from './ProfileMenu'

function PageHeader() {
  const location = useLocation()
  const { user } = useAuth()
  const isEventsActive = location.pathname.startsWith('/meetings')
  const isCheckInActive = location.pathname === '/live'

  return (
    <div className="flex items-center justify-between mb-8">
      <Link
        to={user ? '/dashboard' : '/'}
        className="glitch text-matrix hover:text-matrix transition-colors font-terminal text-sm tracking-tight neon-text-subtle"
        data-text="[dacc]"
      >
        [dacc]
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/meetings"
          className={`${isEventsActive
            ? 'text-matrix neon-text-subtle'
            : 'text-gray-500 hover:text-matrix'
            } transition-colors font-terminal text-sm`}
        >
          events
        </Link>
        <Link
          to="/ctf"
          className={`${location.pathname === '/ctf'
            ? 'text-matrix neon-text-subtle'
            : 'text-gray-500 hover:text-matrix'
            } transition-colors font-terminal text-sm`}
        >
          ctf
        </Link>
        <Link
          to="/live"
          className={`${isCheckInActive
            ? 'text-matrix neon-text-subtle'
            : 'text-gray-500 hover:text-matrix'
            } transition-colors font-terminal text-sm`}
        >
          check-in
        </Link>
      </div>

      <ProfileMenu />
    </div>
  )
}

export default PageHeader
