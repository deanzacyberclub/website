import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
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
  Users,
} from "@/lib/cyberIcon";
import { supabase } from "@/lib/supabase";
import Monogram from "@/components/Monogram";

// Lazy load the heavy CircularGallery (uses ogl/WebGL) only when needed
const CircularGallery = lazy(() =>
  import("@/components/CircularGallery").then((mod) => ({
    default: mod.default as React.ComponentType<any>,
  }))
);
import { TYPE_COLORS, TYPE_LABELS } from "@/lib/meetingUtils";
import type { Meeting } from "@/types/database.types";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { OFFICERS, CURRENT_QUARTER, ROLE_ORDER } from "@/constants";
import type { OfficerData } from "@/constants";
import { useInView } from "@/hooks/useInView";
import { ScrollReveal } from "@/components/ScrollReveal";


const prefetchLive = () => import("./Attendance");

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
              : SCRAMBLE_CHARS[
                  Math.floor(Math.random() * SCRAMBLE_CHARS.length)
                ],
          )
          .join(""),
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

  const isLongWord = displayWord.length >= 8;

  if (phase === "typing") {
    const visible = INITIAL_TYPE_TEXT.slice(0, typedChars);
    const lines = visible.split("\n");
    return (
      <h1 className="font-mono font-bold text-green-700 dark:text-matrix leading-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
            {i === lines.length - 1 && <span className="cli-cursor">_</span>}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <h1 className="font-mono font-bold text-green-700 dark:text-matrix leading-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
      <span className="block">LEARN TO</span>
      <span className={`block ${isLongWord ? "tracking-tighter" : ""}`}>
        [{displayWord}].<span className="cli-cursor">_</span>
      </span>
    </h1>
  );
}

// ─── Floating Hex Decorations ────────────────────────
const HEX_STRINGS = [
  "0x7F3A",
  "0xC9E1",
  "0x2B4D",
  "0xFF00",
  "0x1A3C",
  "0x5E8F",
  "0xD220",
  "0x99BB",
  "0x4A6E",
  "0x1133",
  "0x88AA",
  "0x3C5F",
  "0xE007",
  "0x66DD",
  "0xBB44",
];

function FloatingHexBackground() {
  const [hexes, setHexes] = useState<
    {
      id: number;
      text: string;
      left: number;
      top: number;
      delay: number;
      duration: number;
    }[]
  >([]);

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
function ScrollIndicator({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce cursor-pointer hover:opacity-70 transition-opacity"
      aria-label="Scroll to content"
    >
      <span className="font-mono text-[10px] text-gray-400 dark:text-matrix/40 uppercase tracking-widest">
        Scroll
      </span>
      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-matrix/40" />
    </button>
  );
}

// ─── Cycling Status Messages ─────────────────────────
const STATUS_MESSAGES = [
  "Join 100+ members learning cybersecurity at De Anza College",
  "Mondays 2:30–4:00 PM · ATC Room 205",
  "No experience required — beginners welcome",
  "Next meeting: check Discord for updates",
  "Compete in CTFs · Earn certifications · Build real skills",
];

function CyclingStatus() {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % STATUS_MESSAGES.length);
        setFading(false);
      }, 300);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="font-mono text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix rounded-full animate-pulse shrink-0" />
      <span
        className="transition-opacity duration-300"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {STATUS_MESSAGES[index]}
      </span>
    </p>
  );
}

// ─── Animated Counter ────────────────────────────────
function AnimatedCounter({
  value,
  inView,
}: {
  value: string;
  inView: boolean;
}) {
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
  { label: "ACTIVE MEMBERS", value: "100+", sub: "And growing", icon: Users },
  { label: "WORKSHOPS", value: "20+", sub: "Hands-on sessions", icon: Calendar },
  { label: "TOOLS COVERED", value: "15+", sub: "Industry standard", icon: Code },
  { label: "CTF CHALLENGES", value: "30+", sub: "All difficulty levels", icon: Flag },
];

