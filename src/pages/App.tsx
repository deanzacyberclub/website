import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Discord,
  Calendar,
  Code,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Trophy,
  Shield,
  Flag,
} from "@/lib/cyberIcon";
import { supabase } from "@/lib/supabase";
import CircularGallery, { type CircularGalleryHandle } from "@/components/CircularGallery";
import Monogram from "@/components/Monogram";
import { TYPE_COLORS, TYPE_LABELS } from "./Meetings";
import type { Meeting } from "@/types/database.types";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { OFFICERS } from "@/constants";
import type { OfficerData } from "@/constants";
import { useInView } from "@/hooks/useInView";

const prefetchMeetings = () => import("./Meetings");

// ─── Typewriter for hero heading ─────────────────────
const HACKING_TERMS = [
  "HACK",
  "DEFEND",
  "ATTACK",
  "EXPLOIT",
  "PENETRATE",
  "ENUMERATE",
  "DECRYPT",
];
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
const INITIAL_TYPE_TEXT = "LEARN TO\n[HACK].";

function HeroTypewriter() {
  const [phase, setPhase] = useState<"typing" | "cycling">("typing");
  const [typedChars, setTypedChars] = useState(0);
  const [displayWord, setDisplayWord] = useState("HACK");
  const termIndexRef = useRef(0);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrambleTo = useCallback((target: string) => {
    cancelAnimationFrame(rafRef.current);
    const duration = 700;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const settled = Math.floor(progress * target.length);
      setDisplayWord(
        target
          .split("")
          .map((char, i) =>
            i < settled
              ? char
              : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          )
          .join("")
      );
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayWord(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // Phase 1: typewriter
  useEffect(() => {
    if (phase !== "typing") return;
    if (typedChars < INITIAL_TYPE_TEXT.length) {
      const t = setTimeout(() => setTypedChars((p) => p + 1), 50);
      return () => clearTimeout(t);
    }
    // Done typing — pause, then start cycling
    const t = setTimeout(() => setPhase("cycling"), 900);
    return () => clearTimeout(t);
  }, [phase, typedChars]);

  // Phase 2: scramble cycling
  useEffect(() => {
    if (phase !== "cycling") return;
    const cycle = () => {
      termIndexRef.current = (termIndexRef.current + 1) % HACKING_TERMS.length;
      scrambleTo(HACKING_TERMS[termIndexRef.current]);
      timeoutRef.current = setTimeout(cycle, 2500);
    };
    timeoutRef.current = setTimeout(cycle, 2500);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, scrambleTo]);

  if (phase === "typing") {
    const visible = INITIAL_TYPE_TEXT.slice(0, typedChars);
    const lines = visible.split("\n");
    return (
      <h1 className="font-mono font-bold text-green-700 dark:text-matrix leading-tight">
        {lines.map((line, i) => (
          <span key={i} className="block text-5xl md:text-6xl lg:text-7xl">
            {line}
            {i === lines.length - 1 && <span className="cli-cursor">_</span>}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <h1 className="font-mono font-bold text-green-700 dark:text-matrix leading-tight">
      <span className="block text-5xl md:text-6xl lg:text-7xl">LEARN TO</span>
      <span className="block text-5xl md:text-6xl lg:text-7xl">
        [{displayWord}].<span className="cli-cursor">_</span>
      </span>
    </h1>
  );
}

// ─── Floating Hex Decorations ────────────────────────
const HEX_STRINGS = [
  "0x7F3A", "0xC9E1", "0x2B4D", "0xFF00", "0x1A3C",
  "0x5E8F", "0xD220", "0x99BB", "0x4A6E", "0x1133",
  "0x88AA", "0x3C5F", "0xE007", "0x66DD", "0xBB44",
];

function FloatingHexBackground() {
  const [hexes, setHexes] = useState<{ id: number; text: string; left: number; top: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      text: HEX_STRINGS[i % HEX_STRINGS.length],
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
    }));
    setHexes(items);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {hexes.map((hex) => (
        <span
          key={hex.id}
          className="absolute font-mono text-[10px] text-green-300/20 dark:text-matrix/[0.07] animate-pulse"
          style={{
            left: `${hex.left}%`,
            top: `${hex.top}%`,
            animationDelay: `${hex.delay}s`,
            animationDuration: `${hex.duration}s`,
          }}
        >
          {hex.text}
        </span>
      ))}
    </div>
  );
}

// ─── Scroll Indicator ────────────────────────────────
function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
      <span className="font-mono text-[10px] text-gray-400 dark:text-matrix/40 uppercase tracking-widest">
        Scroll
      </span>
      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-matrix/40" />
    </div>
  );
}

// ─── Animated Counter ────────────────────────────────
function AnimatedCounter({ value, inView }: { value: string; inView: boolean }) {
  const numeric = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * numeric));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [inView, numeric]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

// ─── Section Header ──────────────────────────────────
function SectionHeader({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-t border-b border-dashed border-gray-300 dark:border-matrix/30 py-8 mb-8 relative overflow-hidden">
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 text-[10px] font-mono text-gray-300 dark:text-matrix/15 select-none">
        ┌─
      </div>
      <div className="absolute top-2 right-2 text-[10px] font-mono text-gray-300 dark:text-matrix/15 select-none">
        ─┐
      </div>
      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-gray-300 dark:text-matrix/15 select-none">
        └─
      </div>
      <div className="absolute bottom-2 right-2 text-[10px] font-mono text-gray-300 dark:text-matrix/15 select-none">
        ─┘
      </div>

      <div className="flex items-center justify-center gap-3 md:gap-4">
        <span className="hidden sm:inline font-mono text-xs text-green-600/40 dark:text-matrix/30">
          [{index}]
        </span>
        <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-gray-300 dark:to-matrix/20" />
        <h2 className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold text-green-700 dark:text-matrix uppercase tracking-wide text-center">
          {title}
        </h2>
        <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-gray-300 dark:to-matrix/20" />
        <span className="hidden sm:inline font-mono text-xs text-green-600/40 dark:text-matrix/30">
          [{index}]
        </span>
      </div>
      {subtitle && (
        <p className="font-mono text-sm text-gray-500 dark:text-matrix/50 text-center mt-3">
          {subtitle}
        </p>
      )}
    </div>
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
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <div
      ref={ref}
      className={`border-t border-b border-gray-200 dark:border-matrix/20 transition-all duration-700 delay-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`group px-6 py-8 hover:bg-green-50/50 dark:hover:bg-matrix/[0.02] transition-colors ${i < stats.length - 1 ? "md:border-r md:border-gray-200 dark:md:border-matrix/20" : ""} ${i < 2 ? "border-b md:border-b-0 border-gray-200 dark:border-matrix/20" : ""}`}
          >
            <p className="font-mono text-xs text-gray-400 dark:text-matrix/50 uppercase tracking-widest mb-2">
              {stat.label}
            </p>
            <p className="font-mono text-3xl md:text-4xl font-bold text-green-700 dark:text-matrix dark:group-hover:neon-text-subtle transition-all duration-300">
              <AnimatedCounter value={stat.value} inView={inView} />
            </p>
            <p className="font-mono text-xs text-gray-400 dark:text-gray-600 mt-1">
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
      {meetings.map((meeting, idx) => (
        <Link
          key={meeting.id}
          to={`/meetings/${meeting.slug}`}
          className="block border border-gray-200 dark:border-matrix/20 p-4 hover:border-green-500 dark:hover:border-matrix/50 hover:bg-green-50/50 dark:hover:bg-matrix/5 hover:translate-x-1 transition-all duration-300 group relative overflow-hidden"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          {/* Left accent border on hover */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-matrix scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

          <div className="flex items-start gap-4">
            <div className="text-center shrink-0 w-12 border border-gray-200 dark:border-matrix/20 group-hover:border-green-500 dark:group-hover:border-matrix/50 transition-colors p-1">
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
                {idx === 0 && (
                  <span className="text-[10px] font-mono uppercase text-green-700 dark:text-matrix animate-pulse">
                    ● NEW
                  </span>
                )}
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

// ─── Learn Module Cards ──────────────────────────────
const learnModules = [
  {
    icon: Shield,
    title: "HACKING FUNDAMENTALS",
    file: "hacking_fundamentals.sh",
    anchor: "hacking-fundamentals",
    desc: "Think like an attacker. Learn reconnaissance, exploitation, and how real breaches happen.",
  },
  {
    icon: Flag,
    title: "GET CERTIFIED",
    file: "get_certified.sh",
    anchor: "get-certified",
    desc: "Study groups for Security+, Network+, and more. Land your first cybersecurity job.",
  },
  {
    icon: Code,
    title: "REAL TOOLS",
    file: "real_tools.sh",
    anchor: "real-tools",
    desc: "Get hands-on with Burp Suite, Nmap, Wireshark, Metasploit—the same tools pros use.",
  },
  {
    icon: Trophy,
    title: "CTF COMPETITIONS",
    file: "ctf_competitions.sh",
    anchor: "ctf-competitions",
    desc: "Compete in capture-the-flag events. Solve puzzles. Win bragging rights (and prizes).",
  },
];

function LearnModules() {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {learnModules.map((mod) => (
        <Link
          key={mod.file}
          to={`/about#${mod.anchor}`}
          className="block border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 hover:bg-green-50/30 dark:hover:bg-matrix/[0.03] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden"
        >
          {/* Corner brackets on hover */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500 dark:border-matrix opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-green-500 dark:border-matrix opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-green-500 dark:border-matrix opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500 dark:border-matrix opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 border border-gray-200 dark:border-matrix/20 bg-green-50 dark:bg-matrix/5 flex items-center justify-center group-hover:border-green-500 dark:group-hover:border-matrix/40 transition-colors">
              <mod.icon className="w-4 h-4 text-gray-400 dark:text-matrix/40 group-hover:text-green-700 dark:group-hover:text-matrix transition-colors" />
            </div>
            <span className="font-mono text-xs text-gray-400 dark:text-matrix/40 group-hover:text-green-600 dark:group-hover:text-matrix/70 transition-colors">
              {mod.file}
            </span>
            <ChevronRight className="w-4 h-4 ml-auto transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 text-green-600 dark:text-matrix/50 group-hover:translate-x-0.5" />
          </div>
          <h3 className="font-mono font-bold text-green-700 dark:text-matrix text-sm mb-2 uppercase group-hover:tracking-wider transition-all duration-300">
            {mod.title}
          </h3>
          <p className="font-mono text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
            {mod.desc}
          </p>
        </Link>
      ))}
    </div>
  );
}

