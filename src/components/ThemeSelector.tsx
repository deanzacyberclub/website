import { useTheme, Theme } from '@/contexts/ThemeContext'

function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'Auto', icon: '💻' },
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-600 font-mono uppercase tracking-wider">
        Theme:
      </span>
      <div className="flex gap-1">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`px-3 py-1.5 text-xs font-mono transition-all border ${
              theme === t.value
                ? 'bg-blue-100 dark:bg-matrix/20 text-blue-700 dark:text-matrix border-blue-300 dark:border-matrix'
                : 'bg-gray-100 dark:bg-terminal-alt text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-matrix/50'
            }`}
            aria-label={`Switch to ${t.label} mode`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ThemeSelector
