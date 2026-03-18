import { useState, useEffect, useRef, useCallback } from "react";
// import { Link } from "react-router-dom";
import { Flag } from "@/lib/cyberIcon";
// import {
//   Calendar,
//   Clock,
//   MapPin,
//   Trophy,
//   Users,
//   Code,
//   ChevronDown,
//   Discord,
//   Shield,
// } from "@/lib/cyberIcon";

function FadeDigit({ value }: { value: number }) {
  const display = String(value).padStart(2, "0");
  const [visible, setVisible] = useState(display);
  const [fading, setFading] = useState(false);
  const prevRef = useRef(display);

  useEffect(() => {
    if (prevRef.current === display) return;
    setFading(true);
    const t = setTimeout(() => {
      setVisible(display);
      prevRef.current = display;
      setFading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [display]);

  return (
    <span
      style={{ transition: "opacity 200ms ease", opacity: fading ? 0 : 1 }}
    >
      {visible}
    </span>
  );
}

type DragOrigin = {
  mx: number; my: number;
  px: number; py: number;
  left: number; top: number;
  w: number; h: number;
};

function DraggableVersion() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const elRef = useRef<HTMLSpanElement>(null);
  const dragStart = useRef<DragOrigin | null>(null);

  const beginDrag = useCallback((mx: number, my: number) => {
    if (!elRef.current) return;
    const r = elRef.current.getBoundingClientRect();
    dragStart.current = {
      mx, my,
      px: pos.x, py: pos.y,
      // origin = where the element sits when pos = {0,0}
      left: r.left - pos.x,
      top: r.top - pos.y,
      w: r.width, h: r.height,
    };
    setDragging(true);
  }, [pos]);

  const applyMove = useCallback((mx: number, my: number) => {
    const d = dragStart.current;
    if (!d) return;
    const rawX = d.px + mx - d.mx;
    const rawY = d.py + my - d.my;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPos({
      x: Math.min(Math.max(rawX, -d.left), vw - d.left - d.w),
      y: Math.min(Math.max(rawY, -d.top), vh - d.top - d.h),
    });
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => applyMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => applyMove(e.touches[0].clientX, e.touches[0].clientY);
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, applyMove]);

  return (
    <span
      ref={elRef}
      onMouseDown={(e) => { e.preventDefault(); beginDrag(e.clientX, e.clientY); }}
      onTouchStart={(e) => beginDrag(e.touches[0].clientX, e.touches[0].clientY)}
      style={{
        display: "inline-block",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        cursor: dragging ? "grabbing" : "grab",
        animation: dragging ? "none" : "ctf-float 3s ease-in-out infinite",
        userSelect: "none",
      }}
      className="font-mono font-bold text-2xl md:text-3xl text-blue-400 dark:text-matrix/70 border border-blue-300 dark:border-matrix/40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm px-3 py-1 shadow-lg dark:shadow-matrix/10 mb-6"
    >
      v2.0
    </span>
  );
}

function CTF() {
  const [loaded, setLoaded] = useState(false);
  const [flagCaught, setFlagCaught] = useState(false);
  const [flagPressed, setFlagPressed] = useState(false);
  // const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const target = new Date("2026-05-15T12:00:00");
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // const faqs = [
  //   {
  //     question: "What is a CTF?",
  //     answer:
  //       'Capture The Flag (CTF) is a cybersecurity competition where participants solve security challenges to find "flags" - secret strings hidden in vulnerable systems. Our CTF features three tracks: Web Exploitation, OSINT, and Reverse Engineering.',
  //   },
  //   {
  //     question: "Do I need experience?",
  //     answer:
  //       "No! We welcome all skill levels. All three tracks include challenges designed for beginners, plus mentors will be on-site to help you learn. This is a great entry point into cybersecurity competitions.",
  //   },
  //   {
  //     question: "What should I bring?",
  //     answer:
  //       "Bring your laptop, charger, and enthusiasm! We recommend having a virtual machine with Kali Linux or similar security tools installed. We'll also provide setup guides before the event.",
  //   },
  //   {
  //     question: "Can I work in a team?",
  //     answer:
  //       "Yes! You can compete solo or in teams of up to 4 people. Teamwork is encouraged, especially for beginners. Find teammates on our Discord!",
  //   },
  //   {
  //     question: "What are the three tracks?",
  //     answer:
  //       "Web Exploitation focuses on finding vulnerabilities in web applications. OSINT (Open Source Intelligence) challenges you to gather information using publicly available data and resources. Reverse Engineering involves analyzing compiled programs and binaries to understand how they work and uncover hidden flags.",
  //   },
  //   {
  //     question: "What are the prizes?",
  //     answer:
  //       "Over $500 in prizes! 1st place wins the grand prize, with awards for 2nd and 3rd place teams. There may also be special category awards.",
  //   },
  // ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-matrix">
      <div className="crt-overlay dark:opacity-100 opacity-0" />

      {/* Full-page countdown hero */}
      <div
        className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000 py-24 ${loaded ? "opacity-100" : "opacity-0"}`}
      >
        {/* Background ASCII Art — matches App.tsx */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div className="dacc-bg-wrapper">
            <pre className="font-mono text-[clamp(60px,15vw,200px)] leading-[0.85] text-blue-200/20 dark:text-matrix/[0.03] whitespace-pre">
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

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,white_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_40%,#0a0a0a_100%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          {/* Mysterious label / easter egg message */}
          {flagCaught ? (
            <a
              href="https://discord.gg/v5JWDrZVNp"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs tracking-[0.2em] text-green-500 dark:text-matrix mb-10 uppercase hover:underline"
            >
              <Flag className="inline-block w-[1em] h-[1em] mr-1 align-middle" /> flag captured — your hacker skills are unmatched. click here to register. (don't tell anyone.)
            </a>
          ) : (
            <p className="font-mono text-xs tracking-[0.4em] text-gray-400 dark:text-matrix/40 mb-10 uppercase">
              something is coming
            </p>
          )}

          {/* v2.0 badge — above CAPTURE, draggable */}
          <DraggableVersion />

          {/* Title */}
          <div className="mb-16 select-none">
            <h1 className="font-mono font-bold text-blue-700 dark:text-matrix leading-tight">
              <span className="block text-6xl md:text-7xl lg:text-8xl tracking-tight">
                CAPTURE
              </span>
              <span className="block text-6xl md:text-7xl lg:text-8xl tracking-tight">
                THE{" "}
                <span
                  onClick={() => {
                    setFlagPressed(true);
                    setTimeout(() => setFlagPressed(false), 150);
                    setFlagCaught(true);
                  }}
                  style={{
                    transform: flagPressed ? "scale(0.93)" : "scale(1)",
                    transition: "transform 150ms ease",
                    cursor: "pointer",
                  }}
                  className="inline-flex items-center gap-2 bg-green-400 dark:bg-matrix text-white dark:text-terminal-bg px-2 py-0 leading-none"
                >
                  <Flag className="inline-block w-[0.85em] h-[0.85em] shrink-0" />
                  FLAG
                </span>
              </span>
            </h1>
          </div>

          {/* Animated Countdown */}
          <div className="grid grid-cols-4 gap-4 md:gap-6 mb-16">
            {[
              { value: countdown.days, label: "DAYS" },
              { value: countdown.hours, label: "HRS" },
              { value: countdown.minutes, label: "MIN" },
              { value: countdown.seconds, label: "SEC" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="border border-blue-300 dark:border-matrix/40 bg-blue-50 dark:bg-matrix/5 px-6 py-5 md:px-10 md:py-8 text-center backdrop-blur-sm"
              >
                <div className="text-5xl md:text-7xl font-bold font-mono text-blue-700 dark:text-matrix tabular-nums">
                  <FadeDigit value={value} />
                </div>
                <div className="text-[10px] md:text-xs text-gray-400 dark:text-matrix/40 font-terminal mt-2 tracking-widest">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Date hint */}
          <p className="font-mono text-xs tracking-[0.3em] text-gray-400 dark:text-matrix/30 uppercase mb-10">
            05 · 15 · 2026 &nbsp;·&nbsp; De Anza College
          </p>

          {/* Challenge #0 — hidden once flag is caught */}
          {!flagCaught && (
            <div className="border border-green-400 dark:border-matrix bg-green-50 dark:bg-matrix/10 px-6 py-5 max-w-lg w-full text-left mb-6">
              <p className="font-mono text-[10px] tracking-widest text-green-500 dark:text-matrix/60 uppercase mb-3">
                challenge_00.txt
              </p>
              <p className="font-mono text-sm text-green-800 dark:text-matrix leading-relaxed">
                <span className="text-green-500 dark:text-matrix/50">$</span> cat mission.txt
              </p>
              <p className="font-mono text-sm text-green-700 dark:text-matrix/80 leading-relaxed mt-2">
                Your first challenge has already begun.
              </p>
              <p className="font-mono text-sm text-green-600 dark:text-matrix/60 leading-relaxed mt-1">
                Find out how to register for the CTF.
              </p>
              <p className="font-mono text-xs text-green-400 dark:text-matrix/40 mt-4 animate-pulse">
                _ waiting for input...
              </p>
            </div>
          )}

          {/* FAQ */}
          <div className="max-w-lg w-full text-left space-y-px mt-2">
            {[
              {
                q: "How do I register?",
                a: flagCaught
                  ? "You already found it — nice work. Join our Discord and watch for the registration announcement."
                  : "[REDACTED] — figure it out.",
              },
              {
                q: "Is registration free?",
                a: "Yes, completely free for all participants.",
              },
              {
                q: "When does registration open?",
                a: "Registration details will be announced closer to the event. Stay tuned on Discord.",
              },
              {
                q: "Do I need a team to register?",
                a: "You can register solo or with a team of up to 4. Teams can be formed before or at the event.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border border-green-300 dark:border-matrix/30 bg-green-50 dark:bg-matrix/5">
                <div className="px-5 py-3 border-b border-green-200 dark:border-matrix/20 bg-green-100 dark:bg-matrix/10">
                  <p className="font-mono text-xs text-green-700 dark:text-matrix font-semibold">{q}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-xs text-green-600 dark:text-matrix/60 leading-relaxed">{a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Everything below is hidden until the event is closer ── */}

      {/* Stats Section */}
      {/* <section className={`py-20 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card-hack p-6 text-center group hover:border-blue-400 dark:hover:border-matrix/50 transition-all">
              <Trophy className="w-10 h-10 text-yellow-500 dark:text-matrix mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-bold text-yellow-600 dark:text-matrix mb-2">$500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-500 font-terminal">IN PRIZES</div>
            </div>
            <div className="card-hack p-6 text-center group hover:border-blue-400 dark:hover:border-matrix/50 transition-all">
              <Users className="w-10 h-10 text-blue-600 dark:text-matrix mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-bold text-blue-600 dark:text-matrix mb-2">100+</div>
              <div className="text-sm text-gray-600 dark:text-gray-500 font-terminal">PARTICIPANTS</div>
            </div>
            <div className="card-hack p-6 text-center group hover:border-blue-400 dark:hover:border-matrix/50 transition-all">
              <Code className="w-10 h-10 text-purple-600 dark:text-matrix mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-bold text-purple-600 dark:text-matrix mb-2">3</div>
              <div className="text-sm text-gray-600 dark:text-gray-500 font-terminal">TRACKS</div>
            </div>
            <div className="card-hack p-6 text-center group hover:border-blue-400 dark:hover:border-matrix/50 transition-all">
              <Clock className="w-10 h-10 text-green-600 dark:text-matrix mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-bold text-green-600 dark:text-matrix mb-2">6</div>
              <div className="text-sm text-gray-600 dark:text-gray-500 font-terminal">HOURS</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Hackathon Format Section */}
      {/* <section className={`pb-20 transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
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
              <span className="ml-4 text-xs text-gray-500 font-terminal">hackathon_info.md</span>
            </div>
            <div className="terminal-body space-y-6">
              <div>
                <h3 className="text-blue-600 dark:text-matrix font-bold mb-2">Format</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  This is a jeopardy-style CTF competition held in-person at De Anza College.
                  Participants will solve challenges across three tracks to earn points, with the
                  team accumulating the most points by the end of the competition winning.
                </p>
              </div>
              <div>
                <h3 className="text-blue-600 dark:text-matrix font-bold mb-2">Who Can Participate</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  The hackathon is open to students of all skill levels. Whether you're completely
                  new to cybersecurity or have prior CTF experience, there will be challenges suited
                  for you. Teams can have up to 4 members.
                </p>
              </div>
              <div>
                <h3 className="text-blue-600 dark:text-matrix font-bold mb-2">What to Expect</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Expect a full day of hacking, learning, and collaboration. Mentors will be
                  available to provide guidance, and there will be opportunities to network with
                  fellow cybersecurity enthusiasts. Food and refreshments will be provided.
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
      </section> */}

      {/* About / Tracks Section */}
      {/* <section className={`py-20 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-blue-600 dark:text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-600 dark:text-gray-400 font-terminal">ls ./challenge_tracks/</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-10 max-w-2xl mx-auto">
            Our CTF features three tracks designed for different skill sets and interests.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="terminal-window group hover:scale-[1.02] transition-transform">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">web_exploitation</span>
              </div>
              <div className="terminal-body">
                <h3 className="text-blue-600 dark:text-matrix font-bold mb-2 group-hover:text-blue-700 dark:group-hover:neon-text-subtle transition-all">
                  Web Exploitation
                </h3>
                <p className="text-gray-600 dark:text-gray-500 text-sm">
                  Find vulnerabilities in web applications through SQL injection, XSS, SSRF, and more.
                </p>
              </div>
            </div>
            <div className="terminal-window group hover:scale-[1.02] transition-transform">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">osint</span>
              </div>
              <div className="terminal-body">
                <h3 className="text-blue-600 dark:text-matrix font-bold mb-2 group-hover:text-blue-700 dark:group-hover:neon-text-subtle transition-all">
                  OSINT
                </h3>
                <p className="text-gray-600 dark:text-gray-500 text-sm">
                  Open Source Intelligence gathering - find hidden information using publicly available data and resources.
                </p>
              </div>
            </div>
            <div className="terminal-window group hover:scale-[1.02] transition-transform">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">reverse_engineering</span>
              </div>
              <div className="terminal-body">
                <h3 className="text-blue-600 dark:text-matrix font-bold mb-2 group-hover:text-blue-700 dark:group-hover:neon-text-subtle transition-all">
                  Reverse Engineering
                </h3>
                <p className="text-gray-600 dark:text-gray-500 text-sm">
                  Analyze compiled programs and binaries to understand their inner workings and uncover hidden flags.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      {/* <section className={`py-20 transition-all duration-700 delay-400 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="text-blue-600 dark:text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-600 dark:text-gray-400 font-terminal">cat /ctf/faq.md</span>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="card-hack overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-blue-50 dark:hover:bg-matrix/5 transition-colors"
                >
                  <span className="text-gray-900 dark:text-matrix font-semibold pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-blue-600 dark:text-matrix shrink-0 transition-transform duration-200 ${openFAQ === index ? "rotate-180" : ""}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${openFAQ === index ? "max-h-40" : "max-h-0"}`}>
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      {/* <section className={`py-20 transition-all duration-700 delay-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">register.sh</span>
            </div>
            <div className="terminal-body text-center py-12">
              <Trophy className="w-16 h-16 text-yellow-500 dark:text-matrix mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-matrix mb-4 neon-text-subtle">Event Starts In</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Saturday, May 15, 2026 · 12:00 PM – 6:00 PM · De Anza College
              </p>
              <div className="grid grid-cols-4 gap-4 max-w-xs mx-auto mb-8">
                {[
                  { value: countdown.days, label: "DAYS" },
                  { value: countdown.hours, label: "HRS" },
                  { value: countdown.minutes, label: "MIN" },
                  { value: countdown.seconds, label: "SEC" },
                ].map(({ value, label }) => (
                  <div key={label} className="border border-blue-300 dark:border-matrix/30 bg-blue-50 dark:bg-matrix/5 p-4 text-center">
                    <div className="text-3xl font-bold font-mono text-blue-700 dark:text-matrix tabular-nums">
                      {String(value).padStart(2, "0")}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-600 font-terminal mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href="https://discord.gg/v5JWDrZVNp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cli-btn-filled px-8 py-4 flex items-center gap-3"
                >
                  <Discord className="w-5 h-5" />
                  Join Discord for Updates
                </a>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
}

export default CTF;
