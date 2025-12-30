import { ReactNode } from 'react'

interface FooterProps {
  children?: ReactNode
  className?: string
}

function Footer({ children, className = '' }: FooterProps) {
  return (
    <footer className={`mt-16 pt-8 border-t border-terminal-border ${className}`}>
      <div className="flex flex-col gap-4">
        {children}
        <p className="text-sm text-gray-500 text-center">
          Made with ❤️ from Cupertino, CA by{' '}
          <a
            href="https://github.com/aaronhma"
            target="_blank"
            rel="noopener noreferrer"
            className="text-matrix/70 hover:text-matrix hover:neon-text-subtle transition-all"
          >
            Aaron Ma ↗
          </a>
          {' '}and{' '}
          <a
            href="https://github.com/boredcreator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-matrix/70 hover:text-matrix hover:neon-text-subtle transition-all"
          >
            Neel Anshu ↗
          </a>
          .
        </p>
      </div>
    </footer>
  )
}

export default Footer
