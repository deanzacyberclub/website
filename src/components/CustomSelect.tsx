import { useState, useRef, useEffect } from 'react'
import { ChevronRight } from '@/lib/cyberIcon'

interface Option {
  value: string
  label: string
  badge?: {
    text: string
    color: string
  }
  metadata?: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

function CustomSelect({ options, value, onChange, placeholder = 'Select an option...', disabled = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full text-left px-4 py-3 rounded-lg
          bg-terminal-alt/30 backdrop-blur-md
          border border-matrix/20
          hover:border-matrix/40 hover:bg-terminal-alt/40
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-matrix/60 bg-terminal-alt/50 shadow-lg shadow-matrix/10' : ''}
        `}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {selectedOption ? (
              <div>
                {selectedOption.badge && (
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border mb-1 ${selectedOption.badge.color}`}>
                    {selectedOption.badge.text}
                  </span>
                )}
                <p className="text-matrix font-medium truncate">{selectedOption.label}</p>
                {selectedOption.metadata && (
                  <p className="text-xs text-gray-500 font-terminal mt-0.5">{selectedOption.metadata}</p>
                )}
              </div>
            ) : (
              <span className="text-gray-500 font-terminal">{placeholder}</span>
            )}
          </div>
          <ChevronRight
            className={`w-4 h-4 text-matrix transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-2 rounded-lg border border-matrix/30 bg-terminal-bg/95 backdrop-blur-lg shadow-2xl shadow-matrix/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-matrix/30 scrollbar-track-transparent">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full text-left px-4 py-3
                  transition-all duration-150
                  border-l-2
                  ${value === option.value
                    ? 'bg-matrix/10 border-l-matrix text-matrix'
                    : 'border-l-transparent hover:bg-terminal-alt/50 hover:border-l-matrix/50 text-gray-300'
                  }
                `}
              >
                <div>
                  {option.badge && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border mb-1 ${option.badge.color}`}>
                      {option.badge.text}
                    </span>
                  )}
                  <p className="font-medium truncate">{option.label}</p>
                  {option.metadata && (
                    <p className="text-xs text-gray-500 font-terminal mt-0.5">{option.metadata}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomSelect
