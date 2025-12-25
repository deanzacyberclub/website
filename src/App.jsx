import { useState, useEffect } from 'react'

function App() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/20 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 py-16 md:py-24">
        <header className={`mb-16 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-4 mb-8">
            <img
              src="/logo.png"
              alt="DACC Logo"
              className="w-14 h-14 rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">DACC</h1>
              <p className="text-zinc-500 text-sm font-mono">De Anza Cybersecurity Club</p>
            </div>
          </div>

          <div className="font-mono text-sm text-zinc-500 mb-6">
            <span className="text-emerald-400">$</span> cat welcome.txt
          </div>

          <p className="text-lg text-zinc-300 leading-relaxed">
            A student-led community for learning cybersecurity fundamentals,
            earning certifications, and getting hands-on with industry tools.
          </p>
        </header>

        <section className={`mb-16 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="font-mono text-sm text-zinc-500 mb-4">
            <span className="text-emerald-400">$</span> ls ./goals/
          </div>

          <div className="space-y-4">
            <div className="group p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
              <h3 className="font-medium mb-1">Security Foundations</h3>
              <p className="text-sm text-zinc-500">Core cybersecurity concepts applicable across all programming disciplines</p>
            </div>

            <div className="group p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
              <h3 className="font-medium mb-1">Security+ Certification</h3>
              <p className="text-sm text-zinc-500">Structured curriculum to help members achieve CompTIA Security+ certification</p>
            </div>

            <div className="group p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
              <h3 className="font-medium mb-1">Hands-On Tools</h3>
              <p className="text-sm text-zinc-500">Practical experience with Burp Suite, Nmap, Wireshark, and more</p>
            </div>
          </div>
        </section>

        <section className={`mb-16 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="font-mono text-sm text-zinc-500 mb-4">
            <span className="text-emerald-400">$</span> echo $BENEFITS
          </div>

          <div className="flex flex-wrap gap-2">
            {['Leadership Experience', 'Industry Skills', 'Student Community'].map((item) => (
              <span
                key={item}
                className="px-3 py-1.5 text-sm rounded-full border border-zinc-800 text-zinc-400"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className={`mb-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="font-mono text-sm text-zinc-500 mb-4">
            <span className="text-emerald-400">$</span> ./join.sh
          </div>

          <p className="text-zinc-400 mb-6">
            No prior experience required. Just bring curiosity and willingness to learn.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://discord.gg/AmjfRrJd5j"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>

            <a
              href="https://docs.google.com/document/d/1-wV6SDBT-5YoyfhNu-sBbnQondH0kmZM/edit?usp=sharing&ouid=111115151815479546677&rtpof=true&sd=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-300 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Constitution
            </a>
          </div>
        </section>

        <footer className={`pt-8 border-t border-zinc-800 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-sm text-zinc-600 font-mono">
            <span className="text-emerald-400">$</span> De Anza College <span className="cursor-blink"></span>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