// ─── CTF Hackathon Teaser ────────────────────────────
function CTFTeaser({ loaded }: { loaded: boolean }) {
  return (
    <section
      className={`transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <Link to="/ctf" className="block group">
        <div className="border border-gray-200 dark:border-matrix/20 p-6 md:p-8 hover:border-green-500 dark:hover:border-matrix/50 transition-all relative overflow-hidden">
          {/* Scan line effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/50 dark:via-matrix/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          {/* Animated border glow in dark mode */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 dark:via-matrix to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 dark:via-matrix to-transparent" />
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0">
              <div className="w-16 h-16 border border-gray-300 dark:border-matrix/30 bg-green-100 dark:bg-matrix/10 flex items-center justify-center group-hover:border-green-600 dark:group-hover:border-matrix/60 transition-colors">
                <Trophy className="w-8 h-8 text-green-700 dark:text-matrix group-hover:scale-110 transition-transform duration-300" style={{ animation: "ctf-float 3s ease-in-out infinite" }} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase border border-dashed border-green-500 dark:border-matrix/50 text-green-700 dark:text-matrix animate-pulse">
                  TEAM FORMATION OPEN
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 dark:text-gray-600">
                  <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix rounded-full animate-pulse" />
                  LIVE
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
                  Saturday, May 15, 2026
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-green-700 dark:text-matrix" />
                  De Anza College
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-green-700 dark:text-matrix" />
                  12 PM - 6 PM
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
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className={`transition-all duration-700 delay-300 ${loaded && inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <SectionHeader
        index="05"
        title="FREQUENTLY ASKED QUESTIONS"
      />

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Usage info box */}
        <div className="border border-dashed border-gray-300 dark:border-matrix/30 p-6 relative group hover:border-green-400 dark:hover:border-matrix/40 transition-colors">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />

          <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 mb-4">
            <span className="text-green-700 dark:text-matrix">$</span> read_faq --help
          </p>
          <div className="font-mono text-xs text-gray-500 dark:text-matrix/50 space-y-2">
            <p>
              <span className="text-green-700 dark:text-matrix">Usage:</span>{" "}
              read_faq [OPTIONS]
            </p>
            <p className="pl-4">
              <span className="text-green-600 dark:text-matrix/70">--all</span>{" "}
              <span className="text-gray-400 dark:text-gray-600">
                Display all questions
              </span>
            </p>
            <p className="pl-4">
              <span className="text-green-600 dark:text-matrix/70">
                --verbose
              </span>{" "}
              <span className="text-gray-400 dark:text-gray-600">
                Show detailed answers
              </span>
            </p>
          </div>
        </div>

        {/* Right: FAQ list */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-matrix/20 hover:border-green-500/50 dark:hover:border-matrix/30 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left font-mono text-sm text-green-700 dark:text-matrix hover:text-green-600 dark:hover:text-matrix/80 transition-colors flex items-start gap-3 group p-3"
              >
                <span className="shrink-0 font-mono text-xs text-gray-400 dark:text-matrix/30 mt-0.5">
                  [{String(index + 1).padStart(2, "0")}]
                </span>
                <span className="flex-1 group-hover:underline decoration-green-300 dark:decoration-matrix/30 underline-offset-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 mt-0.5 transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="mx-3 mb-3 border-l-2 border-green-300 dark:border-matrix/30 pl-4">
                  <p className="font-mono text-xs text-gray-400 dark:text-matrix/40 mb-2">
                    <span className="text-green-700 dark:text-matrix">$</span> echo{" "}
                    <span className="text-green-600 dark:text-matrix/70">$ANSWER</span>
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
  altRole,
  photo,
  links,
  onClick,
}: OfficerData & { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-gray-200 dark:border-matrix/20 p-4 hover:border-green-500 dark:hover:border-matrix/40 hover:bg-green-50/30 dark:hover:bg-matrix/[0.03] hover:translate-x-0.5 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-matrix scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

      <div className="flex items-center gap-3 mb-3">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-10 h-10 border border-gray-300 dark:border-matrix/30 object-cover group-hover:border-green-500 dark:group-hover:border-matrix/50 transition-colors"
          />
        ) : (
          <Monogram
            name={name}
            className="w-10 h-10 border border-gray-300 dark:border-matrix/30 bg-green-100 dark:bg-matrix/10 group-hover:border-green-500 dark:group-hover:border-matrix/50 transition-colors"
            textClassName="text-xs"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 dark:text-matrix/50 font-mono uppercase tracking-widest">
            {role}
            {altRole && (
              <span className="text-gray-400 dark:text-matrix/30"> · {altRole}</span>
            )}
          </p>
          <p className="text-green-700 dark:text-matrix font-mono font-semibold text-sm truncate">
            {name}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 ml-auto transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 text-green-600 dark:text-matrix/50 shrink-0" />
      </div>
      {links && links.length > 0 && (
        <div className="flex gap-1.5 ml-[52px]">
          {links.map((link) => (
            <span
              key={link.href}
              aria-label={link.label}
              className="w-6 h-6 border border-gray-200 dark:border-matrix/20 flex items-center justify-center text-gray-500 dark:text-gray-600 group-hover:border-green-300 dark:group-hover:border-matrix/30 transition-colors"
            >
              <link.icon className="w-3 h-3" />
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Officer Modal ────────────────────────────────────
function OfficerModal({
  officer,
  onClose,
}: {
  officer: OfficerData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!officer) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [officer, onClose]);

  if (!officer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative terminal-window max-w-sm w-full">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="ml-4 text-xs font-terminal text-gray-500 dark:text-matrix/60">
            officer_profile.sh
          </span>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="terminal-body">
          <div className="flex flex-col items-center text-center mb-6">
            {officer.photo ? (
              <img
                src={officer.photo}
                alt={officer.name}
                className="w-20 h-20 border-2 border-gray-300 dark:border-matrix/40 object-cover mb-4"
              />
            ) : (
              <Monogram
                name={officer.name}
                className="w-20 h-20 border-2 border-gray-300 dark:border-matrix/30 bg-green-100 dark:bg-matrix/10 mb-4"
                textClassName="text-xl"
              />
            )}
            <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 uppercase tracking-widest mb-1">
              {officer.role}
              {officer.altRole && (
                <span className="text-gray-400 dark:text-matrix/30">
                  {" "}
                  · {officer.altRole}
                </span>
              )}
            </p>
            <h3 className="font-mono font-bold text-lg text-green-700 dark:text-matrix">
              {officer.name}
            </h3>
          </div>

          {officer.leadershipHistory.length > 0 && (
            <div className="border-t border-gray-200 dark:border-matrix/20 pt-4 mb-4">
              <p className="font-mono text-xs text-gray-400 dark:text-matrix/40 uppercase tracking-widest mb-2">
                Leadership History
              </p>
              <div className="space-y-1">
                {officer.leadershipHistory.map((entry) => (
                  <div key={entry.quarter} className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs text-gray-500 dark:text-matrix/50 shrink-0">
                      {entry.quarter}
                    </span>
                    <span className="font-mono text-xs text-green-700 dark:text-matrix text-right">
                      {entry.role}
                      {entry.altRole && (
                        <span className="text-gray-400 dark:text-matrix/40">
                          {" "}
                          · {entry.altRole}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {officer.links && officer.links.length > 0 ? (
            <div className="space-y-2 border-t border-gray-200 dark:border-matrix/20 pt-4">
              {officer.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 border border-gray-200 dark:border-matrix/20 hover:border-green-500 dark:hover:border-matrix/50 hover:text-green-700 dark:hover:text-matrix text-gray-600 dark:text-gray-400 transition-colors group"
                >
                  <link.icon className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs">{link.label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-gray-500 dark:text-gray-600 text-center border-t border-gray-200 dark:border-matrix/20 pt-4">
              No links available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scroll Reveal Wrapper ───────────────────────────
function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
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
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerData | null>(null);
  const galleryRef = useRef<CircularGalleryHandle>(null);
  const { resolvedTheme } = useTheme();
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

      if (data) setRecentMeetings(data as Meeting[]);
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
          {/* Background dot grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Floating hex decorations */}
          <FloatingHexBackground />

          {/* Background ASCII Art - responsive sizing */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <div className="dacc-bg-wrapper">
              <pre className="font-mono text-[clamp(60px,15vw,200px)] leading-[0.85] text-green-200/20 dark:text-matrix/[0.03] whitespace-pre">
                {`██████╗  █████╗  ██████╗ ██████╗
██╔══██╗██╔══██╗██╔════╝██╔════╝
██║  ██║███████║██║     ██║
██║  ██║██╔══██║██║     ██║
██████╔╝██║  ██║╚██████╗╚██████╗
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝`}
              </pre>
              <div className="dacc-scan-line" />
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-24 md:py-32 relative z-10">
            {/* Status text */}
            {authLoading ? (
              <p className="font-mono text-sm text-gray-500 dark:text-matrix/60 mb-8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix rounded-full animate-pulse" />
                <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
                INITIALIZING SECURITY PROTOCOLS...
              </p>
            ) : userProfile ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="font-mono text-sm text-gray-500 dark:text-matrix/60 hover:text-green-700 dark:hover:text-matrix transition-colors mb-8 group flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix rounded-full" />
                <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
                WELCOME,{" "}
                <span className="text-green-700 dark:text-matrix uppercase group-hover:underline">
                  {userProfile.display_name}
                </span>
              </button>
            ) : (
              <Link
                to="/auth"
                className="font-mono text-sm text-gray-500 dark:text-matrix/60 hover:text-green-700 dark:hover:text-matrix transition-colors mb-8 inline-flex items-center gap-2 group"
              >
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-matrix/40 rounded-full group-hover:bg-green-500 dark:group-hover:bg-matrix transition-colors" />
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
            <p className="font-mono text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix rounded-full animate-pulse" />
              STATUS: Join 90+ members learning cybersecurity at De Anza College
            </p>
          </div>

          {/* Scroll indicator */}
          <ScrollIndicator />
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
          <ScrollReveal delay={0}>
            <section>
              <SectionHeader
                index="01"
                title="RECENT EVENTS"
                subtitle="Upcoming workshops, CTFs, and club meetings"
              />
              <RecentEvents meetings={recentMeetings} />
              <div className="mt-6 text-center">
                <Link
                  to="/meetings"
                  className="font-mono text-sm text-gray-400 dark:text-matrix/40 hover:text-green-700 dark:hover:text-matrix transition-colors inline-flex items-center gap-1 group"
                  onMouseEnter={prefetchMeetings}
                >
                  VIEW ALL EVENTS{" "}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </section>
          </ScrollReveal>

          {/* ── WHAT YOU'LL LEARN ── */}
          <ScrollReveal delay={100}>
            <section>
              <SectionHeader
                index="02"
                title="WHAT YOU'LL LEARN"
                subtitle="Hands-on skills from industry professionals"
              />
              <LearnModules />
            </section>
          </ScrollReveal>

          {/* ── CTF HACKATHON TEASER ── */}
          <CTFTeaser loaded={loaded} />

          {/* ── OFFICERS ── */}
          <ScrollReveal delay={100}>
            <section>
              <SectionHeader
                index="03"
                title="CLUB LEADERSHIP"
                subtitle="Meet the team building DACC"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OFFICERS.map((officer) => (
                  <OfficerCard
                    key={officer.name}
                    {...officer}
                    onClick={() => setSelectedOfficer(officer)}
                  />
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ── FAQ ── */}
          <FAQSection loaded={loaded} />

          {/* ── GALLERY ── Only show on supported devices */}
          {supportsGallery && (
            <ScrollReveal delay={100}>
              <section>
                <SectionHeader
                  index="04"
                  title="THE EXPERIENCE"
                  subtitle="See our meetings for yourself"
                />

                {/* Full-bleed breakout from max-w-5xl container */}
                <div className="relative w-screen left-1/2 -translate-x-1/2" style={{ height: "600px" }}>
                  <CircularGallery
                    ref={galleryRef}
                    bend={1}
                    textColor={resolvedTheme === "dark" ? "#ffffff" : "#000000"}
                    borderRadius={0.05}
                    scrollSpeed={2}
                    scrollEase={0.05}
                    disableScroll
                  />
                  <button
                    onClick={() => galleryRef.current?.scrollLeft()}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white transition-all backdrop-blur-sm"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => galleryRef.current?.scrollRight()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white transition-all backdrop-blur-sm"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </section>
            </ScrollReveal>
          )}
        </div>
      </div>

      <OfficerModal
        officer={selectedOfficer}
        onClose={() => setSelectedOfficer(null)}
      />
    </div>
  );
}

export default App;
