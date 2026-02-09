import { ReactNode } from 'react'
import { Spinner, Warning } from '@/lib/cyberIcon'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  error?: string
  variant?: 'danger' | 'warning'
  icon?: ReactNode
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  loading = false,
  error,
  variant = 'danger',
  icon
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-50 dark:bg-hack-red/20 border-red-300 dark:border-hack-red/50',
      iconColor: 'text-red-600 dark:text-hack-red',
      buttonBg: 'bg-red-100 dark:bg-hack-red/20 border-red-300 dark:border-hack-red/50 text-red-700 dark:text-hack-red hover:bg-red-200 dark:hover:bg-hack-red/30',
      titleColor: 'text-red-700 dark:text-hack-red',
      headerColor: 'text-red-600 dark:text-hack-red'
    },
    warning: {
      iconBg: 'bg-yellow-50 dark:bg-hack-yellow/20 border-yellow-300 dark:border-hack-yellow/50',
      iconColor: 'text-yellow-600 dark:text-hack-yellow',
      buttonBg: 'bg-yellow-100 dark:bg-hack-yellow/20 border-yellow-300 dark:border-hack-yellow/50 text-yellow-700 dark:text-hack-yellow hover:bg-yellow-200 dark:hover:bg-hack-yellow/30',
      titleColor: 'text-yellow-700 dark:text-hack-yellow',
      headerColor: 'text-yellow-600 dark:text-hack-yellow'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative terminal-window max-w-md w-full">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className={`ml-4 text-xs font-terminal ${styles.headerColor}`}>confirm.sh</span>
        </div>
        <div className="terminal-body">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 border flex items-center justify-center ${styles.iconBg}`}>
              {icon || <Warning className={`w-8 h-8 ${styles.iconColor}`} />}
            </div>
            <h3 className={`font-bold text-lg mb-2 ${styles.titleColor}`}>{title}</h3>
            <p className="text-gray-600 dark:text-gray-500 text-sm">{message}</p>
          </div>

          {error && (
            <div className="text-red-600 dark:text-hack-red text-sm font-terminal mb-4 text-center">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="cli-btn-dashed flex-1 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 border transition-colors font-terminal text-sm disabled:opacity-50 disabled:cursor-not-allowed ${styles.buttonBg}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="animate-spin h-4 w-4" />
                  PROCESSING...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