function StatsBar({ loaded }: { loaded: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <div
      ref={ref}
      className={`border-t border-b border-white/10 bg-[#0a0a0a] transition-all duration-700 delay-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="group relative px-6 py-8 border-r border-b border-white/10 last:border-r-0 md:last:border-r-0 md:[&:nth-child(2)]:border-r-0 md:[&:nth-child(4)]:border-r-0 flex flex-col items-start transition-all duration-300 hover:bg-white/[0.015]"
            >
              {/* Icon */}
              <div className="mb-3 w-9 h-9 rounded-xl border border-white/15 flex items-center justify-center text-white/60 group-hover:text-white/90 group-hover:border-white/25 transition-all">
                <Icon className="w-4 h-4" />
              </div>

              {/* Big number with animation */}
              <div className="font-mono text-4xl md:text-5xl font-bold text-white tracking-tighter mb-1 group-hover:text-emerald-400 transition-colors">
                <AnimatedCounter value={stat.value} inView={inView} />
              </div>

              {/* Label */}
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-white/50 mb-1">
                {stat.label}
              </div>

              {/* Sub */}
              <div className="font-mono text-xs text-white/60 group-hover:text-white/80 transition-colors">
                {stat.sub}
              </div>

              {/* Subtle bottom accent line on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recent Events Section (redesigned) ───────────────────────────
function RecentEvents({ meetings }: { meetings: Meeting[] }) {
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const now = new Date();

  const isMeetingLive = (meeting: Meeting): boolean => {
    const eventDate = parseLocalDate(meeting.date);

    // Same calendar day check (robust)
    if (
      eventDate.getFullYear() !== now.getFullYear() ||
      eventDate.getMonth() !== now.getMonth() ||
      eventDate.getDate() !== now.getDate()
    ) {
      return false;
    }

    const timeStr = (meeting.time || "").trim();
    if (!timeStr) return false;

    // Normalize: remove extra spaces, handle common dash variants
    const normalized = timeStr.replace(/\s*[-–—]\s*/g, " - ").replace(/\s+/g, " ");

    // Try to extract two time tokens
    const parts = normalized.split(" - ");
    if (parts.length !== 2) return false;

    const parseTimeToMinutes = (t: string): number | null => {
      let str = t.trim();

      // Handle common cases like "2:30PM" by inserting space before AM/PM if missing
      str = str.replace(/(\d)(AM|PM)$/i, "$1 $2");

      const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!m) return null;

      let hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const per = m[3]?.toUpperCase();

      if (per === "PM" && hh < 12) hh += 12;
      if (per === "AM" && hh === 12) hh = 0;

      return hh * 60 + mm;
    };

    const startMin = parseTimeToMinutes(parts[0]);
    const endMin = parseTimeToMinutes(parts[1]);

    if (startMin === null || endMin === null) return false;

    const nowMin = now.getHours() * 60 + now.getMinutes();

    // Small grace period after end
    return nowMin >= startMin && nowMin <= endMin + 10;
  };

  const isMeetingPast = (meeting: Meeting): boolean => {
    const eventDate = parseLocalDate(meeting.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) return true;
    if (eventDate > today) return false;

    // Same day: check if we're past the event's end time
    const timeStr = (meeting.time || "").trim();
    if (!timeStr) return false;

    const normalized = timeStr.replace(/\s*[-–—]\s*/g, " - ").replace(/\s+/g, " ");
    const parts = normalized.split(" - ");
    if (parts.length !== 2) return false;

    const parseTimeToMinutes = (t: string): number | null => {
      let str = t.trim();
      str = str.replace(/(\d)(AM|PM)$/i, "$1 $2");
      const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!m) return null;
      let hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const per = m[3]?.toUpperCase();
      if (per === "PM" && hh < 12) hh += 12;
      if (per === "AM" && hh === 12) hh = 0;
      return hh * 60 + mm;
    };

    const endMin = parseTimeToMinutes(parts[1]);
    if (endMin === null) return false;

    const nowMin = now.getHours() * 60 + now.getMinutes();

    return nowMin > endMin + 10;  // grace after end
  };

  if (meetings.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {meetings.map((meeting, idx) => {
        const isLive = isMeetingLive(meeting);
        const isPast = isMeetingPast(meeting);
        return (
          <EventCard
            key={meeting.id}
            meeting={meeting}
            isNew={!isLive && !isPast && idx === 0}
            isLive={isLive}
            parseLocalDate={parseLocalDate}
          />
        );
      })}
    </div>
  );
}

function EventCard({
  meeting,
  isNew,
  isLive = false,
  parseLocalDate,
}: {
  meeting: Meeting;
  isNew: boolean;
  isLive?: boolean;
  parseLocalDate: (dateStr: string) => Date;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const date = parseLocalDate(meeting.date);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });

  return (
    <Link
      to={`/dashboard?meeting=${meeting.slug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-xl transition-all duration-300 hover:border-white/25 hover:shadow-2xl"
    >
      {/* Mobile: Compact horizontal layout (space efficient) */}
      <div className="flex flex-row items-center gap-3 p-3 md:hidden">
        {/* Compact date */}
        <div className="text-center shrink-0 w-11 border border-white/15 rounded-lg p-1 group-hover:border-white/30 transition-colors">
          <div className="text-xl font-bold font-mono text-white">{day}</div>
          <div className="text-[9px] text-white/60 uppercase font-mono -mt-0.5">{month}</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`inline-block px-1.5 py-0 text-[9px] font-mono uppercase border ${TYPE_COLORS[meeting.type]}`}>
              {TYPE_LABELS[meeting.type]}
            </span>
            {isLive ? (
              <span className="text-[9px] font-mono uppercase text-red-400 animate-pulse">● LIVE</span>
            ) : isNew ? (
              <span className="text-[9px] font-mono uppercase text-emerald-400 animate-pulse">● NEW</span>
            ) : null}
          </div>
          <h3 className="text-white font-mono font-semibold text-sm truncate">{meeting.title}</h3>
          <div className="flex items-center gap-2 mt-0.5 text-white/60 font-mono text-[10px]">
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> {meeting.time}
            </span>
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="w-2.5 h-2.5" /> {meeting.location}
            </span>
          </div>
        </div>

        <ChevronRight className={`w-4 h-4 text-white/50 transition-all flex-shrink-0 ${isHovered ? "translate-x-0.5" : ""}`} />
      </div>

      {/* Desktop+: Rich vertical card with hover overlay */}
      <div className="hidden md:block">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            {/* Big date */}
            <div className="text-center shrink-0 w-14 border border-white/15 rounded-xl p-2 group-hover:border-white/30 transition-colors">
              <div className="text-3xl font-bold font-mono text-white leading-none">{day}</div>
              <div className="text-[10px] text-white/60 uppercase font-mono tracking-wider mt-0.5">{month}</div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase border ${TYPE_COLORS[meeting.type]}`}>
                  {TYPE_LABELS[meeting.type]}
                </span>
                {isLive ? (
                  <span className="text-[10px] font-mono uppercase text-red-400 animate-pulse">● LIVE</span>
                ) : isNew ? (
                  <span className="text-[10px] font-mono uppercase text-emerald-400 animate-pulse">● NEW</span>
                ) : null}
              </div>
              <h3 className="text-white font-mono font-semibold text-base leading-tight">{meeting.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/60 font-mono text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {meeting.time}
            </span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" /> {meeting.location}
            </span>
          </div>
        </div>


      </div>
    </Link>
  );
}

// ─── Learn Module Cards ──────────────────────────────
// ─── WHAT YOU'LL LEARN: x.ai-style interactive demos (cybersecurity themed) ──
function LearnModules() {
  return (
    <div className="space-y-2">
      {/* Scoped smooth waveform animations — zero JS cost, buttery 60fps */}
      <style>{`
        .waveform .waveform-bar {
          height: 35%;
          animation: waveform-pulse 1.35s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: bottom;
        }
        .waveform--energetic .waveform-bar {
          animation-duration: 0.72s;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes waveform-pulse {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1.05); }
        }
        /* slight random phase per bar via delay (already set in JSX) */
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <HackingFundamentalsDemo />
        <RealToolsDemo />
        <GetCertifiedDemo />
        <CTFCompetitionsDemo />
      </div>
    </div>
  );
}

