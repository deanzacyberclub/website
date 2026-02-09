import { useState } from "react";
import { Tabs } from "@/components/Tabs";

function Legal() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  return (
    <div className="bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix min-h-screen">
      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-900 dark:text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-600 dark:text-gray-400 font-terminal">
              cat /etc/
              {activeTab === "terms" ? "terms-of-service" : "privacy-policy"}
              .txt
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-matrix neon-text mb-2">
                {activeTab === "terms" ? "Terms of Service" : "Privacy Policy"}
              </h1>
              <p className="text-gray-600 dark:text-gray-500 text-sm">
                Last updated: January 2026
              </p>
            </div>

            <Tabs
              tabs={[
                { id: "terms", label: "Terms" },
                { id: "privacy", label: "Privacy" },
              ]}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as "terms" | "privacy")}
            />
          </div>
        </header>

        {/* Content */}
        <div className="terminal-window mb-12">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">
              {activeTab === "terms" ? "terms_of_service" : "privacy_policy"}
            </span>
          </div>
          <div className="terminal-body space-y-6">
            {activeTab === "terms" ? <TermsContent /> : <PrivacyContent />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          1. Acceptance of Terms
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          By accessing and using the De Anza Cybersecurity Club (DACC) website,
          you agree to be bound by these Terms of Service. If you do not agree
          to these terms, please do not use our website.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          2. Prohibited Activities
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
          You agree NOT to engage in any of the following prohibited activities:
        </p>
        <ul className="text-gray-600 dark:text-gray-400 space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-hack-red">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">Spamming:</strong> Sending
              unsolicited messages, repeatedly submitting forms, or flooding our
              systems with automated requests.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-red">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">Illegal Activities:</strong> Using
              this website for any unlawful purpose, including but not limited
              to hacking, unauthorized access attempts, or distributing
              malicious software.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-red">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">Abuse:</strong> Harassing,
              threatening, or intimidating other users or club members through
              our communication channels.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-red">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">Misrepresentation:</strong>{" "}
              Impersonating club officers, De Anza College staff, or other
              individuals.
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          3. User Conduct
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          By accessing and using this website, you agree to conduct yourself in
          a respectful and professional manner. We reserve the right to remove
          any content that violates these terms or is deemed inappropriate.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          4. Disclaimer
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          This website is provided "as is" without warranties of any kind. DACC
          is a student-led organization and is not responsible for any damages
          arising from the use of this website.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          5. Changes to Terms
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          We reserve the right to modify these terms at any time. Continued use
          of the website after changes constitutes acceptance of the new terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">6. Contact</h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          If you have questions about these Terms of Service, please reach out
          through our{" "}
          <a
            href="https://discord.gg/v5JWDrZVNp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 dark:text-matrix hover:text-blue-600 dark:hover:neon-text-subtle transition-all"
          >
            Discord server
          </a>
          .
        </p>
      </section>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          1. Information We Collect
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
          The De Anza Cybersecurity Club (DACC) collects the following types of
          information:
        </p>
        <ul className="text-gray-600 dark:text-gray-400 space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">Account Information:</strong> When
              you create a member account, we collect your full name, student
              ID, profile picture (optional), and email address from your
              authentication provider.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">Linked Social Accounts:</strong>{" "}
              When you sign in or link accounts via GitHub, Discord, or
              LinkedIn, we receive and store your username, email, and profile
              picture from these services to facilitate authentication and
              display your profile.
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          2. How We Use Your Information
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
          Your information is used strictly for{" "}
          <strong className="text-gray-900 dark:text-matrix">club administration purposes</strong>,
          including:
        </p>
        <ul className="text-gray-600 dark:text-gray-400 space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>
              Authenticating your identity and managing your member account
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>
              Allowing you to sign in with multiple social accounts (GitHub,
              Discord, LinkedIn)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>Tracking meeting attendance and member participation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>
              Maintaining records for De Anza College club requirements
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          3. Third-Party Authentication
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
          We use OAuth authentication through the following providers:
        </p>
        <ul className="text-gray-600 dark:text-gray-400 space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">GitHub</strong> - We receive your
              username, email, and avatar
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">Discord</strong> - We receive your
              username, email, and avatar
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-hack-cyan">-</span>
            <span>
              <strong className="text-gray-900 dark:text-matrix">LinkedIn</strong> - We receive
              your name, email, and profile picture
            </span>
          </li>
        </ul>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
          We do not access your posts, connections, or any other data beyond
          what is listed above. You can unlink any connected account at any time
          from your settings page.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">4. Analytics</h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          No analytics are collected.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          5. Data Sharing
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          We do not sell, trade, or otherwise transfer your personal information
          to outside parties. Information may be shared with De Anza College
          administration solely for the purpose of club recognition and official
          club business.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          6. Data Security
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          We implement reasonable security measures to protect your information.
          Your data is stored securely using Supabase, with authentication
          handled through industry-standard OAuth protocols. However, no method
          of transmission over the internet is 100% secure, and we cannot
          guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          7. Your Rights
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          You have the right to access, update, or delete your personal
          information. You can manage your profile and linked accounts directly
          from your settings page. You may also delete your account at any time,
          which will permanently remove all your data from our systems. For
          additional requests, contact us through our Discord server.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">
          8. Changes to This Policy
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page with an updated revision date.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-matrix mb-3">9. Contact</h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          If you have questions about this Privacy Policy, please reach out
          through our{" "}
          <a
            href="https://discord.gg/v5JWDrZVNp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 dark:text-matrix hover:text-blue-600 dark:hover:neon-text-subtle transition-all"
          >
            Discord server
          </a>
          .
        </p>
      </section>
    </>
  );
}

export default Legal;
