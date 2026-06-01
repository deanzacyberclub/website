import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "./ProfileMenu";
import { Login, Logout, ChevronRight } from "@/lib/cyberIcon";
import ConfirmDialog from "./ConfirmDialog";
import {
  preloadMeetings,
  preloadLive,
  preloadDashboard,
  preloadSettings,
} from "@/lib/preloadRoutes";

function PageHeader() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isEventsActive = location.pathname.startsWith("/meetings");
  const isCheckInActive = location.pathname === "/live";
  const isDashboardActive = location.pathname === "/dashboard";
  const isSettingsActive = location.pathname === "/settings";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Click outside + Escape handling for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/");
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
      closeMobileMenu();
    }
  };

  const authRedirect = `/auth?to=${encodeURIComponent(
    location.pathname === "/" ? "/dashboard" : location.pathname,
  )}`;

  return (
    <>
      {/* Header bar: full width on mobile, always compact + rounded + centered on desktop */}
      <div className="sticky top-0 z-50 w-full px-4 md:mx-auto md:max-w-7xl md:px-6 md:rounded-3xl md:border md:border-gray-200 dark:md:border-gray-800 md:bg-white dark:md:bg-[#0a0a0a] md:shadow-sm border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a]">
        {/* Desktop layout: Nav | Centered Logo | Auth */}
        <div className="hidden md:flex items-center justify-between py-2.5 relative">
          {/* Left: Navigation */}
          <nav className="flex items-center gap-6 text-sm font-terminal font-bold">
            <Link
              to="/meetings"
              onMouseEnter={preloadMeetings}
              onFocus={preloadMeetings}
              className={`flex items-center gap-1.5 transition-colors font-medium ${
                isEventsActive
                  ? "text-matrix"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {isEventsActive && <span className="text-matrix">&gt;</span>}
              events
            </Link>
            <Link
              to="/live"
              onMouseEnter={preloadLive}
              onFocus={preloadLive}
              className={`flex items-center gap-1.5 transition-colors font-medium ${
                isCheckInActive
                  ? "text-matrix"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {isCheckInActive && <span className="text-matrix">&gt;</span>}
              check-in
            </Link>
          </nav>

          {/* Center: Logo (perfectly centered) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className="font-terminal text-sm font-bold text-green-700 dark:text-matrix hover:text-green-800 dark:hover:text-matrix/80 transition-colors glitch relative group"
              data-text="[dacc]"
            >
              <span className="relative">[dacc]</span>
            </Link>
          </div>

          {/* Right: Auth */}
          <div className="flex items-center">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 dark:bg-matrix/30 animate-pulse" />
                <span className="text-xs text-gray-400 dark:text-gray-600 font-terminal">
                  Loading...
                </span>
              </div>
            ) : user ? (
              <ProfileMenu />
            ) : (
              <Link
                to={authRedirect}
                className="flex items-center gap-1.5 font-terminal text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-matrix transition-colors group"
              >
                <Login className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile layout: Logo left + Hamburger right (full width) */}
        <div className="md:hidden flex items-center justify-between py-3">
          {/* Logo */}
          <Link
            to="/"
            className="font-terminal text-sm font-bold text-green-700 dark:text-matrix hover:text-green-800 dark:hover:text-matrix/80 transition-colors glitch relative group"
            data-text="[dacc]"
          >
            <span className="relative">[dacc]</span>
          </Link>

          {/* Mobile: hamburger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex flex-col gap-[5px] w-5 h-5 justify-center items-end"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`block h-px bg-gray-700 dark:bg-gray-300 transition-all duration-300 ${
                  mobileMenuOpen ? "w-5 rotate-45 translate-y-[6px]" : "w-5"
                }`}
              />
              <span
                className={`block h-px bg-gray-700 dark:bg-gray-300 transition-all duration-200 ${
                  mobileMenuOpen ? "w-0 opacity-0" : "w-4"
                }`}
              />
              <span
                className={`block h-px bg-gray-700 dark:bg-gray-300 transition-all duration-300 ${
                  mobileMenuOpen ? "w-5 -rotate-45 -translate-y-[6px]" : "w-3"
                }`}
              />
            </button>
          </div>
        </div>
      </div>{" "}
      {/* /header bar */}
      {/* Mobile dropdown panel (rectangular, terminal-aligned, no heavy rounding) */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden mt-2 overflow-hidden transition-all duration-200 ${
          mobileMenuOpen
            ? "max-h-[520px] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-terminal overflow-hidden">
          <div className="flex flex-col py-1 text-sm font-terminal">
            <Link
              to="/meetings"
              onClick={closeMobileMenu}
              onMouseEnter={preloadMeetings}
              onFocus={preloadMeetings}
              className={`flex items-center gap-2 px-5 py-3 transition-colors group font-medium ${
                isEventsActive
                  ? "text-matrix bg-green-50/50 dark:bg-matrix/5"
                  : "text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span
                className={
                  isEventsActive
                    ? "text-matrix"
                    : "text-gray-400 dark:text-gray-600"
                }
              >
                &gt;
              </span>
              events
              {isEventsActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-green-500 dark:bg-matrix animate-pulse" />
              )}
            </Link>

            <Link
              to="/live"
              onClick={closeMobileMenu}
              onMouseEnter={preloadLive}
              onFocus={preloadLive}
              className={`flex items-center gap-2 px-5 py-3 transition-colors group font-medium ${
                isCheckInActive
                  ? "text-matrix bg-green-50/50 dark:bg-matrix/5"
                  : "text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span
                className={
                  isCheckInActive
                    ? "text-matrix"
                    : "text-gray-400 dark:text-gray-600"
                }
              >
                &gt;
              </span>
              check in
              {isCheckInActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-green-500 dark:bg-matrix animate-pulse" />
              )}
            </Link>

            {user && (
              <>
                <div className="mx-5 my-1 h-px bg-gray-200 dark:bg-gray-700" />
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  onMouseEnter={preloadDashboard}
                  onFocus={preloadDashboard}
                  className={`flex items-center gap-2 px-5 py-3 transition-colors group font-medium ${
                    isDashboardActive
                      ? "text-matrix bg-green-50/50 dark:bg-matrix/5"
                      : "text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className={
                      isDashboardActive
                        ? "text-matrix"
                        : "text-gray-400 dark:text-gray-600"
                    }
                  >
                    &gt;
                  </span>
                  dashboard
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link
                  to="/settings"
                  onClick={closeMobileMenu}
                  onMouseEnter={preloadSettings}
                  onFocus={preloadSettings}
                  className={`flex items-center gap-2 px-5 py-3 transition-colors group font-medium ${
                    isSettingsActive
                      ? "text-matrix bg-green-50/50 dark:bg-matrix/5"
                      : "text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className={
                      isSettingsActive
                        ? "text-matrix"
                        : "text-gray-400 dark:text-gray-600"
                    }
                  >
                    &gt;
                  </span>
                  settings
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <div className="mx-5 my-1 h-px bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={() => {
                    closeMobileMenu();
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-5 py-3 text-left text-gray-800 dark:text-gray-200 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-hack-red transition-colors group font-medium"
                >
                  <span className="text-gray-400 dark:text-gray-600 group-hover:text-red-500 dark:group-hover:text-hack-red">
                    &gt;
                  </span>
                  logout
                  <Logout className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </>
            )}

            {!user && !loading && (
              <Link
                to={authRedirect}
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-5 py-3 text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group font-medium"
              >
                <Login className="w-3.5 h-3.5" />
                <span>&gt; sign in</span>
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Logout confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="SIGN OUT"
        cancelText="CANCEL"
        loading={loggingOut}
        variant="warning"
        icon={
          <Logout className="w-8 h-8 text-yellow-600 dark:text-hack-yellow" />
        }
      />
    </>
  );
}

export default PageHeader;
