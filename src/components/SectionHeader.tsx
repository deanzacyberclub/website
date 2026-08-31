interface SectionHeaderProps {
  index: string
  title: string
  className?: string
}

/**
 * Shared section header with [index] badge + title + subtle line.
 * Single source of truth for Dashboard, Settings, and similar pages.
 *
 * The public landing page (App.tsx) uses its own more decorative variant
 * and keeps a local copy to avoid any visual drift on the homepage.
 */
export function SectionHeader({
  index,
  title,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      <span className="font-mono text-xs text-green-600/40 dark:text-matrix/30">
        [{index}]
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-matrix uppercase tracking-wide">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-matrix/20 to-transparent" />
    </div>
  )
}

export default SectionHeader