// Reusable mic icon (used in CTF card)
const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 1v12m0 0c-2.21 0-4-1.79-4-4V5a4 4 0 118 0v4c0 2.21-1.79 4-4 4zm6-4v4a6 6 0 01-12 0V9" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <path d="M12 19v4" />
  </svg>
);

// ─── 01 HACKING FUNDAMENTALS ─────────────────────────────────
function HackingFundamentalsDemo() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    { role: "bot", text: "Recon is the first phase: passive OSINT then active scanning to map the target without tripping alarms." },
    { role: "bot", text: "After enumeration comes exploitation — turning a discovered weakness into a working foothold." },
  ]);
  const [isHovered, setIsHovered] = useState(false);

  // Fully autonomous: the card keeps teaching on its own
  useEffect(() => {
    const cycle = setInterval(() => {
      const autonomousLines = [
        "Recon is the first phase: passive OSINT then active scanning to map the target without tripping alarms.",
        "After enumeration comes exploitation — turning a discovered weakness into a working foothold.",
        "Post-exploitation is where real damage happens: pivoting, persistence, and covering tracks.",
        "Every great breach starts with patient, boring reconnaissance.",
      ];
      setMessages((prev) => {
        const next = autonomousLines[(prev.length + 1) % autonomousLines.length];
        // keep last 3 messages, add a new bot line
        const trimmed = prev.slice(-2);
        return [...trimmed, { role: "bot", text: next }];
      });
    }, 2800);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-xl transition-all duration-300 hover:border-white/30 hover:shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/40">
        <Shield className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-300 ${isHovered ? 'scale-110 rotate-6' : ''}`} />
        <span className="text-xs font-medium tracking-wide text-white/80">HACKING FUNDAMENTALS</span>
      </div>

      {/* Main content that dims on hover (pure opacity = smoother) */}
      <div className={`flex-1 px-3 pt-2 pb-4 text-[11px] text-white/60 font-sans transition-opacity duration-300 ${isHovered ? 'opacity-30' : 'opacity-100'}`}>
        Think like an attacker. Learn the full lifecycle: recon → scanning → exploitation → post-exploitation.
      </div>

      {/* Live self-updating conversation (no clicks needed) */}
      <div className={`p-3 space-y-2 min-h-[142px] text-sm bg-[#0a0a0a] font-sans transition-opacity duration-300 ${isHovered ? 'opacity-35' : 'opacity-100'}`}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[82%] px-3 py-1.5 text-xs leading-snug rounded-2xl bg-white/5 text-white/80 border border-white/10">
              {m.text}
            </div>
          </div>
        ))}
        <div className="text-[10px] text-emerald-400/60 mt-1">The card teaches itself — watch it evolve.</div>
      </div>

      {/* Centered Explore overlay — appears on hover, card is already dimmed */}
      <a
        href="/about#hacking-fundamentals"
        className={`group/explore absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-medium tracking-wider text-white/90">EXPLORE</span>
          <span className="inline-flex items-center gap-2 text-emerald-400 mt-1 text-sm">
            Hacking Fundamentals
            <ChevronRight className="w-5 h-5 transition-all duration-200 group-hover/explore:translate-x-2 group-hover/explore:scale-125 group-hover/explore:rotate-12" />
          </span>
        </div>
      </a>
    </div>
  );
}

// ─── 03 REAL TOOLS ───────────────────────────────────────────
function RealToolsDemo() {
  const [logs, setLogs] = useState(["Starting Nmap SYN scan", "Probing top 1000 ports", "Running service version detection"]);
  const [isHovered, setIsHovered] = useState(false);
  const [livePercent, setLivePercent] = useState(37);

  // The terminal runs itself — no clicks required (gentle, non-janky cadence)
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((current) => {
        const nextLines = [
          "22/tcp open  OpenSSH 8.9p1",
          "80/tcp open  Apache httpd 2.4.52",
          "443/tcp open  nginx 1.22",
          "Found potential RCE — CVE-2023-38408",
          "Generating HTML report...",
        ];
        const next = nextLines[current.length % nextLines.length];
        const updated = [...current.slice(-3), next];
        return updated;
      });
      setLivePercent((p) => (p > 94 ? 38 : p + 1.6));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const codeLines = [
    { num: 1, text: "$ nmap -sS -sV -sC --script vuln 10.0.4.17", hl: "" },
    { num: 2, text: "Starting Nmap 7.94 ( https://nmap.org )", hl: "" },
    { num: 3, text: "Nmap scan report for target", hl: "" },
    { num: 4, text: "PORT   STATE SERVICE  VERSION", hl: "" },
    { num: 5, text: "22/tcp open  ssh      OpenSSH 8.9", hl: "bg-emerald-950/50 text-emerald-400" },
    { num: 6, text: "VULN: CVE-2023-38408 (critical)", hl: "bg-red-950/50 text-red-400" },
  ];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-xl transition-all duration-300 hover:border-white/30 hover:shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-black/60 text-[10px]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex-1 text-center font-medium text-white/60 tracking-wider text-xs">real_tools.sh — live nmap</div>
        <div className={`text-emerald-400/80 tabular-nums transition-all ${isHovered ? 'text-emerald-400' : ''}`}>{Math.floor(livePercent)}%</div>
      </div>

      {/* Terminal area dims on hover (pure opacity) */}
      <div className={`p-3 bg-[#0a0a0a] font-mono text-[11px] leading-[1.35] text-white/80 overflow-hidden transition-opacity duration-300 ${isHovered ? 'opacity-25' : 'opacity-100'}`}>
        {codeLines.map((line, i) => (
          <div key={i} className={`flex items-center gap-3 px-1 py-px rounded ${line.hl}`}>
            <span className="text-white/30 w-6 text-right tabular-nums select-none">{line.num}</span>
            <span className="flex-1">{line.text}</span>
          </div>
        ))}
      </div>

      {/* Self-updating live log (no user input needed) */}
      <div className={`px-3 py-2 border-t border-white/10 bg-black/40 text-[10px] font-mono space-y-0.5 flex-1 transition-opacity duration-300 ${isHovered ? 'opacity-30' : 'opacity-100'}`}>
        {logs.map((log, i) => (
          <div key={i} className="flex items-center gap-2 text-white/70">
            <span className="text-emerald-400/70">▶</span>
            {log}
          </div>
        ))}
        <div className="pt-1 text-white/40">The scan never stops. Same tools the pros use every day.</div>
      </div>

      {/* Centered Explore overlay on hover */}
      <a
        href="/about#real-tools"
        className={`group/explore absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-medium tracking-wider text-white/90">EXPLORE</span>
          <span className="inline-flex items-center gap-2 text-emerald-400 mt-1 text-sm">
            Real Tools
            <ChevronRight className="w-5 h-5 transition-all duration-200 group-hover/explore:translate-x-2 group-hover/explore:scale-125 group-hover/explore:rotate-12" />
          </span>
        </div>
      </a>
    </div>
  );
}

// ─── 02 GET CERTIFIED ────────────────────────────────────────
function GetCertifiedDemo() {
  const [variants, setVariants] = useState([
    { label: "Security+ (SY0-701) — Core concepts & threats", seed: 1, displaySeed: 4821 },
    { label: "Network+ (N10-009) — Infrastructure & troubleshooting", seed: 2, displaySeed: 7193 },
    { label: "CySA+ — Threat detection & response", seed: 3, displaySeed: 3640 },
  ]);
  const [isHovered, setIsHovered] = useState(false);

  // Card studies on its own — cycles tracks automatically
  useEffect(() => {
    const autoStudy = setInterval(() => {
      const options = [
        "Security+ Domain 1: Attacks, Threats & Vulnerabilities",
        "Network+ — OSI model deep dive + subnetting labs",
        "CySA+ — SOC workflows, SIEM queries, incident response",
        "Security+ Domain 2: Architecture & Design",
        "Hands-on: Build your first lab network for the exam",
      ];
      setVariants((v) =>
        v.map((item, i) => ({
          label: options[(item.seed + i + 1) % options.length],
          seed: item.seed + 1,
          displaySeed: 1000 + ((item.displaySeed + 31) % 9000),
        }))
      );
    }, 3200);
    return () => clearInterval(autoStudy);
  }, []);

  const viz = (label: string, displaySeed: number, isBig = false) => (
    <div className={`relative flex items-center justify-center overflow-hidden bg-zinc-950 border border-white/10 ${isBig ? "aspect-[4/3]" : "aspect-video"} group/img transition-all duration-300 ${isHovered ? 'scale-[1.015] brightness-110' : ''}`}>
      <div className="absolute inset-0 bg-[radial-gradient(#222_0.6px,transparent_1px)] bg-[length:3px_3px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-500/10" />
      <div className="relative z-10 text-center px-3">
        <div className="text-[10px] uppercase tracking-[2px] text-white/40 mb-0.5">STUDY MODULE</div>
        <div className="text-xs text-white/90 leading-tight font-medium">{label}</div>
      </div>
      <div className="absolute bottom-2 right-2 text-[9px] text-emerald-400/60 font-mono">CERT {displaySeed}</div>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-xl transition-all duration-300 hover:border-white/30 hover:shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/40">
        <Flag className={`w-3.5 h-3.5 text-amber-400 transition-transform ${isHovered ? 'scale-110' : ''}`} />
        <span className="text-xs font-medium tracking-wide text-white/80">GET CERTIFIED</span>
      </div>

      {/* Description dims on hover */}
      <div className={`px-3 pt-2 text-[11px] text-white/60 font-sans transition-opacity duration-300 ${isHovered ? 'opacity-25' : 'opacity-100'}`}>
        Structured study groups for Security+, Network+, and CySA+. We help you actually pass and get hired.
      </div>

      {/* Self-cycling study visuals */}
      <div className={`p-2.5 bg-[#0a0a0a] grid grid-cols-3 gap-2 flex-1 transition-opacity duration-300 ${isHovered ? 'opacity-25' : 'opacity-100'}`}>
        <div className="col-span-2 row-span-2 rounded-xl overflow-hidden border border-white/10">
          {viz(variants[0].label, variants[0].displaySeed, true)}
        </div>
        <div className="rounded-xl overflow-hidden border border-white/10">
          {viz(variants[1].label, variants[1].displaySeed)}
        </div>
        <div className="rounded-xl overflow-hidden border border-white/10">
          {viz(variants[2].label, variants[2].displaySeed)}
        </div>
      </div>

      {/* Centered Explore that appears on hover */}
      <a
        href="/about#get-certified"
        className={`group/explore absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-medium tracking-wider text-white/90">EXPLORE</span>
          <span className="inline-flex items-center gap-2 text-amber-400 mt-1 text-sm">
            Get Certified
            <ChevronRight className="w-5 h-5 transition-all duration-200 group-hover/explore:translate-x-2 group-hover/explore:scale-125 group-hover/explore:rotate-12" />
          </span>
        </div>
      </a>
    </div>
  );
}

// ─── 04 CTF COMPETITIONS ─────────────────────────────────────
function CTFCompetitionsDemo() {
  const [transcript, setTranscript] = useState("Team found the SQLi…");
  const [flags, setFlags] = useState(2);
  const [isHovered, setIsHovered] = useState(false);

  // Lightweight autonomous life (stable, no re-subscribing hell)
  useEffect(() => {
    const chatter = setInterval(() => {
      const lines = [
        "Team found the SQLi…",
        "Bloodhound path to Domain Admin",
        "We got the last flag — 1st place!",
        "Defenders are patching… too late",
      ];
      setTranscript(lines[Math.floor(Math.random() * lines.length)]);
    }, 4800);

    const flagCapture = setInterval(() => {
      setFlags((f) => (Math.random() > 0.78 && f < 5 ? f + 1 : f));
    }, 5200);

    return () => {
      clearInterval(chatter);
      clearInterval(flagCapture);
    };
  }, []); // stable — no deps that restart timers

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-xl transition-all duration-300 hover:border-white/30 hover:shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/40">
        <Trophy className={`w-3.5 h-3.5 text-yellow-400 transition-transform duration-300 ${isHovered ? 'scale-110 rotate-12' : ''}`} />
        <span className="text-xs font-medium tracking-wide text-white/80">CTF COMPETITIONS</span>
      </div>

      <div className={`px-3 pt-2 text-[11px] text-white/60 font-sans transition-opacity duration-300 ${isHovered ? 'opacity-20' : 'opacity-100'}`}>
        Weekly internal challenges, monthly CTFs, $500+ in prizes, and the best bragging rights on campus.
      </div>

      {/* Smooth CSS-driven waveform — zero jank, GPU accelerated.
          Hover simply makes the existing animations more energetic via duration change. */}
      <div className={`flex-1 flex flex-col items-center justify-center gap-4 py-4 bg-[#0a0a0a] transition-all duration-300 ${isHovered ? 'opacity-30' : 'opacity-100'}`}>
        <div className={`flex items-end gap-[3px] h-14 px-4 waveform ${isHovered ? 'waveform--energetic' : ''}`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-[5px] rounded-full bg-gradient-to-t from-[#3b82f6] via-[#a855f7] to-[#ec4899] waveform-bar"
              style={{ animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>

        <div className="font-mono text-[10px] text-white/60 text-center max-w-[220px] min-h-[18px]">{transcript}</div>
        <div className={`text-[10px] font-mono transition-all ${isHovered ? 'text-yellow-400' : 'text-yellow-400/80'}`}>
          FLAGS CAPTURED: {flags} / 5
        </div>
        <div className="text-[10px] text-white/40">The competition never stops.</div>
      </div>

      {/* Big centered Explore revealed on hover */}
      <a
        href="/about#ctf-competitions"
        className={`group/explore absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-medium tracking-wider text-white/90">EXPLORE</span>
          <span className="inline-flex items-center gap-2 text-yellow-400 mt-1 text-sm">
            CTF Competitions
            <ChevronRight className="w-5 h-5 transition-all duration-200 group-hover/explore:translate-x-2 group-hover/explore:scale-125 group-hover/explore:rotate-12" />
          </span>
        </div>
      </a>
    </div>
  );
}

// ─── CTF Hackathon Teaser ────────────────────────────
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
      <SectionHeader index="05" title="FREQUENTLY ASKED QUESTIONS" />

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Usage info box */}
        <div className="border border-dashed border-gray-300 dark:border-matrix/30 p-6 relative group hover:border-green-400 dark:hover:border-matrix/40 transition-colors">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-300 dark:border-matrix/30 group-hover:border-green-500 dark:group-hover:border-matrix transition-colors" />

          <p className="font-mono text-xs text-gray-500 dark:text-matrix/50 mb-4">
            <span className="text-green-700 dark:text-matrix">$</span> read_faq
            --help
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
                  openIndex === index
                    ? "max-h-60 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="mx-3 mb-3 border-l-2 border-green-300 dark:border-matrix/30 pl-4">
                  <p className="font-mono text-xs text-gray-400 dark:text-matrix/40 mb-2">
                    <span className="text-green-700 dark:text-matrix">$</span>{" "}
                    echo{" "}
                    <span className="text-green-600 dark:text-matrix/70">
                      $ANSWER
                    </span>
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full text-left overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-xl transition-all duration-300 hover:border-white/25 hover:shadow-2xl focus:outline-none focus:ring-1 focus:ring-white/20
                 md:flex md:flex-col"
    >
      {/* ========== MOBILE: Compact horizontal layout (space efficient) ========== */}
      <div className="flex flex-row items-center gap-3 p-3 md:hidden">
        {/* Small photo */}
        {photo ? (
          <img
            src={photo}
            alt={name}
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            className={`w-14 h-14 flex-shrink-0 rounded-lg object-cover border border-white/15 transition-all ${isHovered ? "scale-105" : ""}`}
          />
        ) : (
          <Monogram
            name={name}
            className="w-14 h-14 flex-shrink-0 border border-white/15"
            textClassName="text-lg"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/60">
            {role}
            {altRole && <span className="text-white/40"> · {altRole}</span>}
          </div>
          <div className="font-mono font-semibold text-white text-base truncate">{name}</div>

          {/* Compact social icons */}
          {links && links.length > 0 && (
            <div className="flex gap-1.5 mt-1">
              {links.map((link, idx) => (
                <span
                  key={idx}
                  className="w-5 h-5 border border-white/15 flex items-center justify-center text-white/50"
                  aria-label={link.label}
                >
                  <link.icon className="w-3 h-3" />
                </span>
              ))}
            </div>
          )}
        </div>

        <ChevronRight className={`w-4 h-4 text-white/50 transition-all flex-shrink-0 ${isHovered ? "translate-x-0.5" : ""}`} />
      </div>

      {/* ========== DESKTOP / LARGE: Fancy vertical layout with big photo + centered overlay ========== */}
      <div className="hidden md:block">
        {/* Large photo area */}
        <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={name}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? "scale-105" : "scale-100"}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
              <Monogram
                name={name}
                className="w-20 h-20 border border-white/20"
                textClassName="text-3xl"
              />
            </div>
          )}

          {/* Role badge */}
          <div className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[1.5px] bg-black/70 border border-white/15 text-white/80">
            {role}
            {altRole && <span className="text-white/50"> · {altRole}</span>}
          </div>
        </div>

        {/* Content */}
        <div className={`p-4 transition-opacity duration-300 ${isHovered ? "opacity-20" : "opacity-100"}`}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono font-semibold text-white text-lg tracking-tight">{name}</p>
            {links && links.length > 0 && (
              <div className="flex gap-1.5 shrink-0">
                {links.map((link, idx) => (
                  <span
                    key={idx}
                    className="w-7 h-7 border border-white/15 flex items-center justify-center text-white/50 group-hover:border-white/30 transition-colors"
                    aria-label={link.label}
                  >
                    <link.icon className="w-3.5 h-3.5" />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Centered hover overlay (only on md+) */}
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center bg-black/50 transition-all duration-300 pointer-events-none ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium tracking-[3px] text-white/90">VIEW PROFILE</span>
            <span className="mt-1 inline-flex items-center gap-1 text-white/70 text-xs">
              {name.split(" ")[0]}
              <ChevronRight className="w-4 h-4 transition-all duration-200 group-hover:translate-x-1.5 group-hover:scale-125 group-hover:rotate-12" />
            </span>
          </div>
        </div>
      </div>
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
                  <div
                    key={entry.quarter}
                    className="flex items-baseline justify-between gap-2"
                  >
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
                  target={
                    link.href.startsWith("mailto:") ? undefined : "_blank"
                  }
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

// ─── Discord CTA Button ──────────────────────────────
const DISCORD_URL = "https://discord.gg/v5JWDrZVNp";

function DiscordButton() {
  const [copied, setCopied] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(DISCORD_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <a
      href={DISCORD_URL}
      target="_blank"
      rel="noopener noreferrer"
      onContextMenu={handleContextMenu}
      className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-medium text-black hover:bg-emerald-400 active:bg-emerald-600 transition-all w-full sm:w-auto"
      title="Right-click to copy invite link"
    >
      <Discord className="w-4 h-4 shrink-0" />
      <span
        className={`transition-all duration-200 ${copied ? "opacity-0" : "opacity-100"}`}
      >
        Join Discord
      </span>
      {copied && (
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-500 text-xs font-medium text-black">
          LINK COPIED!
        </span>
      )}
    </a>
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
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerData | null>(
    null,
  );
  const galleryRef = useRef<CircularGalleryHandle>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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
              <DiscordButton />
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 px-6 py-3 text-sm font-medium text-gray-800 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all w-full sm:w-auto"
              >
                View events
              </Link>
            </div>

            {/* Cycling status line */}
            <CyclingStatus />
          </div>

          {/* Scroll indicator */}
          <ScrollIndicator
            onClick={() =>
              contentRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          />
        </section>

        {/* ════════════════════════════════════════════
            STATS BAR
            ════════════════════════════════════════════ */}
        <StatsBar loaded={loaded} />

        {/* ════════════════════════════════════════════
            CONTENT SECTIONS
            ════════════════════════════════════════════ */}
        <div
          ref={contentRef}
          className="max-w-5xl mx-auto px-6 py-20 space-y-24"
        >
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
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all group"
                >
                  VIEW ALL EVENTS
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
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

          {/* ── OFFICERS ── */}
          <ScrollReveal delay={100}>
            <section>
              <SectionHeader
                index="03"
                title="CLUB LEADERSHIP"
                subtitle="The team running the club this quarter"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...OFFICERS]
                  .map((officer) => {
                    const currentEntry = officer.leadershipHistory.find(
                      (e) => e.quarter === CURRENT_QUARTER,
                    );
                    return {
                      officer,
                      role: currentEntry?.role ?? officer.role,
                      altRole: currentEntry?.altRole ?? officer.altRole,
                    };
                  })
                  .sort((a, b) => {
                    const ai = ROLE_ORDER.indexOf(a.role);
                    const bi = ROLE_ORDER.indexOf(b.role);
                    return (
                      (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
                    );
                  })
                  .map(({ officer, role, altRole }) => (
                    <OfficerCard
                      key={officer.name}
                      {...officer}
                      role={role}
                      altRole={altRole}
                      onClick={() => setSelectedOfficer(officer)}
                    />
                  ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ── FAQ ── */}
          <FAQSection loaded={loaded} />

          {/* ── GALLERY ── Only show on supported devices (lazy loaded) */}
          {supportsGallery && (
            <ScrollReveal delay={100}>
              <section>
                <SectionHeader
                  index="04"
                  title="THE EXPERIENCE"
                  subtitle="See our meetings for yourself"
                />

                {/* Full-bleed breakout from max-w-5xl container */}
                <div
                  className="relative w-screen left-1/2 -translate-x-1/2"
                  style={{ height: "600px" }}
                >
                  <Suspense fallback={null}>
                    <CircularGallery
                      ref={galleryRef}
                      bend={1}
                      textColor={resolvedTheme === "dark" ? "#ffffff" : "#000000"}
                      borderRadius={0.05}
                      scrollSpeed={2}
                      scrollEase={0.05}
                      disableScroll
                    />
                  </Suspense>
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
