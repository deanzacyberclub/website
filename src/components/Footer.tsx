import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  type CSSProperties,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import type { Theme } from "@/contexts/ThemeContext";
import { ChevronDown } from "@/lib/cyberIcon";

interface FooterProps {
  className?: string;
}

const THEME_OPTIONS: { id: Theme; icon: string; label: string }[] = [
  { id: "light", icon: "☀️", label: "LIGHT" },
  { id: "dark", icon: "🌙", label: "DARK" },
  { id: "system", icon: "💻", label: "AUTO" },
];

const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { className = "" },
  ref,
) {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Dropdown state for theme selector
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentTheme = THEME_OPTIONS.find((t) => t.id === theme)!;

  // TODO: keep transparent for now, eventually remove
  const footerStyle: CSSProperties = {
    backgroundColor: resolvedTheme === "dark" ? "transparent" : "transparent",
  };

  return (
    <footer
      ref={ref}
      style={footerStyle}
      className={`border-t border-gray-200 dark:border-matrix/20 relative z-10 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Top status bar */}
        <div className="border-b border-gray-200 dark:border-matrix/20 py-4">
          <div className="flex items-center justify-between font-mono text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-matrix">&gt;</span>
              <span>
                /{location.pathname.split("/").filter(Boolean).join("/")}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 dark:bg-matrix inline-block animate-pulse" />
              <span className="text-green-600 dark:text-matrix/70">[200]</span>{" "}
              OK
            </span>
          </div>
        </div>

        {/* Main columns */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {/* Navigate */}
          <div>
            <h3 className="font-mono text-sm font-bold text-blue-600 dark:text-matrix uppercase mb-3 tracking-wider">
              NAVIGATE
            </h3>
            <ul className="space-y-3 font-mono text-[11px] uppercase tracking-wider">
              <li>
                <Link
                  to="/home"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/ctf"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  CTF
                </Link>
              </li>
              <li>
                <Link
                  to="/app"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  iOS App
                </Link>
              </li>
              <li>
                <Link
                  to="/legal"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Legal
                </Link>
              </li>
            </ul>
          </div>

          {/* Club */}
          <div>
            <h3 className="font-mono text-sm font-bold text-blue-600 dark:text-matrix uppercase mb-3 tracking-wider">
              CLUB
            </h3>
            <ul className="space-y-3 font-mono text-[11px] uppercase tracking-wider">
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/home"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Home
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-mono text-sm font-bold text-blue-600 dark:text-matrix uppercase mb-3 tracking-wider">
              CONNECT
            </h3>
            <ul className="space-y-3 font-mono text-[11px] uppercase tracking-wider">
              <li>
                <a
                  href="https://discord.gg/v5JWDrZVNp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="font-mono text-sm font-bold text-blue-600 dark:text-matrix uppercase mb-3 tracking-wider">
              DEVELOPERS
            </h3>
            <ul className="space-y-3 font-mono text-[11px] uppercase tracking-wider">
              <li>
                <a
                  href="https://github.com/aaronhma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Aaron Ma
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/boredcreator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Neel Anshu
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 dark:border-matrix/20 py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest">
            COPYRIGHT &nbsp;&nbsp; © {currentYear}
          </p>
          <p className="font-mono text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest text-center leading-relaxed">
            DE ANZA CYBERSECURITY CLUB
            <br />
            CUPERTINO, CALIFORNIA
          </p>

          {/* Theme selector dropdown button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-matrix border border-gray-200 dark:border-gray-800 px-2 py-0.5 transition-colors active:scale-[0.985] flex items-center gap-1"
              aria-label={`Current theme: ${currentTheme.label}. Click to select theme.`}
              aria-expanded={isOpen}
            >
              <span>{currentTheme.icon}</span>
              <span>{currentTheme.label}</span>
              <ChevronDown
                className={`w-2.5 h-2.5 ml-0.5 transition-transform ${isOpen ? "-rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="absolute bottom-full right-0 mb-1 min-w-[100px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] shadow-md z-50 overflow-hidden">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                      theme === opt.id
                        ? "bg-gray-100 dark:bg-matrix/10 text-blue-600 dark:text-matrix"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/70 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="flex-1">{opt.label}</span>
                    {theme === opt.id && (
                      <span className="ml-auto text-[8px] opacity-60">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
