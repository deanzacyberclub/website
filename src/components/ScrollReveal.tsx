import { ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  className?: string
  /** Intersection threshold (0–1). Default 0.1 */
  threshold?: number
  /** If true, animation only fires once (default true) */
  triggerOnce?: boolean
}

/**
 * Lightweight scroll-triggered entrance animation wrapper.
 * Single source of truth (previously duplicated in App.tsx, Dashboard.tsx, Settings.tsx).
 *
 * Respects `prefers-reduced-motion`.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className = '',
  threshold = 0.1,
  triggerOnce = true,
}: ScrollRevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold, triggerOnce })

  // Respect user motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const shouldAnimate = !prefersReducedMotion

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} ${
        !shouldAnimate || inView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
      }`}
      style={{
        transitionDelay: shouldAnimate ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  )
}

export default ScrollReveal
