import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Tabs } from "./Tabs";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "./ProfileMenu";
import { Login, Logout, ChevronRight } from "@/lib/cyberIcon";
import ConfirmDialog from "./ConfirmDialog";

function PageHeader() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isEventsActive = location.pathname.startsWith("/meetings");
  const isCTFActive = location.pathname.startsWith("/ctf");
  const isCheckInActive = location.pathname === "/live";

  const navTabs = [
    { id: "meetings", label: "events" },
    { id: "ctf", label: "ctf" },
    ...(user ? [{ id: "live", label: "check-in" }] : []),
  ];
  const activeNavTab = isEventsActive
    ? "meetings"
    : isCTFActive
    ? "ctf"
    : isCheckInActive
    ? "live"
    : "";
  const isDashboardActive = location.pathname === "/dashboard";
  const isSettingsActive = location.pathname === "/settings";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    setShowLogoutConfirm(false);
    closeMobileMenu();
    window.location.href = "/";
  };

  return (
    <>
      {/* ── Three glass islands ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Island 1 · Logo */}
        <Link
          to="/"
          className="glass-island px-4 py-2 flex-shrink-0 font-terminal text-sm font-bold text-green-700 dark:text-matrix hover:text-green-800 dark:hover:text-matrix/80 transition-colors glitch relative group"
          data-text="[dacc]"
        >
          {/* Subtle glow in dark mode */}
          <span className="absolute inset-0 opacity-0 dark:group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <span className="absolute inset-0 bg-matrix/5 blur-md" />
          </span>
          <span className="relative">[dacc]</span>
        </Link>

        {/* Island 2 · Navigation (desktop only) */}
        <div
          className="hidden md:block glass-island relative"
          style={{ borderRadius: "32px" }}
        >
          {/* Active indicator glow */}
          {activeNavTab && (
            <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none transition-opacity duration-300">
              <div className="absolute inset-0 rounded-[32px] border border-matrix/10" />
            </div>
          )}
          <Tabs
            tabs={navTabs}
            activeTab={activeNavTab}
            onTabChange={(id) => navigate(`/${id}`)}
            className="!bg-transparent dark:!bg-transparent !border-0 rounded-[28px] overflow-hidden font-terminal text-sm font-bold"
          />
        </div>

        {/* Island 3 · Auth + mobile hamburger */}
        <div className="glass-island px-4 py-2 flex-shrink-0 flex items-center gap-2.5">
          {/* Desktop auth */}
          <div className="hidden md:flex items-center">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 dark:bg-matrix/30 animate-pulse" />
                <span className="text-xs text-gray-400 dark:text-gray-600 font-terminal">Loading...</span>
              </div>
            ) : user ? (
              <ProfileMenu />
            ) : (
              <Link
                to={`/auth?to=${encodeURIComponent(
                  location.pathname === "/" ? "/dashboard" : location.pathname
                )}`}
                className="flex items-center gap-1.5 font-terminal text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-matrix transition-colors group"
              >
                <Login className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                sign in
              </Link>
            )}
          </div>

          {/* Mobile: avatar (if logged in) + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {!loading && user && <ProfileMenu />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex flex-col gap-[5px] w-5 h-5 justify-center items-end"
              aria-label="Toggle menu"
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
      </div>

      {/* ── Mobile dropdown glass panel ── */}
      <div
        className={`md:hidden mt-3 transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass-panel overflow-hidden">
          <div className="flex flex-col py-1">
            <Link
              to="/meetings"
              onClick={closeMobileMenu}
              className={`flex items-center gap-2 px-5 py-3 font-terminal text-sm transition-all group ${
                isEventsActive
                  ? "text-green-700 dark:text-matrix bg-green-50/50 dark:bg-matrix/5"
                  : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className={isEventsActive ? "text-green-700 dark:text-matrix" : "text-gray-400 dark:text-gray-600"}>&gt;</span>
              events
              {isEventsActive && <span className="ml-auto w-1.5 h-1.5 bg-green-500 dark:bg-matrix animate-pulse" />}
            </Link>
            <Link
              to="/ctf"
              onClick={closeMobileMenu}
              className={`flex items-center gap-2 px-5 py-3 font-terminal text-sm transition-all group ${
                isCTFActive
                  ? "text-green-700 dark:text-matrix bg-green-50/50 dark:bg-matrix/5"
                  : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className={isCTFActive ? "text-green-700 dark:text-matrix" : "text-gray-400 dark:text-gray-600"}>&gt;</span>
              ctf
              {isCTFActive && <span className="ml-auto w-1.5 h-1.5 bg-green-500 dark:bg-matrix animate-pulse" />}
            </Link>
            {user && (
              <>
                <Link
                  to="/live"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-2 px-5 py-3 font-terminal text-sm transition-all group ${
                    isCheckInActive
                      ? "text-green-700 dark:text-matrix bg-green-50/50 dark:bg-matrix/5"
                      : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={isCheckInActive ? "text-green-700 dark:text-matrix" : "text-gray-400 dark:text-gray-600"}>&gt;</span>
                  check-in
                  {isCheckInActive && <span className="ml-auto w-1.5 h-1.5 bg-green-500 dark:bg-matrix animate-pulse" />}
                </Link>
                <div className="mx-5 my-1 h-px bg-gray-200 dark:bg-gray-700" />
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-2 px-5 py-3 font-terminal text-sm transition-all group ${
                    isDashboardActive
                      ? "text-green-700 dark:text-matrix bg-green-50/50 dark:bg-matrix/5"
                      : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={isDashboardActive ? "text-green-700 dark:text-matrix" : "text-gray-400 dark:text-gray-600"}>&gt;</span>
                  dashboard
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link
                  to="/settings"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-2 px-5 py-3 font-terminal text-sm transition-all group ${
                    isSettingsActive
                      ? "text-green-700 dark:text-matrix bg-green-50/50 dark:bg-matrix/5"
                      : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={isSettingsActive ? "text-green-700 dark:text-matrix" : "text-gray-400 dark:text-gray-600"}>&gt;</span>
                  settings
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <div className="mx-5 my-1 h-px bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={() => {
                    closeMobileMenu();
                    setShowLogoutConfirm(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 font-terminal text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-hack-red transition-colors group"
                >
                  <span className="text-gray-400 dark:text-gray-600 group-hover:text-red-500 dark:group-hover:text-hack-red">&gt;</span>
                  logout
                  <Logout className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </>
            )}
            {!user && !loading && (
              <Link
                to={`/auth?to=${encodeURIComponent(
                  location.pathname === "/" ? "/dashboard" : location.pathname
                )}`}
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-5 py-3 font-terminal text-sm text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
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
        icon={<Logout className="w-8 h-8 text-yellow-600 dark:text-hack-yellow" />}
      />
    </>
  );
}

export default PageHeader;
