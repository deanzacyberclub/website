import { useState, useEffect, useRef } from "react";
import { Shield, Flag, Code, Trophy, Calendar, Clock, MapPin } from "@/lib/cyberIcon";
import { useInView } from "@/hooks/useInView";

// ─── iPhone Mockup ────────────────────────────────────
function PhoneMockup() {
  const [frame, setFrame] = useState(0);

  const screens = [
    {
      label: "Home",
      bg: "from-green-950 to-black",
      content: (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-white/80">dacc.club</span>
            <div className="w-4 h-4 rounded-full overflow-hidden bg-green-400/20 border border-green-400/30 flex items-center justify-center">
              <span className="text-[5px] text-green-300 font-bold">AM</span>
            </div>
          </div>
          <div className="text-[8px] text-white/50 uppercase tracking-widest mb-1">My Events</div>
          {["Tomorrow · Workshop", "Apr 15 · CTF Prep"].map((e, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center shrink-0">
                <Code className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-[7px] text-white/70">{e}</span>
            </div>
          ))}
          <div className="text-[8px] text-white/50 uppercase tracking-widest mt-3 mb-1">My Stats</div>
          <div className="grid grid-cols-2 gap-1.5">
            {[["Attendance", "87%"], ["Rank", "#4"]].map(([label, val]) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                <div className="text-[14px] font-bold text-green-400">{val}</div>
                <div className="text-[6px] text-white/40 uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Events",
      bg: "from-slate-900 to-black",
      content: (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-white/80">Events</span>
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-[8px]">🔍</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Workshop", color: "bg-cyan-500/20 border-cyan-500/30", icon: "💻", text: "text-cyan-300" },
              { label: "CTF", color: "bg-red-500/20 border-red-500/30", icon: "🚩", text: "text-red-300" },
              { label: "Lecture", color: "bg-yellow-500/20 border-yellow-500/30", icon: "💬", text: "text-yellow-300" },
              { label: "Social", color: "bg-indigo-500/20 border-indigo-500/30", icon: "👥", text: "text-indigo-300" },
            ].map(({ label, color, icon, text }) => (
              <div key={label} className={`${color} border rounded-xl p-2.5 flex flex-col gap-1`}>
                <span className="text-base leading-none">{icon}</span>
                <span className={`text-[8px] font-bold ${text}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className="text-[8px] text-white/50 uppercase tracking-widest mt-2 mb-1">Upcoming</div>
          {["Burp Suite Deep Dive", "CTF 2.0 · May 15"].map((e, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-2">
              <span className="text-[7px] text-white/70">{e}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "Meeting",
      bg: "from-zinc-900 to-black",
      content: (
        <div className="p-3">
          <div className="mb-3">
            <div className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Workshop</div>
            <div className="text-[11px] font-bold text-white leading-tight">Burp Suite: Web App Hacking</div>
          </div>
          <div className="space-y-1.5 mb-3">
            {[
              { Icon: Calendar, val: "Monday, Apr 28" },
              { Icon: Clock, val: "2:30 – 4:00 PM" },
              { Icon: MapPin, val: "ATC Room 205" },
            ].map(({ Icon, val }) => (
              <div key={val} className="flex items-center gap-2">
                <Icon className="w-2.5 h-2.5 text-green-400 shrink-0" />
                <span className="text-[7px] text-white/60">{val}</span>
              </div>
            ))}
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2 mb-2">
            <div className="text-[6px] text-green-400 uppercase tracking-widest mb-1">Checklist</div>
            {["Laptop required", "Kali Linux preferred", "Beginner friendly"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded border border-green-500/40 flex items-center justify-center">
                  <div className="w-1 h-1 bg-green-400 rounded-sm" />
                </div>
                <span className="text-[6px] text-white/50">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-white text-black rounded-xl py-1.5 text-center">
            <span className="text-[8px] font-bold">Register Now</span>
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % screens.length), 3000);
    return () => clearInterval(id);
  }, [screens.length]);

  const current = screens[frame];

  return (
    <div className="relative mx-auto" style={{ width: 200, height: 420 }}>
      {/* Phone shell */}
      <div
        className="absolute inset-0 rounded-[36px] border-[6px] border-white/10 bg-black shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 0 60px rgba(0,255,65,0.08), 0 40px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-16 h-4 bg-black rounded-full" />

        {/* Screen */}
        <div className={`absolute inset-0 bg-gradient-to-b ${current.bg} transition-all duration-700`}>
          <div className="absolute inset-0 pt-8">
            <div
              className="transition-all duration-500"
              style={{ opacity: 1 }}
              key={frame}
            >
              {current.content}
            </div>
          </div>
        </div>

        {/* Home bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full" />
      </div>

      {/* Glow */}
      <div
        className="absolute inset-0 rounded-[36px] pointer-events-none"
        style={{ boxShadow: "0 0 80px rgba(0,255,65,0.06)" }}
      />
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className="border border-gray-200 dark:border-white/[0.06] p-5 bg-white dark:bg-white/[0.02] hover:border-green-500 dark:hover:border-white/10 hover:bg-green-50/30 dark:hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.2s, background-color 0.2s`,
      }}
    >
      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-transparent group-hover:border-green-400 dark:group-hover:border-white/20 transition-colors duration-300" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-transparent group-hover:border-green-400 dark:group-hover:border-white/20 transition-colors duration-300" />

      <div className="w-9 h-9 border border-gray-200 dark:border-white/10 bg-green-50 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:border-green-400 dark:group-hover:border-white/20 transition-colors">
        <Icon className="w-4 h-4 text-gray-500 dark:text-white/40 group-hover:text-green-700 dark:group-hover:text-white/70 transition-colors" />
      </div>
      <h3 className="font-mono text-sm font-bold text-green-700 dark:text-white/80 uppercase mb-2 tracking-wide">
        {title}
      </h3>
      <p className="font-mono text-xs text-gray-500 dark:text-white/30 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

// ─── Scrolling Feature Ticker ─────────────────────────
const TICKER_ITEMS = [
  "EVENTS & MEETINGS",
  "CTF COMPETITIONS",
  "LIVE ATTENDANCE",
  "PUSH NOTIFICATIONS",
  "MEMBER PROFILES",
  "CATEGORY SEARCH",
  "DEEP LINKS",
  "ONBOARDING",
];

function FeatureTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden border-t border-b border-gray-200 dark:border-white/[0.06] py-3 my-16">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{ animation: "ticker 20s linear infinite" }}
      >
        {items.map((item, i) => (
          <span key={i} className="font-mono text-xs text-gray-400 dark:text-white/20 uppercase tracking-widest shrink-0 flex items-center gap-4">
            {item}
            <span className="text-green-500 dark:text-white/10">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Dot grid background ──────────────────────────────
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.025]"
      style={{
        backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    />
  );
}

// ─── Screen Indicator ─────────────────────────────────
function ScreenDots({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex gap-1.5 justify-center mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-green-500 dark:bg-white/60" : "w-1.5 bg-gray-300 dark:bg-white/15"}`}
        />
      ))}
    </div>
  );
}

// ─── Animated phone with dots ─────────────────────────
function PhoneSection() {
  const [frame, setFrame] = useState(0);
  const count = 3;

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % count), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <PhoneMockup />
      <ScreenDots count={count} active={frame} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
const features = [
  {
    icon: Calendar,
    title: "Events & Meetings",
    desc: "Browse upcoming workshops, CTFs, and club meetings. Register with one tap and get reminders.",
  },
  {
    icon: Trophy,
    title: "CTF 2.0",
    desc: "Track the annual DACC Capture the Flag event, view challenges, and follow the leaderboard.",
  },
  {
    icon: Shield,
    title: "Attendance Tracking",
    desc: "Check in to meetings via QR code and watch your attendance streak grow in real time.",
  },
  {
    icon: Flag,
    title: "Push Notifications",
    desc: "Never miss a meeting. Get notified about new events, announcements, and CTF updates.",
  },
  {
    icon: Code,
    title: "Member Profiles",
    desc: "Connect with other members, see their roles, and view club leadership history.",
  },
  {
    icon: MapPin,
    title: "Deep Links",
    desc: "Share meeting links that open directly in the app to the exact event detail view.",
  },
];

export default function AppPromo() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const phoneY = Math.min(scrollY * 0.12, 40);

  return (
    <div className="bg-white dark:bg-[#080808] text-gray-900 dark:text-white min-h-screen overflow-x-hidden">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-fade { animation: fadeUp 0.8s ease both; }
        .hero-fade-1 { animation-delay: 0.1s; }
        .hero-fade-2 { animation-delay: 0.25s; }
        .hero-fade-3 { animation-delay: 0.4s; }
        .hero-fade-4 { animation-delay: 0.55s; }
      `}</style>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 overflow-hidden"
      >
        <DotGrid />

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500/[0.04] dark:bg-green-400/[0.04] blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16 lg:gap-24 max-w-6xl mx-auto w-full">
          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left max-w-xl">
            {/* Badge */}
            <div className="hero-fade hero-fade-1 inline-flex items-center gap-2 border border-gray-200 dark:border-white/10 px-3 py-1.5 mb-8 font-mono text-xs text-gray-500 dark:text-white/40 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Available on TestFlight
            </div>

            <h1 className="hero-fade hero-fade-2 font-mono font-black text-5xl md:text-6xl lg:text-7xl leading-[0.95] text-gray-900 dark:text-white mb-6">
              DACC
              <br />
              <span className="text-green-600 dark:text-green-400">IN YOUR</span>
              <br />
              POCKET.
            </h1>

            <p className="hero-fade hero-fade-3 font-mono text-sm text-gray-500 dark:text-white/40 leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              The official De Anza Cybersecurity Club app. Track meetings,
              check in to events, compete in CTFs, and stay connected with the club — all from your iPhone.
            </p>

            <div className="hero-fade hero-fade-4 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a
                href="https://testflight.apple.com/join/dacc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-gray-900 dark:bg-white text-white dark:text-black font-mono text-sm font-bold px-6 py-3 hover:bg-gray-700 dark:hover:bg-white/90 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04l-.07.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Join TestFlight
              </a>
              <a
                href="/meetings"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60 font-mono text-sm px-6 py-3 hover:border-green-500 dark:hover:border-white/30 hover:text-green-700 dark:hover:text-white/80 transition-colors"
              >
                [ View events ]
              </a>
            </div>
          </div>

          {/* Right: phone */}
          <div
            className="shrink-0 lg:flex-1 flex justify-center lg:justify-end"
            style={{ transform: `translateY(${phoneY}px)`, transition: "transform 0.1s linear" }}
          >
            <PhoneSection />
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400 dark:text-white/30">Scroll</span>
          <svg className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── TICKER ── */}
      <FeatureTicker />

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="border-b border-dashed border-gray-200 dark:border-white/[0.06] pb-8 mb-12">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-gray-300 dark:text-white/10">[01]</span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.04]" />
            <h2 className="font-mono text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase">
              EVERYTHING<br className="md:hidden" /> YOU NEED
            </h2>
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.04]" />
            <span className="font-mono text-xs text-gray-300 dark:text-white/10">[01]</span>
          </div>
          <p className="font-mono text-xs text-gray-400 dark:text-white/20 text-center mt-4 uppercase tracking-widest">
            Built for De Anza Cybersecurity Club members
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ── CTF CALLOUT ── */}
      <section className="border-t border-gray-100 dark:border-white/[0.04] bg-gray-50 dark:bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-20 h-20 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
              <Trophy className="w-9 h-9 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="font-mono text-xs text-green-600 dark:text-green-400 uppercase tracking-widest mb-2">
                Coming May 15, 2026
              </div>
              <h3 className="font-mono text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase mb-3">
                CTF 2.0 — Track it in the app
              </h3>
              <p className="font-mono text-xs text-gray-500 dark:text-white/30 leading-relaxed max-w-lg">
                The app will have live CTF 2.0 updates, challenge tracking, and leaderboard scores pushed directly to your iPhone.
              </p>
            </div>
            <a
              href="/ctf"
              className="shrink-0 font-mono text-sm border border-gray-200 dark:border-white/10 px-6 py-3 text-gray-700 dark:text-white/50 hover:border-green-500 dark:hover:border-white/30 hover:text-green-700 dark:hover:text-white/80 transition-colors whitespace-nowrap"
            >
              Learn more →
            </a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden">
        <DotGrid />
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-32 text-center">
          <div className="font-mono text-xs text-gray-400 dark:text-white/20 uppercase tracking-widest mb-6">
            iOS · Free · TestFlight Beta
          </div>
          <h2 className="font-mono font-black text-4xl md:text-5xl lg:text-6xl text-gray-900 dark:text-white uppercase leading-tight mb-8">
            JOIN THE CLUB.<br />
            <span className="text-green-600 dark:text-green-400">DOWNLOAD THE APP.</span>
          </h2>
          <a
            href="https://testflight.apple.com/join/dacc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-black font-mono text-sm font-bold px-8 py-4 hover:bg-gray-700 dark:hover:bg-white/90 transition-colors"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04l-.07.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download on TestFlight
          </a>
          <p className="font-mono text-xs text-gray-400 dark:text-white/20 mt-6">
            Requires iOS 18.0 or later · iPhone only
          </p>
        </div>
      </section>
    </div>
  );
}
