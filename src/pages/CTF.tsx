import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Code,
  ChevronDown,
  Discord,
  ChevronRight,
  Shield,
} from "@/lib/cyberIcon";

function CTF() {
  const [loaded, setLoaded] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const faqs = [
    {
      question: "What is a CTF?",
      answer:
        'Capture The Flag (CTF) is a cybersecurity competition where participants solve security challenges to find "flags" - secret strings hidden in vulnerable systems. Our CTF features two tracks: Web Exploitation and OSINT.',
    },
    {
      question: "Do I need experience?",
      answer:
        "No! We welcome all skill levels. Both tracks include challenges designed for beginners, plus mentors will be on-site to help you learn. This is a great entry point into cybersecurity competitions.",
    },
    {
      question: "What should I bring?",
      answer:
        "Bring your laptop, charger, and enthusiasm! We recommend having a virtual machine with Kali Linux or similar security tools installed. We'll also provide setup guides before the event.",
    },
    {
      question: "Can I work in a team?",
      answer:
        "Yes! You can compete solo or in teams of up to 4 people. Teamwork is encouraged, especially for beginners. Find teammates on our Discord!",
    },
    {
      question: "What are the two tracks?",
      answer:
        "Web Exploitation focuses on finding vulnerabilities in web applications, while OSINT (Open Source Intelligence) challenges you to gather information using publicly available data and resources.",
    },
    {
      question: "What are the prizes?",
      answer:
        "Over $500 in prizes! 1st place wins the grand prize, with awards for 2nd and 3rd place teams. There may also be special category awards. Full details announced closer to the event.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10">
        {/* Hero Section */}
        <section
          className={`min-h-[80vh] flex items-center justify-center transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-matrix/20 border border-blue-300 dark:border-matrix/50 text-blue-700 dark:text-matrix text-sm font-terminal mb-4">
                TWO TRACKS: WEB EXPLOITATION & OSINT
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-gray-900 dark:text-white">DACC</span>
              <br />
              <span className="glitch text-blue-600 dark:text-matrix neon-text" data-text="CAPTURE THE FLAG">
                CAPTURE THE FLAG
              </span>
            </h1>

            <p className="text-gray-600 dark:text-gray-400 text-xl md:text-2xl mb-4 max-w-3xl mx-auto">
              A cybersecurity competition for hackers of all skill levels
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-600 dark:text-gray-400 mb-10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-matrix" />
                <span className="font-terminal">TBA 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-matrix" />
                <span className="font-terminal">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-matrix" />
                <span className="font-terminal">De Anza College</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/ctf/challenges"
                className="cli-btn-filled px-8 py-4 text-lg flex items-center gap-3"
              >
                <Code className="w-5 h-5" />
                Start Hacking
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                to="/ctf/team"
                className="cli-btn-dashed px-8 py-4 text-lg flex items-center gap-3"
              >
                <Users className="w-5 h-5" />
                My Team
              </Link>
              <Link
                to="/ctf/leaderboard"
                className="cli-btn-dashed px-8 py-4 text-lg flex items-center gap-3"
              >
                <Trophy className="w-5 h-5" />
                Leaderboard
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          className={`py-20 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="card-hack p-6 text-center group hover:border-blue-400 dark:hover:border-matrix/50 transition-all">
                <Trophy className="w-10 h-10 text-yellow-500 dark:text-matrix mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-yellow-600 dark:text-matrix mb-2">$500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-500 font-terminal">
                  IN PRIZES
                </div>
              </div>
              <div className="card-hack p-6 text-center group hover:border-blue-400 dark:hover:border-matrix/50 transition-all">
                <Users className="w-10 h-10 text-blue-600 dark:text-matrix mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-blue-600 dark:text-matrix mb-2">100+</div>
                <div className="text-sm text-gray-600 dark:text-gray-500 font-terminal">
                  PARTICIPANTS
                </div>
              </div>
              <div className="card-hack p-6 text-center group hover:border-blue-400 dark:hover:border-matrix/50 transition-all">
                <Code className="w-10 h-10 text-purple-600 dark:text-matrix mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-purple-600 dark:text-matrix mb-2">2</div>
                <div className="text-sm text-gray-600 dark:text-gray-500 font-terminal">
                  TRACKS
                </div>
              </div>
              <div className="card-hack p-6 text-center group hover:border-blue-400 dark:hover:border-matrix/50 transition-all">
                <Clock className="w-10 h-10 text-green-600 dark:text-matrix mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-green-600 dark:text-matrix mb-2">6</div>
                <div className="text-sm text-gray-600 dark:text-gray-500 font-terminal">HOURS</div>
              </div>
            </div>
          </div>
        </section>

        {/* Hackathon Format Section */}
        <section
          className={`pb-20 transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-matrix" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-matrix neon-text-subtle">
                About the Hackathon
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-10 max-w-2xl mx-auto">
              Everything you need to know about the DACC CTF Hackathon.
            </p>

            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">
                  hackathon_info.md
                </span>
              </div>
              <div className="terminal-body space-y-6">
                <div>
                  <h3 className="text-blue-600 dark:text-matrix font-bold mb-2">Format</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    This is a jeopardy-style CTF competition held in-person at De Anza College.
                    Participants will solve challenges to earn points, with the team accumulating
                    the most points by the end of the competition winning. More details about
                    the exact format and rules will be announced closer to the event date.
                  </p>
                </div>

                <div>
                  <h3 className="text-blue-600 dark:text-matrix font-bold mb-2">Who Can Participate</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    The hackathon is open to students of all skill levels. Whether you're completely
                    new to cybersecurity or have prior CTF experience, there will be challenges
                    suited for you. Teams can have up to 4 members.
                  </p>
                </div>

                <div>
                  <h3 className="text-blue-600 dark:text-matrix font-bold mb-2">What to Expect</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Expect a full day of hacking, learning, and collaboration. Mentors will be
                    available to provide guidance, and there will be opportunities to network
                    with fellow cybersecurity enthusiasts. Food and refreshments will be provided.
                  </p>
                </div>

                <div>
                  <h3 className="text-blue-600 dark:text-matrix font-bold mb-2">Stay Updated</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Join our Discord server to receive the latest announcements about the event,
                    including the official date, registration details, and any preparation resources
                    we'll share before the hackathon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          className={`py-20 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-blue-600 dark:text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-600 dark:text-gray-400 font-terminal">
                ls ./challenge_tracks/
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-10 max-w-2xl mx-auto">
              Our CTF features two tracks designed for different skill sets and
              interests.
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="terminal-window group hover:scale-[1.02] transition-transform">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">
                    web_exploitation
                  </span>
                </div>
                <div className="terminal-body">
                  <h3 className="text-blue-600 dark:text-matrix font-bold mb-2 group-hover:text-blue-700 dark:group-hover:neon-text-subtle transition-all">
                    Web Exploitation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-500 text-sm">
                    Find vulnerabilities in web applications through SQL
                    injection, XSS, SSRF, and more.
                  </p>
                </div>
              </div>

              <div className="terminal-window group hover:scale-[1.02] transition-transform">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 dark:text-gray-500 font-terminal">
                    osint
                  </span>
                </div>
                <div className="terminal-body">
                  <h3 className="text-blue-600 dark:text-matrix font-bold mb-2 group-hover:text-blue-700 dark:group-hover:neon-text-subtle transition-all">
                    OSINT
                  </h3>
                  <p className="text-gray-600 dark:text-gray-500 text-sm">
                    Open Source Intelligence gathering - find hidden information
                    using publicly available data and resources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          className={`py-20 transition-all duration-700 delay-400 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-3 mb-12">
              <span className="text-blue-600 dark:text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-600 dark:text-gray-400 font-terminal">
                cat /ctf/faq.md
              </span>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="card-hack overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 dark:hover:bg-matrix/5 transition-colors"
                  >
                    <span className="text-gray-900 dark:text-matrix font-semibold pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-blue-600 dark:text-matrix shrink-0 transition-transform duration-200 ${
                        openFAQ === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      openFAQ === index ? "max-h-40" : "max-h-0"
                    }`}
                  >
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className={`py-20 transition-all duration-700 delay-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">
                  register.sh
                </span>
              </div>
              <div className="terminal-body text-center py-12">
                <Trophy className="w-16 h-16 text-yellow-500 dark:text-matrix mx-auto mb-6 opacity-80" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-matrix mb-4 neon-text-subtle">
                  Ready to Compete?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                  Test your skills with two tracks: Web Exploitation and OSINT.
                  Challenges for all skill levels!
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    to="/ctf/challenges"
                    className="cli-btn-filled px-8 py-4 flex items-center gap-3"
                  >
                    <Code className="w-5 h-5" />
                    View All Challenges
                  </Link>
                  <a
                    href="https://discord.gg/v5JWDrZVNp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cli-btn-dashed px-8 py-4 flex items-center gap-3"
                  >
                    <Discord className="w-5 h-5" />
                    Join Discord
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CTF;
