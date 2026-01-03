import { Link } from 'react-router-dom'
import ProfileMenu from './ProfileMenu'
import { ChevronLeft } from '@/lib/cyberIcon'

interface PageHeaderProps {
  backTo?: string
  backText?: string
}

function PageHeader({ backTo, backText }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {backTo && backText ? (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-matrix transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-terminal text-sm">{backText}</span>
        </Link>
      ) : (
        <div />
      )}

      <ProfileMenu />
    </div>
  )
}

export default PageHeader
