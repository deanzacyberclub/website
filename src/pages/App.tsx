import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Discord,
  Calendar,
  GitHub,
  Instagram,
  Globe,
  LinkedIn,
  Mail,
  Code,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown,
  X,
  Trophy,
  Shield,
  Flag,
} from "@/lib/cyberIcon";
import { supabase } from "@/lib/supabase";
import CircularGallery from "@/components/CircularGallery";
import { TYPE_COLORS, TYPE_LABELS } from "./Meetings";
import type { Meeting } from "@/types/database.types";
import { useAuth } from "@/contexts/AuthContext";

const prefetchMeetings = () => import("./Meetings");

// ─── Typewriter for hero heading ─────────────────────
const heroLines = ["LEARN TO HACK.", "LEARN TO DEFEND."];

function HeroTypewriter() {
  const [displayedChars, setDisplayedChars] = useState(0);
  const fullText = heroLines.join("\n");

  useEffect(() => {
    if (displayedChars < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedChars((prev) => prev + 1);
      }, 40);
      return () => clearTimeout(timeout);
    }
  }, [displayedChars, fullText.length]);

  const visibleText = fullText.slice(0, displayedChars);
  const lines = visibleText.split("\n");

  return (
    <h1 className="font-mono font-bold text-green-700 dark:text-matrix leading-tight">
      {lines.map((line, i) => (
        <span key={i} className="block text-5xl md:text-6xl lg:text-7xl">
          {line}
          {i === lines.length - 1 && displayedChars < fullText.length && (
            <span className="cli-cursor">_</span>
          )}
        </span>
      ))}
    </h1>
  );
}

// ─── Stats Bar ───────────────────────────────────────
const stats = [
  { label: "ACTIVE MEMBERS", value: "90+", sub: "And growing" },
  { label: "WORKSHOPS", value: "20+", sub: "Hands-on sessions" },
  { label: "TOOLS COVERED", value: "15+", sub: "Industry standard" },
  { label: "CTF CHALLENGES", value: "30+", sub: "All difficulty levels" },
];

