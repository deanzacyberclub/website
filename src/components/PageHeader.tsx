import { Link } from 'react-router-dom'
import ProfileMenu from './ProfileMenu'

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
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
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
