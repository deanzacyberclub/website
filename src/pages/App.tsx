import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Discord,
  Calendar,
  Document,
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
} from "@/lib/cyberIcon";
import { supabase } from "@/lib/supabase";
import { TYPE_COLORS, TYPE_LABELS } from "./Meetings";
import type { Meeting } from "@/types/database.types";

const prefetchMeetings = () => import("./Meetings");

// Matrix rain characters
const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}=/\\|";

interface SwipeableCardsProps {
  meetings: Meeting[];
}

function SwipeableCards({ meetings }: SwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  const SWIPE_THRESHOLD = 80;

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    startX.current = clientX;
    startY.current = clientY;
  }, []);

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const diff = clientX - startX.current;
      setDragOffset(diff);
    },
    [isDragging],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      const direction = dragOffset > 0 ? "right" : "left";
      // Instantly switch to next card
      if (direction === "left" && currentIndex < meetings.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (direction === "right" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, currentIndex, meetings.length]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleDragMove(e.clientX);
    },
    [handleDragMove],
  );

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (meetings.length === 0) {
    return (
      <div className="card-hack rounded-lg p-8 text-center">
        <p className="text-gray-500">No recent events</p>
      </div>
    );
  }

  const meeting = meetings[currentIndex];
  const rotation = dragOffset * 0.08;
  const opacity = 1 - Math.abs(dragOffset) / 300;

  const transform = `translateX(${dragOffset}px) rotate(${rotation}deg)`;

  return (
    <div className="relative">
      {/* Card stack visual - cards behind */}
      {meetings.slice(currentIndex + 1, currentIndex + 3).map((_, idx) => (
        <div
          key={idx}
          className="absolute inset-0 card-hack rounded-lg"
          style={{
            transform: `scale(${1 - (idx + 1) * 0.05}) translateY(${(idx + 1) * 8}px)`,
            opacity: 0.5 - idx * 0.2,
            zIndex: -idx - 1,
          }}
        />
      ))}

      {/* Main swipeable card */}
      <div
        ref={cardRef}
        className={`card-hack rounded-lg p-5 cursor-grab active:cursor-grabbing select-none ${
          isDragging ? "" : "transition-all duration-150 ease-out"
        }`}
        style={{
          transform,
          opacity,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicators */}
        <div
          className="absolute top-4 left-4 px-3 py-1 rounded border-2 border-red-500 text-red-500 font-bold text-sm rotate-[-20deg] transition-opacity"
          style={{
            opacity:
              dragOffset < -30
                ? Math.min(1, Math.abs(dragOffset + 30) / 70)
                : 0,
          }}
        >
          NEXT
        </div>
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded border-2 border-matrix text-matrix font-bold text-sm rotate-[20deg] transition-opacity"
          style={{
            opacity: dragOffset > 30 ? Math.min(1, (dragOffset - 30) / 70) : 0,
          }}
        >
          PREV
        </div>

        <Link
          to={`/meetings/${meeting.slug}`}
          className="block"
          onClick={(e) => isDragging && e.preventDefault()}
        >
          {/* Date Box */}
          <div className="flex items-start gap-4 mb-3">
            <div className="text-center shrink-0 w-14">
              <div className="text-3xl font-bold text-matrix">
                {new Date(meeting.date).getDate()}
              </div>
              <div className="text-xs text-gray-500 uppercase font-terminal">
                {new Date(meeting.date).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}
                >
                  {TYPE_LABELS[meeting.type]}
                </span>
              </div>
            </div>
          </div>

          {/* Meeting Info */}
          <h3 className="text-matrix font-semibold text-xl mb-2">
            {meeting.title}
          </h3>
          <p className="text-gray-500 text-sm mb-4 line-clamp-3">
            {meeting.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {meeting.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {meeting.location}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {meetings.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex
                ? "bg-matrix w-4"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          />
        ))}
      </div>

      {/* Swipe hint */}
      <p className="text-center text-xs text-gray-600 mt-3 font-terminal">
        Swipe or drag to browse events
      </p>
    </div>
  );
}

