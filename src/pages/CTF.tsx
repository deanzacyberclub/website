import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Trophy, Users, Code, ChevronDown } from '@/lib/cyberIcon'

function CTF() {
  const [loaded, setLoaded] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  useEffect(() => {
    setLoaded(true)
  }, [])

  const schedule = [
    { time: '9:00 AM', event: 'Registration & Check-in', description: 'Grab your badge and meet the team' },
    { time: '10:00 AM', event: 'Opening Ceremony', description: 'Welcome and CTF overview' },
    { time: '10:30 AM', event: 'CTF Begins', description: 'Start hacking!' },
    { time: '12:30 PM', event: 'Lunch Break', description: 'Fuel up for more challenges' },
    { time: '1:30 PM', event: 'Resume Competition', description: 'Continue solving challenges' },
    { time: '4:00 PM', event: 'CTF Ends', description: 'Final submissions' },
    { time: '4:30 PM', event: 'Awards Ceremony', description: 'Winner announcements and prizes' },
  ]

  const faqs = [
    {
      question: 'What is a CTF?',
      answer: 'Capture The Flag (CTF) is a cybersecurity competition where participants solve security challenges to find "flags" - secret strings hidden in vulnerable systems. Categories include web exploitation, cryptography, reverse engineering, forensics, and more.',
    },
    {
      question: 'Do I need experience?',
      answer: 'No! We welcome all skill levels. We\'ll have challenges ranging from beginner to advanced, and mentors will be available to help you learn.',
    },
    {
      question: 'What should I bring?',
      answer: 'Bring your laptop, charger, and enthusiasm! We recommend having a virtual machine with Kali Linux or similar security tools installed.',
    },
    {
      question: 'Can I work in a team?',
      answer: 'Yes! You can compete solo or in teams of up to 4 people. Teamwork is encouraged for beginners.',
    },
    {
      question: 'What are the prizes?',
      answer: 'Top teams will win tech gadgets, swag, and bragging rights! Full prize details will be announced soon.',
    },
  ]

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className={`min-h-[80vh] flex items-center justify-center transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 rounded-full bg-matrix/20 border border-matrix/50 text-matrix text-sm font-terminal mb-4">
                COMING SOON
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white">DACC</span>
              <br />
              <span className="glitch neon-text" data-text="CAPTURE THE FLAG">
                CAPTURE THE FLAG
              </span>
            </h1>

            <p className="text-gray-400 text-xl md:text-2xl mb-4 max-w-3xl mx-auto">
              A cybersecurity competition for hackers of all skill levels
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 mb-10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-matrix" />
                <span className="font-terminal">TBA 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-matrix" />
                <span className="font-terminal">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-matrix" />
                <span className="font-terminal">De Anza College</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button className="btn-hack-filled rounded-lg px-8 py-4 text-lg">
                Register Now (Soon)
              </button>
              <Link to="/dashboard" className="btn-hack rounded-lg px-8 py-4 text-lg">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`py-20 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="card-hack rounded-lg p-6 text-center">
                <Trophy className="w-10 h-10 text-matrix mx-auto mb-3" />
                <div className="text-3xl font-bold text-matrix mb-2">$500+</div>
                <div className="text-sm text-gray-500 font-terminal">IN PRIZES</div>
              </div>
              <div className="card-hack rounded-lg p-6 text-center">
                <Users className="w-10 h-10 text-matrix mx-auto mb-3" />
                <div className="text-3xl font-bold text-matrix mb-2">100+</div>
                <div className="text-sm text-gray-500 font-terminal">PARTICIPANTS</div>
              </div>
              <div className="card-hack rounded-lg p-6 text-center">
                <Code className="w-10 h-10 text-matrix mx-auto mb-3" />
                <div className="text-3xl font-bold text-matrix mb-2">30+</div>
                <div className="text-sm text-gray-500 font-terminal">CHALLENGES</div>
              </div>
              <div className="card-hack rounded-lg p-6 text-center">
                <Clock className="w-10 h-10 text-matrix mx-auto mb-3" />
                <div className="text-3xl font-bold text-matrix mb-2">6</div>
                <div className="text-sm text-gray-500 font-terminal">HOURS</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className={`py-20 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              <span className="text-matrix neon-text-subtle">What is CTF?</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">web_exploitation</span>
                </div>
                <div className="terminal-body">
                  <h3 className="text-matrix font-bold mb-2">Web Exploitation</h3>
                  <p className="text-gray-500 text-sm">
                    Find vulnerabilities in web applications through SQL injection, XSS, and more.
                  </p>
                </div>
              </div>

              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">cryptography</span>
                </div>
                <div className="terminal-body">
                  <h3 className="text-matrix font-bold mb-2">Cryptography</h3>
                  <p className="text-gray-500 text-sm">
                    Break ciphers, decrypt messages, and crack cryptographic challenges.
                  </p>
                </div>
              </div>

              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">reverse_engineering</span>
                </div>
                <div className="terminal-body">
                  <h3 className="text-matrix font-bold mb-2">Reverse Engineering</h3>
                  <p className="text-gray-500 text-sm">
                    Analyze binaries, decompile programs, and understand how software works.
                  </p>
                </div>
              </div>

              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">forensics</span>
                </div>
                <div className="terminal-body">
                  <h3 className="text-matrix font-bold mb-2">Forensics</h3>
                  <p className="text-gray-500 text-sm">
                    Investigate digital artifacts, recover hidden data, and analyze file systems.
                  </p>
                </div>
              </div>

              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">pwn</span>
                </div>
                <div className="terminal-body">
                  <h3 className="text-matrix font-bold mb-2">Binary Exploitation</h3>
                  <p className="text-gray-500 text-sm">
                    Exploit memory corruption vulnerabilities in compiled programs.
                  </p>
                </div>
              </div>

              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">misc</span>
                </div>
                <div className="terminal-body">
                  <h3 className="text-matrix font-bold mb-2">Miscellaneous</h3>
                  <p className="text-gray-500 text-sm">
                    Solve puzzles, OSINT challenges, and other creative security problems.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        <section className={`py-20 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              <span className="text-matrix neon-text-subtle">Schedule</span>
            </h2>

            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">event_timeline.sh</span>
              </div>
              <div className="terminal-body">
                <div className="space-y-6">
                  {schedule.map((item, index) => (
                    <div key={index} className="flex gap-6 items-start">
                      <div className="shrink-0 w-24 text-right">
                        <span className="text-matrix font-terminal text-sm">{item.time}</span>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-3 h-3 rounded-full bg-matrix shadow-neon" />
                        {index < schedule.length - 1 && (
                          <div className="h-full min-h-[60px] border-l-2 border-dotted border-gray-700" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <h3 className="text-white font-semibold mb-1">{item.event}</h3>
                        <p className="text-gray-500 text-sm">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={`py-20 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              <span className="text-matrix neon-text-subtle">FAQ</span>
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="card-hack rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-matrix/5 transition-colors"
                  >
                    <span className="text-matrix font-semibold">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-matrix transition-transform ${
                        openFAQ === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-20 transition-all duration-700 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">register.sh</span>
              </div>
              <div className="terminal-body text-center py-12">
                <h2 className="text-3xl font-bold text-matrix mb-4 neon-text-subtle">
                  Ready to Compete?
                </h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  Registration opens soon. Join our Discord to get notified when registration is live!
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <a
                    href="https://discord.gg/AmjfRrJd5j"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-hack-filled rounded-lg px-8 py-4"
                  >
                    Join Discord for Updates
                  </a>
                  <Link to="/meetings" className="btn-hack rounded-lg px-8 py-4">
                    View All Events
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CTF
