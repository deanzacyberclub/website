import { useState, useEffect, useRef, useCallback } from "react";
import { Flag } from "@/lib/cyberIcon";

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
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [eventPassed, setEventPassed] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const target = new Date("2026-05-15T12:00:00");
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setEventPassed(true);
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
              href="https://discord.gg/MEtzjYFts2"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs tracking-[0.2em] text-green-500 dark:text-matrix mb-10 uppercase hover:underline"
            >
              <Flag className="inline-block w-[1em] h-[1em] mr-1 align-middle" /> Flag captured — nice work. Click here to join the Discord and be first to hear about registration.
            </a>
          ) : (
            <p className="font-mono text-xs tracking-[0.4em] text-gray-400 dark:text-matrix/40 mb-10 uppercase">
              {eventPassed ? "The next CTF is in the works" : "Something is coming"}
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

          {/* Animated countdown — replaced with a wrap-up note once the event date passes */}
          {eventPassed ? (
            <div className="border border-blue-300 dark:border-matrix/40 bg-blue-50 dark:bg-matrix/5 px-8 py-6 md:px-12 md:py-8 text-center backdrop-blur-sm mb-16 max-w-lg">
              <p className="font-mono text-sm md:text-base text-blue-700 dark:text-matrix leading-relaxed">
                The Spring 2026 CTF has wrapped — thanks to everyone who
                competed. The next event is being planned now.
              </p>
            </div>
          ) : (
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
          )}

          {/* Date hint */}
          <p className="font-mono text-xs tracking-[0.3em] text-gray-400 dark:text-matrix/30 uppercase mb-10">
            {eventPassed
              ? "Next event · To be announced"
              : "05 · 15 · 2026 · De Anza College"}
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
                  : "Registration announcements go out on our Discord first. There's also a small challenge hidden on this page — capturing it counts as a head start.",
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

    </div>
  );
}

export default CTF;
