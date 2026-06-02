import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import MeetingDetails from '@/pages/MeetingDetails'
import { Close } from '@/lib/cyberIcon'

interface MeetingDetailSheetProps {
  slug: string | null
  onClose: () => void
  onSelectMeeting?: (slug: string) => void
  availableTopics?: string[]
}

export default function MeetingDetailSheet({
  slug,
  onClose,
  onSelectMeeting,
  availableTopics,
}: MeetingDetailSheetProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Lock background scroll when open (important on mobile)
  useEffect(() => {
    if (!slug) return

    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const scrollY = window.scrollY

    document.body.style.overflow = 'hidden'

    if (isMobile) {
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = ''

      if (isMobile) {
        window.scrollTo(0, scrollY)
      }
    }
  }, [slug, isMobile])

  if (!slug) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-stretch justify-end"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel / Sheet */}
      <div
        className={`relative flex flex-col w-full md:w-[640px] lg:w-[760px] bg-white dark:bg-terminal-bg border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden ${
          isMobile
            ? 'rounded-t-2xl max-h-[92vh] sheet-slide-up'
            : 'h-full sheet-slide-right'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-terminal-alt flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-terminal text-gray-500 dark:text-gray-400">MEETING</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-matrix/20 text-blue-700 dark:text-matrix font-terminal">DETAIL</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label="Close meeting details"
          >
            <Close className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex h-3 items-center justify-center md:hidden bg-gray-50 dark:bg-terminal-alt">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <MeetingDetails
            slug={slug}
            embedded
            availableTopics={availableTopics}
            onClose={onClose}
            onSelectMeeting={onSelectMeeting}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
