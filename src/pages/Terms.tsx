function Terms() {
  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="relative max-w-4xl mx-auto px-6">

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">cat /etc/terms-of-service.txt</span>
          </div>

          <h1 className="text-3xl font-bold text-matrix neon-text mb-2">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: January 2026</p>
        </header>

        {/* Content */}
        <div className="terminal-window mb-12">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">terms_of_service</span>
          </div>
          <div className="terminal-body space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-400 leading-relaxed">
                By accessing and using the De Anza Cybersecurity Club (DACC) website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">2. Prohibited Activities</h2>
              <p className="text-gray-400 leading-relaxed mb-3">
                You agree NOT to engage in any of the following prohibited activities:
              </p>
              <ul className="text-gray-400 space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-hack-red">-</span>
                  <span><strong className="text-matrix">Spamming:</strong> Sending unsolicited messages, repeatedly submitting forms, or flooding our systems with automated requests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-hack-red">-</span>
                  <span><strong className="text-matrix">Illegal Activities:</strong> Using this website for any unlawful purpose, including but not limited to hacking, unauthorized access attempts, or distributing malicious software.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-hack-red">-</span>
                  <span><strong className="text-matrix">Abuse:</strong> Harassing, threatening, or intimidating other users or club members through our communication channels.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-hack-red">-</span>
                  <span><strong className="text-matrix">Misrepresentation:</strong> Impersonating club officers, De Anza College staff, or other individuals.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">3. User Conduct</h2>
              <p className="text-gray-400 leading-relaxed">
                By accessing and using this website, you agree to conduct yourself in a respectful and professional manner. We reserve the right to remove any content that violates these terms or is deemed inappropriate.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">4. Disclaimer</h2>
              <p className="text-gray-400 leading-relaxed">
                This website is provided "as is" without warranties of any kind. DACC is a student-led organization and is not responsible for any damages arising from the use of this website.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">5. Changes to Terms</h2>
              <p className="text-gray-400 leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-matrix mb-3">6. Contact</h2>
              <p className="text-gray-400 leading-relaxed">
                If you have questions about these Terms of Service, please reach out through our{' '}
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

      </div>
    </div>
  )
}

export default Terms