function StatsBar({ loaded }: { loaded: boolean }) {
  return (
    <div
      className={`border-t border-b border-gray-200 dark:border-matrix/20 transition-all duration-700 delay-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`px-6 py-8 ${i < stats.length - 1 ? "md:border-r md:border-gray-200 dark:md:border-matrix/20" : ""} ${i < 2 ? "border-b md:border-b-0 border-gray-200 dark:border-matrix/20" : ""}`}
          >
            <p className="font-mono text-xs text-gray-500 dark:text-matrix/60 uppercase tracking-widest mb-2">
              {stat.label}
            </p>
            <p className="font-mono text-3xl md:text-4xl font-bold text-green-700 dark:text-matrix dark:neon-text-subtle">
              {stat.value}
            </p>
            <p className="font-mono text-xs text-gray-500 dark:text-gray-600 mt-1">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Events Section ───────────────────────────
function RecentEvents({ meetings }: { meetings: Meeting[] }) {
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  if (meetings.length === 0) return null;

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <Link
          key={meeting.id}
          to={`/meetings/${meeting.slug}`}
          className="block border border-gray-200 dark:border-matrix/20 p-4 hover:border-green-500 dark:hover:border-matrix/50 hover:bg-green-50 dark:hover:bg-matrix/5 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="text-center shrink-0 w-12">
              <div className="text-2xl font-bold font-mono text-green-700 dark:text-matrix">
                {parseLocalDate(meeting.date).getDate()}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-600 uppercase font-mono">
                {parseLocalDate(meeting.date).toLocaleDateString("en-US", {
                  month: "short",
                })}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-block px-1.5 py-0 text-[10px] font-mono uppercase border ${TYPE_COLORS[meeting.type]}`}
                >
                  {TYPE_LABELS[meeting.type]}
                </span>
              </div>
              <h3 className="text-green-700 dark:text-matrix font-mono font-semibold text-sm dark:group-hover:neon-text-subtle truncate">
                {meeting.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-gray-500 dark:text-gray-600 font-mono text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {meeting.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {meeting.location}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-matrix/30 group-hover:text-green-700 dark:group-hover:text-matrix shrink-0 mt-1 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── FAQ Section ─────────────────────────────────────
const faqs = [
  {
    question: "Do I need prior experience?",
    answer:
      "Not at all! We welcome complete beginners. Our workshops start from the basics and build up. All you need is curiosity and willingness to learn.",
  },
  {
    question: "When and where do you meet?",
    answer:
      "We meet every Monday at 2:30 PM - 4:00 PM in the Advanced Technology Center, Room 205 during the academic quarter at De Anza College.",
  },
  {
    question: "What will I learn?",
    answer:
      "Everything from networking fundamentals and Linux basics to penetration testing, CTF competitions, and industry certifications like Security+ and Network+. We'll also cover game and app hacking in the future, so stay tuned!",
  },
  {
    question: "How do I join?",
    answer:
      "Just show up to a meeting! No registration required. Join our Discord to stay updated on events and connect with other members.",
  },
  {
    question: "Is this club only for CS majors?",
    answer:
      "Absolutely not! Cybersecurity is for everyone. We have members from all majors—what matters is your interest in learning.",
  },
];

function FAQSection({ loaded }: { loaded: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className={`transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-8 mb-8">
        <h2 className="font-mono text-4xl md:text-5xl font-bold text-green-700 dark:text-matrix uppercase text-center mb-3 tracking-wide">
          FREQUENTLY ASKED
          <br />
          QUESTIONS
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Usage info box */}
        <div className="border border-dashed border-gray-300 dark:border-matrix/30 p-6">
          <p className="font-mono text-xs text-gray-600 dark:text-matrix/60 mb-4">
            Usage: read_faq [OPTIONS]
          </p>
          <div className="font-mono text-xs text-gray-500 dark:text-matrix/50 space-y-2">
            <p>
              <span className="text-green-700 dark:text-matrix">Options:</span>
            </p>
            <p className="pl-4">
              <span className="text-green-600 dark:text-matrix/70">--all</span>{" "}
              <span className="text-gray-500 dark:text-gray-600">
                Display all questions
              </span>
            </p>
            <p className="pl-4">
              <span className="text-green-600 dark:text-matrix/70">
                --verbose
              </span>{" "}
              <span className="text-gray-500 dark:text-gray-600">
                Show detailed answers
              </span>
            </p>
          </div>
        </div>

        {/* Right: FAQ list */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index}>
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left font-mono text-sm text-green-700 dark:text-matrix hover:text-green-600 dark:hover:text-matrix/80 transition-colors flex items-start gap-2 group"
              >
                <span className="shrink-0">
                  {openIndex === index ? "v" : ">"}
                </span>
                <span className="group-hover:underline">{faq.question}</span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-60 mt-3" : "max-h-0"
                }`}
              >
                <div className="ml-6 border-l-2 border-green-300 dark:border-matrix/30 pl-4">
                  <p className="font-mono text-xs text-gray-500 dark:text-gray-600 mb-2">
                    root@dacc:~$ echo $ANSWER
                  </p>
                  <p className="font-mono text-xs text-gray-600 dark:text-matrix/70 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Officer Card ────────────────────────────────────
function OfficerCard({
  name,
  role,
  photo,
  links,
}: {
  name: string;
  role: string;
  photo?: string;
  links?: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    href: string;
    label: string;
  }[];
}) {
  return (
    <div className="border border-gray-200 dark:border-matrix/20 p-4 hover:border-green-500 dark:hover:border-matrix/40 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-10 h-10 border border-gray-300 dark:border-matrix/30 object-cover"
          />
        ) : (
          <div className="w-10 h-10 border border-gray-300 dark:border-matrix/30 bg-green-100 dark:bg-matrix/10 flex items-center justify-center">
            <Code className="w-5 h-5 text-green-700 dark:text-matrix" />
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 dark:text-matrix/50 font-mono uppercase tracking-widest">
            {role}
          </p>
          <p className="text-green-700 dark:text-matrix font-mono font-semibold text-sm">
            {name}
          </p>
        </div>
      </div>
      {links && links.length > 0 && (
        <div className="flex gap-1.5 ml-[52px]">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={link.label}
              className="w-6 h-6 border border-gray-200 dark:border-matrix/20 flex items-center justify-center hover:border-green-700 dark:hover:border-matrix hover:text-green-700 dark:hover:text-matrix transition-colors text-gray-500 dark:text-gray-600"
            >
              <link.icon className="w-3 h-3" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════
// Check WebGL support synchronously before component renders
const checkWebGLSupport = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch (e) {
    return false;
  }
};

function App() {
  const [loaded, setLoaded] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [supportsGallery] = useState(() => checkWebGLSupport());
  const { userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoaded(true);
    fetchRecentMeetings();
  }, []);

  const fetchRecentMeetings = async () => {
    try {
      const { data } = await supabase
        .from("meetings_public")
        .select("*")
        .order("date", { ascending: false })
        .limit(4);

      if (data) setRecentMeetings(data);
    } catch (err) {
      console.error("Error fetching recent meetings:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-matrix min-h-screen">
      {/* CRT Scanline Overlay */}
      <div className="crt-overlay dark:opacity-100 opacity-0" />

      <div className="relative z-10">
        {/* ════════════════════════════════════════════
            HERO SECTION
            ════════════════════════════════════════════ */}
        <section
          className={`min-h-screen flex flex-col justify-center transition-all duration-700 relative overflow-hidden ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          {/* Background ASCII Art - responsive sizing */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <pre className="font-mono text-[clamp(60px,15vw,200px)] leading-[0.85] text-green-200/20 dark:text-matrix/[0.03] whitespace-pre">
              {`██████╗  █████╗  ██████╗ ██████╗
██╔══██╗██╔══██╗██╔════╝██╔════╝
██║  ██║███████║██║     ██║
██║  ██║██╔══██║██║     ██║
██████╔╝██║  ██║╚██████╗╚██████╗
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝`}
            </pre>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-24 md:py-32 relative z-10">
            {/* Status text */}
            {authLoading ? (
              <p className="font-mono text-sm text-gray-600 dark:text-matrix/60 mb-8">
                <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
                INITIALIZING SECURITY PROTOCOLS...
              </p>
            ) : userProfile ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="font-mono text-sm text-gray-600 dark:text-matrix/60 hover:text-green-700 dark:hover:text-matrix transition-colors mb-8 group"
              >
                <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
                WELCOME,{" "}
                <span className="text-green-700 dark:text-matrix uppercase group-hover:underline">
                  {userProfile.display_name}
                </span>
              </button>
            ) : (
              <Link
                to="/auth"
                className="font-mono text-sm text-gray-600 dark:text-matrix/60 hover:text-green-700 dark:hover:text-matrix transition-colors mb-8 inline-block group"
              >
                <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
                <span className="group-hover:underline">SIGN IN</span>
              </Link>
            )}

            {/* Big heading */}
            <div className="mb-8">
              <HeroTypewriter />
            </div>

            {/* Description with left border */}
            <div className="border-l-2 border-green-300 dark:border-matrix/30 pl-5 mb-10 max-w-2xl">
              <p className="font-mono text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                De Anza Cybersecurity Club brings students together with
                hands-on workshops, CTF competitions, and industry
                certifications. No experience required — we&apos;ll teach you
                everything from the ground up.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="https://discord.gg/v5JWDrZVNp"
                target="_blank"
                rel="noopener noreferrer"
                className="cli-btn-filled font-mono w-full sm:w-auto justify-center uppercase"
              >
                <Discord className="w-4 h-4" />
                Join Discord
              </a>
              <Link
                to="/meetings"
                className="cli-btn-dashed font-mono w-full sm:w-auto justify-center uppercase"
                onMouseEnter={prefetchMeetings}
                onFocus={prefetchMeetings}
              >
                [ View events ]
              </Link>
            </div>

            {/* Status line */}
            <p className="font-mono text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              STATUS: Join 90+ members learning cybersecurity at De Anza College
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            STATS BAR
            ════════════════════════════════════════════ */}
        <StatsBar loaded={loaded} />

        {/* ════════════════════════════════════════════
            CONTENT SECTIONS
            ════════════════════════════════════════════ */}
        <div className="max-w-5xl mx-auto px-6 py-20 space-y-24">
          {/* ── RECENT EVENTS ── */}
          <section
            className={`transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-8 mb-8">
              <h2 className="font-mono text-4xl md:text-5xl font-bold text-green-700 dark:text-matrix uppercase text-center mb-3 tracking-wide">
                RECENT EVENTS
              </h2>
              <p className="font-mono text-sm text-gray-600 dark:text-matrix/60 text-center">
                Upcoming workshops, CTFs, and club meetings
              </p>
            </div>
            <RecentEvents meetings={recentMeetings} />
            <div className="mt-6 text-center">
              <Link
                to="/meetings"
                className="font-mono text-sm text-gray-500 dark:text-matrix/50 hover:text-green-700 dark:hover:text-matrix transition-colors inline-flex items-center gap-1"
                onMouseEnter={prefetchMeetings}
              >
                VIEW ALL EVENTS <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* ── WHAT YOU'LL LEARN ── */}
          <section
            className={`transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-8 mb-8">
              <h2 className="font-mono text-4xl md:text-5xl font-bold text-green-700 dark:text-matrix uppercase text-center mb-3 tracking-wide">
                WHAT YOU&apos;LL LEARN
              </h2>
              <p className="font-mono text-sm text-gray-600 dark:text-matrix/60 text-center">
                Hands-on skills from industry professionals
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {[
                {
                  icon: Shield,
                  title: "HACKING FUNDAMENTALS",
                  file: "hacking_fundamentals.sh",
                  desc: "Think like an attacker. Learn reconnaissance, exploitation, and how real breaches happen.",
                },
                {
                  icon: Flag,
                  title: "GET CERTIFIED",
                  file: "get_certified.sh",
                  desc: "Study groups for Security+, Network+, and more. Land your first cybersecurity job.",
                },
                {
                  icon: Code,
                  title: "REAL TOOLS",
                  file: "real_tools.sh",
                  desc: "Get hands-on with Burp Suite, Nmap, Wireshark, Metasploit—the same tools pros use.",
                },
                {
                  icon: Trophy,
                  title: "CTF COMPETITIONS",
                  file: "ctf_competitions.sh",
                  desc: "Compete in capture-the-flag events. Solve puzzles. Win bragging rights (and prizes).",
                },
              ].map((mod) => (
                <div
                  key={mod.file}
                  className="border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <mod.icon className="w-5 h-5 text-gray-400 dark:text-matrix/40 group-hover:text-green-700 dark:group-hover:text-matrix transition-colors" />
                    <span className="font-mono text-xs text-gray-400 dark:text-matrix/40 group-hover:text-green-600 dark:group-hover:text-matrix/70 transition-colors">
                      {mod.file}
                    </span>
                  </div>
                  <h3 className="font-mono font-bold text-green-700 dark:text-matrix text-sm mb-2 uppercase">
                    {mod.title}
                  </h3>
                  <p className="font-mono text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTF HACKATHON TEASER ── */}
          <section
            className={`transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Link to="/ctf" className="block group">
              <div className="border border-gray-200 dark:border-matrix/20 p-8 hover:border-green-500 dark:hover:border-matrix/50 transition-all relative overflow-hidden">
                {/* Scan line effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/50 dark:via-matrix/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <div className="w-16 h-16 border border-gray-300 dark:border-matrix/30 bg-green-100 dark:bg-matrix/10 flex items-center justify-center group-hover:border-green-600 dark:group-hover:border-matrix/60 transition-colors">
                      <Trophy className="w-8 h-8 text-green-700 dark:text-matrix" />
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase border border-dashed border-green-500 dark:border-matrix/50 text-green-700 dark:text-matrix animate-pulse">
                        COMING SOON
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-mono font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-700 dark:group-hover:text-matrix transition-colors uppercase">
                      DACC CAPTURE THE FLAG
                    </h3>
                    <p className="font-mono text-gray-600 dark:text-gray-500 text-sm mb-3">
                      A full-day cybersecurity competition with $500+ in prizes,
                      30+ challenges, and hackers of all skill levels welcome.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-500 dark:text-gray-600 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-green-700 dark:text-matrix" />
                        TBA 2026
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-700 dark:text-matrix" />
                        De Anza College
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-green-700 dark:text-matrix" />
                        6 Hours
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-matrix/40 group-hover:text-green-700 dark:group-hover:text-matrix group-hover:translate-x-1 transition-all font-mono text-sm">
                      Learn more
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>

          {/* ── OFFICERS ── */}
          <section
            className={`transition-all duration-700 delay-250 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-8 mb-8">
              <h2 className="font-mono text-4xl md:text-5xl font-bold text-green-700 dark:text-matrix uppercase text-center mb-3 tracking-wide">
                CLUB LEADERSHIP
              </h2>
              <p className="font-mono text-sm text-gray-600 dark:text-matrix/60 text-center">
                Meet the team building DACC
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <OfficerCard
                name="Neel Anshu"
                role="President"
                photo="/neel-anshu.jpeg"
                links={[
                  {
                    icon: GitHub,
                    href: "https://github.com/boredcreator",
                    label: "GitHub",
                  },
                  {
                    icon: Instagram,
                    href: "https://instagram.com/neel_reddy455",
                    label: "Instagram",
                  },
                  {
                    icon: Globe,
                    href: "https://flippedbyneel.com",
                    label: "Website",
                  },
                ]}
              />
              <OfficerCard
                name="Aaron Ma"
                role="Vice President"
                photo="/aaron-ma.jpeg"
                links={[
                  {
                    icon: GitHub,
                    href: "https://github.com/aaronhma",
                    label: "GitHub",
                  },
                  { icon: X, href: "https://x.com/aaronhma", label: "X" },
                  {
                    icon: LinkedIn,
                    href: "https://www.linkedin.com/in/air-rn/",
                    label: "LinkedIn",
                  },
                  {
                    icon: Mail,
                    href: "mailto:hi@aaronhma.com",
                    label: "Email",
                  },
                  {
                    icon: Globe,
                    href: "https://aaronhma.com/",
                    label: "Website",
                  },
                ]}
              />
              <OfficerCard
                name="Thant Thu Hein"
                role="Outreach Manager"
                links={[
                  {
                    icon: Instagram,
                    href: "https://www.instagram.com/butter.daxxton",
                    label: "Instagram",
                  },
                ]}
              />
              <OfficerCard name="Mobin Norouzi" role="Treasurer" />
              <OfficerCard name="Ollin Ruiz" role="Curriculum Lead" />
            </div>
          </section>

          {/* ── FAQ ── */}
          <FAQSection loaded={loaded} />

          {/* ── GALLERY ── Only show on supported devices */}
          {supportsGallery && (
            <section
              className={`transition-all duration-700 delay-250 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-8 mb-8">
                <h2 className="font-mono text-4xl md:text-5xl font-bold text-green-700 dark:text-matrix uppercase text-center mb-3 tracking-wide">
                  THE EXPERIENCE
                </h2>
                <p className="font-mono text-sm text-gray-600 dark:text-matrix/60 text-center">
                  See our meetings for yourself
                </p>
              </div>

              <div style={{ height: "600px", position: "relative" }}>
                <CircularGallery
                  bend={3}
                  textColor="#ffffff"
                  borderRadius={0.05}
                  scrollEase={0.02}
                  bend={1}
                  borderRadius={0.05}
                  scrollSpeed={2}
                  scrollEase={0.05}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
