import { useState, useEffect, useRef } from 'react'
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
  const [isClosing, setIsClosing] = useState(false)
  const [activeSlug, setActiveSlug] = useState<string | null>(slug)

  // Refs for animation control
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Keep onClose stable in touch handlers without adding to deps
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Tracks whether a swipe-to-close gesture is in progress so the slug
  // useEffect doesn't double-fire triggerClose when URL clears.
  const isSwipeClosingRef = useRef(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Slug → null: run exit animation. Null → slug or slug swap: open immediately.
  useEffect(() => {
    if (slug) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      setIsClosing(false)
      setActiveSlug(slug)
    } else if (activeSlug) {
      if (!isSwipeClosingRef.current) {
        triggerClose()
      } else {
        // Swipe animation already handled close — just clean up React state.
        isSwipeClosingRef.current = false
        setActiveSlug(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }, [])

  const ANIM_MS = isMobile ? 240 : 210

  function triggerClose() {
    if (isClosing || closeTimerRef.current) return
    setIsClosing(true)
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      setIsClosing(false)
      setActiveSlug(null)
      onClose()
    }, ANIM_MS)
  }

  // ─── Swipe-to-close gesture (mobile only) ────────────────────────────────
  useEffect(() => {
    if (!isMobile) return
    const panel = panelRef.current
    if (!panel) return

    const CLOSE_DISTANCE = 150   // px dragged before auto-close on release
    const CLOSE_VELOCITY = 0.4   // px/ms — fast flick closes regardless of distance
    const ANIM_CLOSE_MS = 220
    const ANIM_SNAP_MS  = 300

    let isDragging = false
    let startedInHeader = false
    let startY = 0
    let lastY = 0
    let lastT = 0
    let currentDragY = 0

    const resetInlineStyles = () => {
      panel.style.transition = ''
      panel.style.transform  = ''
      const bd = backdropRef.current
      if (bd) { bd.style.transition = ''; bd.style.opacity = '' }
    }

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      lastY  = startY
      lastT  = performance.now()
      isDragging     = false
      currentDragY   = 0
      // Allow dragging from anywhere in the header zone regardless of scroll position
      startedInHeader = !!headerRef.current?.contains(e.target as Node)
      resetInlineStyles()
    }

    const onTouchMove = (e: TouchEvent) => {
      const scrollTop = scrollAreaRef.current?.scrollTop ?? 0
      const y = e.touches[0].clientY
      const deltaY = y - startY

      if (deltaY > 0 && (startedInHeader || scrollTop <= 0)) {
        // Dragging down from header (always) or from content when scrolled to top.
        e.preventDefault()
        isDragging   = true
        currentDragY = Math.max(0, deltaY)
        panel.style.transition = 'none'
        panel.style.transform  = `translateY(${currentDragY}px)`
        const bd = backdropRef.current
        if (bd) bd.style.opacity = String(Math.max(0, 1 - currentDragY / 350))
        lastY = y
        lastT = performance.now()
      } else if (isDragging && deltaY < 0) {
        // User swiped back up while mid-drag — snap to rest position.
        e.preventDefault()
        isDragging   = false
        currentDragY = 0
        panel.style.transition = `transform ${ANIM_SNAP_MS}ms cubic-bezier(0.32,0.72,0,1)`
        panel.style.transform  = 'translateY(0)'
        const bd = backdropRef.current
        if (bd) { bd.style.transition = `opacity ${ANIM_SNAP_MS}ms ease`; bd.style.opacity = '1' }
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return
      isDragging = false

      const dt = performance.now() - lastT
      const dy = e.changedTouches[0].clientY - lastY
      const velocity = dt > 0 ? dy / dt : 0
      const captured = currentDragY
      currentDragY = 0

      if (captured > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) {
        // ── Swipe close ──────────────────────────────────────────────────
        isSwipeClosingRef.current = true
        panel.style.transition = `transform ${ANIM_CLOSE_MS}ms cubic-bezier(0.32,0.72,0,1)`
        panel.style.transform  = 'translateY(100%)'
        const bd = backdropRef.current
        if (bd) { bd.style.transition = `opacity ${ANIM_CLOSE_MS}ms ease`; bd.style.opacity = '0' }
        setTimeout(() => {
          onCloseRef.current()
        }, ANIM_CLOSE_MS)
      } else {
        // ── Snap back ────────────────────────────────────────────────────
        panel.style.transition = `transform ${ANIM_SNAP_MS}ms cubic-bezier(0.32,0.72,0,1)`
        panel.style.transform  = 'translateY(0)'
        const bd = backdropRef.current
        if (bd) { bd.style.transition = `opacity ${ANIM_SNAP_MS}ms ease`; bd.style.opacity = '1' }
      }
    }

    panel.addEventListener('touchstart', onTouchStart, { passive: true })
    panel.addEventListener('touchmove',  onTouchMove,  { passive: false })
    panel.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      panel.removeEventListener('touchstart', onTouchStart)
      panel.removeEventListener('touchmove',  onTouchMove)
      panel.removeEventListener('touchend',   onTouchEnd)
    }
  }, [isMobile, activeSlug])

  // Background scroll lock — use overflow:hidden on <html> so the scroll
  // position is preserved automatically when unlocked (no jump on close).
  useEffect(() => {
    if (!activeSlug) return
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [activeSlug])

  if (!activeSlug) return null

  const panelAnimClass = isClosing
    ? isMobile ? 'sheet-slide-up-exit' : 'sheet-slide-right-exit'
    : isMobile ? 'sheet-slide-up'      : 'sheet-slide-right'

  const backdropClass = isClosing ? 'opacity-0' : 'opacity-100'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-stretch justify-end"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={`absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${backdropClass}`}
        onClick={triggerClose}
      />

      {/* Panel / Sheet */}
      <div
        ref={panelRef}
        className={`relative flex flex-col w-full md:w-[640px] lg:w-[760px] bg-white dark:bg-terminal-bg border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden ${
          isMobile ? 'rounded-t-2xl max-h-[92vh]' : 'h-full'
        } ${panelAnimClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header zone — entire area is the swipe-to-close drag target on mobile */}
        <div ref={headerRef} className="flex-shrink-0 bg-gray-50 dark:bg-terminal-alt border-b border-gray-200 dark:border-white/10 touch-none select-none">
          {/* Mobile drag handle */}
          {isMobile && (
            <div className="flex pt-2 pb-1 items-center justify-center">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
          )}
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-terminal text-gray-500 dark:text-gray-400">MEETING</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-matrix/20 text-blue-700 dark:text-matrix font-terminal">DETAIL</span>
            </div>
            <button
              onClick={triggerClose}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Close meeting details"
            >
              <Close className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollAreaRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <MeetingDetails
            slug={activeSlug}
            embedded
            availableTopics={availableTopics}
            onClose={triggerClose}
            onSelectMeeting={onSelectMeeting}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
