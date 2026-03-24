import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Shield,
  Flag,
  Code,
  Trophy,
  MapPin,
  Clock,
  Calendar,
  Discord,
  ChevronRight,
} from "@/lib/cyberIcon";
import { OFFICERS } from "@/constants";
import Monogram from "@/components/Monogram";

// ─── Section definitions ───────────────────────────────
const SECTIONS = [
  {
    id: "hacking-fundamentals",
    icon: Shield,
    title: "HACKING FUNDAMENTALS",
    file: "hacking_fundamentals.sh",
    tagline: "Think like an attacker. Defend like a pro.",
    intro:
      "We follow the same methodology professional penetration testers use on real engagements — from the first probe of a system to a full compromise and report.",
    topics: [
      {
        label: "Reconnaissance",
        body: "Passive and active recon: OSINT gathering, DNS enumeration, Shodan, theHarvester, and building a target profile before a single packet is sent.",
      },
      {
        label: "Scanning & Enumeration",
        body: "Service discovery with Nmap, version detection, OS fingerprinting, and extracting useful data from open ports — HTTP headers, SMB shares, SNMP community strings.",
      },
      {
        label: "Exploitation",
        body: "Turning findings into access — web vulnerabilities (XSS, SQL injection, IDOR, SSRF, path traversal), network attacks, and using frameworks like Metasploit responsibly.",
      },
      {
        label: "Post-Exploitation",
        body: "Privilege escalation on Linux and Windows, credential dumping, lateral movement, persistence mechanisms, and covering tracks.",
      },
      {
        label: "Web Application Security",
        body: "OWASP Top 10 in depth with live targets: broken authentication, security misconfigurations, insecure deserialization, and hands-on Burp Suite labs.",
      },
      {
        label: "Report Writing",
        body: "Findings mean nothing without communication. We practice writing professional vulnerability reports with risk ratings, PoC steps, and remediation recommendations.",
      },
    ],
    note: "No prior hacking experience needed. Sessions start from zero and scale up.",
  },
  {
    id: "get-certified",
    icon: Flag,
    title: "GET CERTIFIED",
    file: "get_certified.sh",
    tagline: "Credentials that open doors.",
    intro:
      "Industry certifications are one of the fastest ways to land a cybersecurity job or internship. We run structured study groups so you're not grinding alone.",
    topics: [
      {
        label: "CompTIA Security+",
        body: "The most widely recognized entry-level security cert. Covers threats, attacks, cryptography, identity management, risk management, and compliance. Often required for DoD positions.",
      },
      {
        label: "CompTIA Network+",
        body: "Networking fundamentals that underpin everything in security — TCP/IP, routing, switching, wireless, firewalls, and network troubleshooting. Great first cert if you're brand new.",
      },
      {
        label: "CompTIA A+",
        body: "Hardware, OS, and help-desk fundamentals. A solid foundation cert if you're starting from scratch or want to work in IT support before pivoting to security.",
      },
      {
        label: "How Our Study Groups Work",
        body: "Weekly sessions covering one exam domain at a time. We use practice exams, Anki decks, and group problem-solving. Members who've passed help those who are preparing.",
      },
      {
        label: "Beyond CompTIA",
        body: "Once you have Security+, we point you toward CEH, OSCP, eJPT, or cloud security certs (AWS/Azure security specialties) depending on your career goal.",
      },
    ],
    note: "Club members get access to shared study resources, practice exam banks, and peer tutoring.",
  },
  {
    id: "real-tools",
    icon: Code,
    title: "REAL TOOLS",
    file: "real_tools.sh",
    tagline: "The exact toolkit used by professionals.",
    intro:
      "We don't teach theory in a vacuum. Every tool gets hands-on lab time on legal targets so you build real muscle memory, not just familiarity.",
    topics: [
      {
        label: "Burp Suite",
        body: "The industry-standard web application proxy. We cover intercepting requests, modifying parameters, running the scanner, writing custom Intruder payloads, and building extensions.",
      },
      {
        label: "Nmap",
        body: "Network mapper for discovery and enumeration. Host discovery, port scanning, service/version detection, OS detection, and NSE scripting for automation.",
      },
      {
        label: "Wireshark",
        body: "Packet analysis for network forensics and protocol understanding. Capture filters, display filters, following TCP streams, and hunting for credentials in cleartext protocols.",
      },
      {
        label: "Metasploit Framework",
        body: "The exploitation framework. Searching for modules, setting payloads, running exploits against intentionally vulnerable VMs, and using Meterpreter for post-exploitation.",
      },
      {
        label: "John the Ripper & Hashcat",
        body: "Password cracking — identifying hash types, dictionary attacks, rule-based attacks, and mask attacks. Includes cracking hashes from CTF challenges.",
      },
      {
        label: "Gobuster / ffuf",
        body: "Directory and DNS brute-forcing for web recon. Finding hidden endpoints, virtual hosts, and backup files that developers forgot to clean up.",
      },
      {
        label: "SQLMap",
        body: "Automated SQL injection detection and exploitation. We use it to understand what attackers can extract — and why parameterized queries matter.",
      },
      {
        label: "Ghidra",
        body: "NSA's open-source reverse engineering suite. Disassembling and decompiling binaries, understanding assembly, and solving CTF reverse-engineering challenges.",
      },
    ],
    note: "All labs run against legal targets — HackTheBox, TryHackMe, DVWA, and our own internal vulnerable VMs.",
  },
  {
    id: "ctf-competitions",
    icon: Trophy,
    title: "CTF COMPETITIONS",
    file: "ctf_competitions.sh",
    tagline: "Compete. Solve. Win.",
    intro:
      "Capture The Flag competitions are the best way to sharpen your skills under pressure. We compete as a club in online events year-round and host our own full-day event each spring.",
    topics: [
      {
        label: "Challenge Categories",
        body: "Web exploitation, cryptography, binary exploitation (pwn), digital forensics, OSINT, reverse engineering, and miscellaneous. We cover each category in dedicated prep sessions.",
      },
      {
        label: "Competitions We Enter",
        body: "picoCTF, HackTheBox CTF, CSAW, DefCon CTF Quals, NahamCon, and more. We track our rankings and post writeups after each event.",
      },
      {
        label: "DACC CTF (Spring)",
        body: "Our own full-day event open to all skill levels — 30+ original challenges, $500+ in prizes, beginner-friendly tracks, and a live leaderboard. May 15, 2026 at De Anza College.",
      },
      {
        label: "Teaming Up",
        body: "Most online CTFs cap teams at 4. We use the club Discord to form teams, coordinate during events, and debrief afterward. Beginners are paired with experienced members.",
      },
      {
        label: "Writeups & Learning",
        body: "After every competition we hold a writeup session — members walk through how they solved each challenge. It's the fastest way to absorb techniques you didn't know.",
      },
    ],
    note: "First-timers welcome. We always have members willing to walk you through your first solve.",
  },
];

