import { X, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Hardcoded pathway info for certificate
const PATHWAY_INFO = {
  slug: 'security-plus',
  title: 'Security+ Certification',
  description: 'Comprehensive preparation for CompTIA Security+ certification covering network security, compliance, threats, and cryptography.',
  icon: '🛡️',
  estimated_hours: 40
}

interface CertificateModalProps {
  pathwayTitle: string
  lessonsCount: number
  onClose: () => void
}

function CertificateModal({ pathwayTitle, lessonsCount, onClose }: CertificateModalProps) {
  const { userProfile } = useAuth()

  const handleDownload = () => {
    // Trigger print dialog
    window.print()
  }

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded transition-colors z-10"
        aria-label="Close certificate"
      >
        <X className="w-6 h-6 text-gray-400 hover:text-matrix" />
      </button>

      {/* Certificate */}
      <div className="relative max-w-4xl w-full">
        <div className="bg-terminal-bg border-4 border-matrix rounded-lg p-8 md:p-12 certificate-print">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-matrix/50 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-matrix/50 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-matrix/50 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-matrix/50 rounded-br-lg" />

          {/* Content */}
          <div className="text-center space-y-6">
            {/* Header */}
            <div className="mb-8">
              <div className="text-xs text-gray-500 font-terminal mb-2">DE ANZA CYBERSECURITY CLUB</div>
              <h1 className="text-4xl md:text-5xl font-bold text-matrix neon-text mb-2">
                CERTIFICATE
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold text-hack-cyan">
                OF ACCOMPLISHMENT
              </h2>
            </div>

            {/* Pathway icon */}
            <div className="text-6xl mb-4">{PATHWAY_INFO.icon}</div>

            {/* Body */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-gray-400 font-terminal text-sm">This certifies that</p>

              <div className="py-4">
                <p className="text-3xl md:text-4xl font-bold text-matrix neon-text-subtle">
                  {userProfile?.display_name || 'Student'}
                </p>
                <div className="h-0.5 bg-matrix/30 w-64 mx-auto mt-2" />
              </div>

              <p className="text-gray-400 font-terminal text-sm">
                has engaged with the
              </p>

              <div className="py-3">
                <p className="text-2xl md:text-3xl font-bold text-hack-cyan">
                  {pathwayTitle}
                </p>
                <p className="text-sm text-gray-500 font-terminal mt-2">
                  {PATHWAY_INFO.description}
                </p>
              </div>

              <p className="text-gray-400 font-terminal text-sm">
                studying cybersecurity fundamentals
                <br />
                and practical skills through {lessonsCount} lessons
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-8 mb-6">
              <div className="p-3 bg-terminal-alt rounded border border-matrix/30">
                <div className="text-2xl font-bold text-matrix">{lessonsCount}</div>
                <div className="text-xs text-gray-500 font-terminal">Lessons</div>
              </div>
              <div className="p-3 bg-terminal-alt rounded border border-matrix/30">
                <div className="text-2xl font-bold text-matrix">{PATHWAY_INFO.estimated_hours}h</div>
                <div className="text-xs text-gray-500 font-terminal">Est. Study Time</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between max-w-xl mx-auto">
                <div className="text-left">
                  <p className="text-gray-500 text-xs font-terminal mb-1">Date</p>
                  <p className="text-matrix font-terminal text-sm">{today}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs font-terminal mb-1">Certificate ID</p>
                  <p className="text-matrix font-terminal text-sm font-mono">
                    {PATHWAY_INFO.slug.toUpperCase()}-{userProfile?.student_id?.slice(-4) || '0000'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download button */}
        <div className="flex justify-center mt-6 print:hidden">
          <button
            onClick={handleDownload}
            className="btn-hack-filled px-6 py-3 text-sm font-terminal flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Certificate
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }

          body * {
            visibility: hidden;
          }

          .certificate-print, .certificate-print * {
            visibility: visible;
          }

          .certificate-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            padding: 1rem !important;
            margin: 0 !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }

          /* Reduce spacing for print */
          .certificate-print .space-y-6 {
            gap: 0.75rem !important;
          }

          .certificate-print h1 {
            font-size: 2.5rem !important;
            margin-bottom: 0.25rem !important;
          }

          .certificate-print h2 {
            font-size: 1.75rem !important;
          }

          .certificate-print .text-6xl {
            font-size: 3rem !important;
            margin-bottom: 0.5rem !important;
          }

          .certificate-print .text-4xl {
            font-size: 2rem !important;
          }

          .certificate-print .text-3xl {
            font-size: 1.5rem !important;
          }

          .certificate-print .text-2xl {
            font-size: 1.25rem !important;
          }

          .certificate-print .py-4 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }

          .certificate-print .py-3 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }

          .certificate-print .mt-8 {
            margin-top: 1rem !important;
          }

          .certificate-print .mb-8 {
            margin-bottom: 1rem !important;
          }

          .certificate-print .mt-6 {
            margin-top: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default CertificateModal
