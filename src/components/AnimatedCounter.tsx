import { useState, useEffect } from 'react'

interface AnimatedCounterProps {
  value: number
  inView?: boolean
  duration?: number
  className?: string
}

/**
 * Simple count-up animation triggered when `inView` becomes true.
 * Previously defined locally inside Dashboard.tsx.
 */
export function AnimatedCounter({
  value,
  inView = true,
  duration = 1200,
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return

    const startTime = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [inView, value, duration])

  return <span className={className}>{count}</span>
}

export default AnimatedCounter