// ─── Build quarter → officers map ──────────────────────
const QUARTER_ORDER = ["Fall", "Winter", "Spring", "Summer"];

const quarterMap = new Map<string, { name: string; role: string; altRole?: string; photo?: string }[]>();
OFFICERS.forEach((officer) => {
  officer.leadershipHistory.forEach((entry) => {
    if (!entry.role) return;
    if (!quarterMap.has(entry.quarter)) quarterMap.set(entry.quarter, []);
    quarterMap.get(entry.quarter)!.push({
      name: officer.name,
      role: entry.role,
      altRole: entry.altRole,
      photo: officer.photo,
    });
  });
});

const QUARTERS = Array.from(quarterMap.keys()).sort((a, b) => {
  const [qA, yA] = a.split(" ");
  const [qB, yB] = b.split(" ");
  if (yA !== yB) return parseInt(yA) - parseInt(yB);
  return QUARTER_ORDER.indexOf(qA) - QUARTER_ORDER.indexOf(qB);
});

// ─── About Page ────────────────────────────────────────
function About() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    // Delay to let ScrollToTop and render settle
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(t);
  }, [location.hash]);

  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-matrix min-h-screen">
      <div className="crt-overlay dark:opacity-100 opacity-0" />

      <div className="max-w-5xl mx-auto px-6 py-16 relative z-10 space-y-20">

        {/* ── Page header ── */}
        <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-10 text-center">
          <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 uppercase tracking-widest mb-3">
            cat /etc/dacc/about.txt
          </p>
          <h1 className="font-mono text-5xl md:text-6xl font-bold text-green-700 dark:text-matrix uppercase tracking-wide mb-4">
            ABOUT DACC
          </h1>
          <p className="font-mono text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
            De Anza Cybersecurity Club — hands-on workshops, CTF competitions,
            and cert prep for students at De Anza College.
            <br />No experience required.
          </p>
        </div>

        {/* ── Quick-jump nav ── */}
        <nav className="border border-dashed border-gray-300 dark:border-matrix/30 p-6">
          <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 uppercase tracking-widest mb-4">
            # jump to section
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 font-mono text-sm text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-matrix transition-colors group"
              >
                <ChevronRight className="w-3 h-3 text-green-600 dark:text-matrix/50 group-hover:translate-x-0.5 transition-transform" />
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        {/* ── Content sections ── */}
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              {/* Section header */}
              <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-8 mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Icon className="w-6 h-6 text-green-700 dark:text-matrix" />
                  <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 uppercase tracking-widest">
                    ./{section.file}
                  </p>
                </div>
                <h2 className="font-mono text-4xl md:text-5xl font-bold text-green-700 dark:text-matrix uppercase text-center mb-3 tracking-wide">
                  {section.title}
                </h2>
                <p className="font-mono text-sm text-gray-500 dark:text-matrix/60 text-center">
                  {section.tagline}
                </p>
              </div>

              {/* Intro + topics */}
              <div className="grid md:grid-cols-3 gap-8">
                {/* Left: intro + note */}
                <div className="md:col-span-1 space-y-4">
                  <div className="border border-dashed border-gray-300 dark:border-matrix/30 p-5">
                    <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 mb-3">
                      root@dacc:~$ cat intro.txt
                    </p>
                    <p className="font-mono text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {section.intro}
                    </p>
                  </div>
                  {section.note && (
                    <div className="border-l-2 border-green-400 dark:border-matrix/40 pl-4">
                      <p className="font-mono text-xs text-gray-500 dark:text-gray-600 leading-relaxed">
                        <span className="text-green-700 dark:text-matrix">NOTE</span>{" "}
                        {section.note}
                      </p>
                    </div>
                  )}
                  <Link
                    to="/meetings"
                    className="flex items-center gap-1.5 font-mono text-xs text-gray-500 dark:text-matrix/50 hover:text-green-700 dark:hover:text-matrix transition-colors group"
                  >
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    See upcoming sessions
                  </Link>
                </div>

                {/* Right: topic cards */}
                <div className="md:col-span-2 grid sm:grid-cols-2 gap-3">
                  {section.topics.map((topic) => (
                    <div
                      key={topic.label}
                      className="border border-gray-200 dark:border-matrix/20 p-4 hover:border-green-500 dark:hover:border-matrix/40 transition-colors group"
                    >
                      <p className="font-mono text-xs font-bold text-green-700 dark:text-matrix uppercase mb-2 group-hover:underline">
                        {topic.label}
                      </p>
                      <p className="font-mono text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                        {topic.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* ── Leadership History ── */}
        <section>
          <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-8 mb-8 text-center">
            <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 uppercase tracking-widest mb-2">
              ./leadership_history.sh
            </p>
            <h2 className="font-mono text-4xl md:text-5xl font-bold text-green-700 dark:text-matrix uppercase tracking-wide">
              LEADERSHIP HISTORY
            </h2>
          </div>

          <div className="space-y-10">
            {QUARTERS.map((quarter) => {
              const officers = quarterMap.get(quarter)!;
              return (
                <div key={quarter}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-xs text-green-700 dark:text-matrix">$</span>
                    <h3 className="font-mono text-sm font-bold text-green-700 dark:text-matrix uppercase tracking-widest">
                      {quarter}
                    </h3>
                    <div className="flex-1 border-t border-dashed border-gray-200 dark:border-matrix/20" />
                    <span className="font-mono text-xs text-gray-400 dark:text-matrix/40">
                      {officers.length} officer{officers.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {officers.map((officer) => (
                      <div
                        key={officer.name}
                        className="border border-gray-200 dark:border-matrix/20 p-4 flex items-center gap-3 hover:border-green-500 dark:hover:border-matrix/40 transition-colors"
                      >
                        {officer.photo ? (
                          <img
                            src={officer.photo}
                            alt={officer.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 grayscale opacity-80"
                          />
                        ) : (
                          <Monogram
                            name={officer.name}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-matrix/10 shrink-0"
                            textClassName="text-xs"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {officer.name}
                          </p>
                          <p className="font-mono text-xs text-green-700 dark:text-matrix/70 truncate">
                            {officer.role}
                          </p>
                          {officer.altRole && (
                            <p className="font-mono text-xs text-gray-400 dark:text-matrix/40 truncate">
                              {officer.altRole}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Logistics ── */}
        <section className="border border-gray-200 dark:border-matrix/20 p-8">
          <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 mb-6">
            root@dacc:~$ cat meeting_info.txt
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-green-700 dark:text-matrix mt-0.5 shrink-0" />
              <div>
                <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 uppercase tracking-widest mb-1">When</p>
                <p className="font-mono text-sm text-gray-700 dark:text-gray-300">Every Monday</p>
                <p className="font-mono text-xs text-gray-500 dark:text-gray-600">2:30 PM – 4:00 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-green-700 dark:text-matrix mt-0.5 shrink-0" />
              <div>
                <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 uppercase tracking-widest mb-1">Where</p>
                <p className="font-mono text-sm text-gray-700 dark:text-gray-300">ATC Room 205</p>
                <p className="font-mono text-xs text-gray-500 dark:text-gray-600">Advanced Technology Center</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-green-700 dark:text-matrix mt-0.5 shrink-0" />
              <div>
                <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 uppercase tracking-widest mb-1">When to start</p>
                <p className="font-mono text-sm text-gray-700 dark:text-gray-300">Any week</p>
                <p className="font-mono text-xs text-gray-500 dark:text-gray-600">No registration required</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-matrix/20 flex flex-col sm:flex-row gap-4">
            <a
              href="https://discord.gg/v5JWDrZVNp"
              target="_blank"
              rel="noopener noreferrer"
              className="cli-btn-filled font-mono text-sm justify-center"
            >
              <Discord className="w-4 h-4" />
              Join Discord
            </a>
            <Link
              to="/meetings"
              className="cli-btn-dashed font-mono text-sm justify-center"
            >
              [ View schedule ]
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

export default About;