const faqs = [
  {
    question: "Do I need prior experience?",
    answer:
      "Not at all! We welcome complete beginners. Our workshops start from the basics and build up. All you need is curiosity and willingness to learn.",
  },
  {
    question: "When and where do you meet?",
    answer:
      "We meet weekly during the academic quarter at De Anza College. Check our Events page for the current schedule and room locations.",
  },
  {
    question: "What will I learn?",
    answer:
      "Everything from networking fundamentals and Linux basics to penetration testing, CTF competitions, and industry certifications like Security+ and Network+.",
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
      className={`mt-16 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-matrix neon-text-subtle text-lg">$</span>
        <span className="text-gray-400 font-terminal">cat /etc/faq.md</span>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={index} className="card-hack rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-5 text-left flex items-center justify-between hover:bg-matrix/5 transition-colors"
            >
              <span className="text-matrix font-semibold pr-4">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-matrix shrink-0 transition-transform duration-200 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                openIndex === index ? "max-h-40" : "max-h-0"
              }`}
            >
              <div className="px-5 pb-5">
                <p className="text-gray-400 leading-relaxed text-sm">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MatrixRain() {
  const columns = useMemo(() => {
    const cols = [];
    const columnCount = Math.floor(window.innerWidth / 20);
    for (let i = 0; i < columnCount; i++) {
      const chars = Array.from(
        { length: Math.floor(Math.random() * 20) + 10 },
        () => matrixChars[Math.floor(Math.random() * matrixChars.length)],
      ).join("");
      cols.push({
        left: `${(i / columnCount) * 100}%`,
        animationDuration: `${Math.random() * 10 + 8}s`,
        animationDelay: `${Math.random() * 5}s`,
        chars,
      });
    }
    return cols;
  }, []);

  return (
    <div className="matrix-rain">
      {columns.map((col, i) => (
        <div
          key={i}
          className="matrix-column"
          style={{
            left: col.left,
            animationDuration: col.animationDuration,
            animationDelay: col.animationDelay,
          }}
        >
          {col.chars}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [loaded, setLoaded] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    setLoaded(true);
    fetchRecentMeetings();
  }, []);

  const fetchRecentMeetings = async () => {
    try {
      const { data } = await supabase
        .from("meetings")
        .select("*")
        .order("date", { ascending: false })
        .limit(4);

      if (data) setRecentMeetings(data);
    } catch (err) {
      console.error("Error fetching recent meetings:", err);
    }
  };

  const renderContent = () => (
    <div className="relative">
      {/* Hero Section - Full Viewport */}
      <section
        className={`min-h-screen flex items-center justify-center transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div>
              <div className="mb-8">
                <div className="mb-4">
                  <span className="text-matrix font-terminal text-sm uppercase tracking-wider border border-matrix/40 px-3 py-1.5 rounded-md inline-block">
                    De Anza Cybersecurity Club
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                  <span className="text-white">Learn to</span>
                  <br />
                  <span className="glitch neon-text" data-text="hack">
                    hack
                  </span>
                </h1>
                <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8">
                  Break into cybersecurity with hands-on workshops, earn
                  industry certifications, and join a crew of future security
                  professionals. No experience required! We'll teach you
                  everything from the ground up. All you need is curiosity.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://discord.gg/v5JWDrZVNp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hack-filled rounded-lg px-8 py-4 text-lg flex items-center gap-3"
                >
                  <Discord className="w-5 h-5" />
                  Join Discord
                </a>
              </div>
            </div>

            {/* Right side - Recent Events Cards */}
            <div className="relative w-full max-w-sm mx-auto md:mx-0">
              <h3 className="text-gray-400 text-sm font-terminal mb-4 uppercase tracking-wider">
                Recent Events
              </h3>
              <SwipeableCards meetings={recentMeetings} />
              <Link
                to="/meetings"
                className="block w-full btn-hack rounded-lg p-4 text-center group hover:scale-[1.01] transition-transform mt-4"
                onMouseEnter={prefetchMeetings}
                onFocus={prefetchMeetings}
              >
                <div className="flex items-center justify-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold text-sm">VIEW ALL EVENTS</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Club Officers Section */}
        <section
          className={`mb-16 transition-all duration-700 delay-375 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">
              cat /etc/officers.conf
            </span>
          </div>

          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                club_leadership
              </span>
            </div>
            <div className="terminal-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* President */}
                <div className="card-hack p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src="/neel-anshu.jpeg"
                      alt="Neel Anshu"
                      className="w-10 h-10 rounded-lg border border-matrix/40 object-cover"
                    />
                    <div>
                      <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">
                        President
                      </p>
                      <p className="text-matrix font-semibold">Neel Anshu</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-13">
                    <a
                      href="https://github.com/boredcreator"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <GitHub className="w-4 h-4" />
                    </a>
                    <a
                      href="https://instagram.com/neel_reddy455"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                    <a
                      href="https://flippedbyneel.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Vice President */}
                <div className="card-hack p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src="/aaron-ma.jpeg"
                      alt="Aaron Ma"
                      className="w-10 h-10 rounded-lg border border-matrix/40 object-cover"
                    />
                    <div>
                      <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">
                        Vice President
                      </p>
                      <p className="text-matrix font-semibold">Aaron Ma</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-13">
                    <a
                      href="https://github.com/aaronhma"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <GitHub className="w-4 h-4" />
                    </a>
                    <a
                      href="https://x.com/aaronhma"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/air-rn/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <LinkedIn className="w-4 h-4" />
                    </a>
                    <a
                      href="mailto:hi@aaronhma.com"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    <a
                      href="https://aaronhma.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Officer - Thant Thu Hein */}
                <div className="card-hack p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center">
                      <Code className="w-5 h-5 text-matrix" />
                    </div>
                    <div>
                      <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">
                        Outreach Manager
                      </p>
                      <p className="text-matrix font-semibold">
                        Thant Thu Hein
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-13">
                    <a
                      href="https://www.instagram.com/butter.daxxton"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded bg-terminal-alt border border-gray-700 flex items-center justify-center hover:border-matrix hover:text-matrix transition-all text-gray-500"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Officer - Mobin Norouzi */}
                <div className="card-hack p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-matrix/20 border border-matrix/40 flex items-center justify-center">
                      <Code className="w-5 h-5 text-matrix" />
                    </div>
                    <div>
                      <p className="text-xs text-hack-cyan font-terminal uppercase tracking-wider">
                        Curriculum Lead
                      </p>
                      <p className="text-matrix font-semibold">Mobin Norouzi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section
          className={`transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">
              ls -la ./what-youll-learn/
            </span>
          </div>

          <div className="space-y-4">
            <div className="card-hack p-5 rounded-lg group">
              <div className="flex items-start gap-4">
                <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">
                  01
                </div>
                <div>
                  <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                    hacking_fundamentals.sh
                  </h3>
                  <p className="text-sm text-gray-500">
                    Think like an attacker. Learn reconnaissance, exploitation,
                    and how real breaches happen.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-hack p-5 rounded-lg group">
              <div className="flex items-start gap-4">
                <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">
                  02
                </div>
                <div>
                  <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                    get_certified.sh
                  </h3>
                  <p className="text-sm text-gray-500">
                    Study groups for Security+, Network+, and more. Land your
                    first cybersecurity job.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-hack p-5 rounded-lg group">
              <div className="flex items-start gap-4">
                <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">
                  03
                </div>
                <div>
                  <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                    real_tools.sh
                  </h3>
                  <p className="text-sm text-gray-500">
                    Get hands-on with Burp Suite, Nmap, Wireshark,
                    Metasploit—the same tools pros use.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-hack p-5 rounded-lg group">
              <div className="flex items-start gap-4">
                <div className="text-matrix text-2xl font-terminal opacity-50 group-hover:opacity-100 transition-opacity">
                  04
                </div>
                <div>
                  <h3 className="font-semibold text-matrix mb-1 group-hover:neon-text-subtle transition-all">
                    ctf_competitions.sh
                  </h3>
                  <p className="text-sm text-gray-500">
                    Compete in capture-the-flag events. Solve puzzles. Win
                    bragging rights (and prizes).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTF Hackathon Teaser */}
        <section
          className={`mt-16 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <Link to="/ctf" className="block group">
            <div className="relative overflow-hidden rounded-xl border border-matrix/30 bg-gradient-to-br from-terminal-bg via-matrix/5 to-terminal-bg p-8 hover:border-matrix/60 transition-all">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="shrink-0">
                  <div className="w-20 h-20 rounded-xl bg-matrix/20 border border-matrix/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy className="w-10 h-10 text-matrix" />
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-terminal bg-matrix/20 border border-matrix/40 text-matrix animate-pulse">
                      COMING SOON
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-matrix transition-colors">
                    DACC Capture The Flag
                  </h3>
                  <p className="text-gray-400 mb-4">
                    A full-day cybersecurity competition with $500+ in prizes,
                    30+ challenges, and hackers of all skill levels welcome.
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-matrix" />
                      TBA 2025
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-matrix" />
                      De Anza College
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-matrix" />6 Hours
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <div className="flex items-center gap-2 text-matrix group-hover:translate-x-1 transition-transform">
                    <span className="font-terminal text-sm">Learn More</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* FAQ Section */}
        <FAQSection loaded={loaded} />
      </div>
    </div>
  );

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* CRT Scanline Overlay */}
      <div className="crt-overlay" />

      {/* Main Content */}
      <div className="relative z-10">{renderContent()}</div>
    </div>
  );
}

export default App;
