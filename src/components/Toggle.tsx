interface ToggleProps {
  isActive: boolean
  onToggle: (value: boolean) => void
  leftLabel: string
  rightLabel: string
}

function Toggle({ isActive, onToggle, leftLabel, rightLabel }: ToggleProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`text-sm font-terminal transition-all ${
          !isActive ? 'text-matrix neon-text-subtle' : 'text-gray-500 hover:text-gray-400'
        }`}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={() => onToggle(!isActive)}
        className={`relative w-14 h-7  transition-all border-2 ${
          isActive
            ? 'bg-matrix/30 border-matrix'
            : 'bg-terminal-alt border-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5  transition-all duration-200 ${
            isActive
              ? 'left-7 bg-white'
              : 'left-1 bg-gray-400'
          }`}
          style={isActive ? { boxShadow: '0 0 12px rgba(255, 255, 255, 0.6)' } : {}}
        />
      </button>
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`text-sm font-terminal transition-all ${
          isActive ? 'text-matrix neon-text-subtle' : 'text-gray-500 hover:text-gray-400'
        }`}
      >
        {rightLabel}
      </button>
    </div>
  )
}

export default Toggle
