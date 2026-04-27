import { forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tabs } from "./Tabs";
import { useTheme } from "@/contexts/ThemeContext";
import type { Theme } from "@/contexts/ThemeContext";

interface FooterProps {
  className?: string;
}

const THEME_TABS = [
  { id: "light", label: "☀️ Light" },
  { id: "dark", label: "🌙 Dark" },
  { id: "system", label: "💻 Auto" },
];

const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { className = "" },
  ref,
) {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const { theme, setTheme } = useTheme();

  return (
    <footer
      ref={ref}
      className={`bg-white dark:bg-transparent border-t border-gray-200 dark:border-matrix/20 relative z-10 ${className}`}
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
                  to="/meetings"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Events
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
                  to="/meetings"
                  className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Meetings
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

        {/* Theme selector */}
        <div className="border-t border-gray-200 dark:border-matrix/20 py-4 flex justify-center">
          <Tabs
            tabs={THEME_TABS}
            activeTab={theme}
            onTabChange={(id) => setTheme(id as Theme)}
          />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 dark:border-matrix/20 py-6 flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest">
            COPYRIGHT &nbsp;&nbsp; © {currentYear}
          </p>
          <p className="font-mono text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest text-center leading-relaxed">
            DE ANZA CYBERSECURITY CLUB
            <br />
            CUPERTINO, CALIFORNIA
          </p>
          <p className="font-mono text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest text-right">
            STATUS: ACTIVE
          </p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
