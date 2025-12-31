import { Link } from 'react-router-dom'
import Footer from './components/Footer'

function Privacy() {
  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <header className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-matrix transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">cat /etc/privacy-policy.txt</span>
          </div>

          <h1 className="text-3xl font-bold text-matrix neon-text mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: December 2025</p>
        </header>

        {/* Content */}
        <div className="terminal-window mb-12">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">privacy_policy</span>
          </div>
          <div className="terminal-body space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">1. Information We Collect</h2>
              <p className="text-gray-400 leading-relaxed mb-3">
                The De Anza Cybersecurity Club (DACC) collects the following types of information:
              </p>
              <ul className="text-gray-400 space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-hack-cyan">-</span>
                  <span><strong className="text-matrix">Petition Information:</strong> Name, signature, and optional comments when you sign our club petition.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-hack-cyan">-</span>
                  <span><strong className="text-matrix">Chat Messages:</strong> Messages sent through our live chat feature, along with the display name you choose.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-hack-cyan">-</span>
                  <span><strong className="text-matrix">Analytics Data:</strong> We collect anonymized analytics data including browser type, device information, screen resolution, timezone, and general usage patterns to improve our website.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-400 leading-relaxed mb-3">
                Your information is used strictly for <strong className="text-matrix">club administration purposes</strong>, including:
              </p>
              <ul className="text-gray-400 space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-hack-cyan">-</span>
                  <span>Processing petition signatures to establish DACC as an official De Anza club</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-hack-cyan">-</span>
                  <span>Facilitating communication between potential members and club officers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-hack-cyan">-</span>
                  <span>Analyzing website usage to improve user experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-hack-cyan">-</span>
                  <span>Maintaining records for De Anza College club requirements</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">3. Analytics</h2>
              <p className="text-gray-400 leading-relaxed">
                We collect analytics data to understand how visitors interact with our website. This includes technical information such as your browser type, operating system, screen resolution, referral source, and pages visited. This data helps us improve the website experience and is not used to personally identify individual users.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">4. Data Sharing</h2>
              <p className="text-gray-400 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to outside parties. Information may be shared with De Anza College administration solely for the purpose of club recognition and official club business.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">5. Data Security</h2>
              <p className="text-gray-400 leading-relaxed">
                We implement reasonable security measures to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">6. Your Rights</h2>
              <p className="text-gray-400 leading-relaxed">
                You may request to view, update, or delete your personal information by contacting us through our Discord server. We will respond to such requests within a reasonable timeframe.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">7. Changes to This Policy</h2>
              <p className="text-gray-400 leading-relaxed">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">8. Contact</h2>
              <p className="text-gray-400 leading-relaxed">
                If you have questions about this Privacy Policy, please reach out through our{' '}
                <a
                  href="https://discord.gg/AmjfRrJd5j"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-matrix hover:neon-text-subtle transition-all"
                >
                  Discord server
                </a>
                .
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <Footer className="mt-0 border-matrix/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-600 font-terminal">
              <span className="text-matrix neon-text-subtle">$</span> ping{' '}
              <a
                href="https://www.deanza.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-matrix/70 hover:text-matrix hover:neon-text-subtle transition-all"
              >
                https://deanza.edu
              </a>
            </p>
            <div className="text-xs text-gray-700 font-terminal">
              <span className="text-matrix/50">[</span>
              SYSTEM ACTIVE
              <span className="text-matrix/50">]</span>
            </div>
          </div>
        </Footer>
      </div>
    </div>
  )
}

export default Privacy
