import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Tabs } from "./Tabs";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "./ProfileMenu";
import { Login, Logout } from "@/lib/cyberIcon";
import ConfirmDialog from "./ConfirmDialog";

function PageHeader() {
  const location = useLocation();
  const { user, userProfile, loading, signOut } = useAuth();
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
          className="glass-island px-4 py-2 flex-shrink-0 font-terminal text-sm font-bold text-blue-600 dark:text-matrix hover:text-blue-700 dark:hover:text-matrix/80 transition-colors glitch"
          data-text="[dacc]"
        >
          [dacc]
        </Link>

        {/* Island 2 · Navigation (desktop only) */}
        <div
          className="hidden md:block glass-island"
          style={{ borderRadius: "32px" }}
        >
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
              <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-matrix/20 animate-pulse" />
            ) : user ? (
              <ProfileMenu />
            ) : (
              <Link
                to={`/auth?to=${encodeURIComponent(
                  location.pathname === "/" ? "/dashboard" : location.pathname
                )}`}
                className="flex items-center gap-1.5 font-terminal text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-matrix transition-colors"
              >
                <Login className="w-3.5 h-3.5" />
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
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass-panel overflow-hidden">
          <div className="flex flex-col py-1">
            <Link
              to="/meetings"
              onClick={closeMobileMenu}
              className={`px-5 py-3 font-terminal text-sm transition-colors ${
                isEventsActive
                  ? "text-blue-600 dark:text-matrix"
                  : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              &gt; events
            </Link>
            <Link
              to="/ctf"
              onClick={closeMobileMenu}
              className={`px-5 py-3 font-terminal text-sm transition-colors ${
                isCTFActive
                  ? "text-blue-600 dark:text-matrix"
                  : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              &gt; ctf
            </Link>
            {user && (
              <>
                <Link
                  to="/live"
                  onClick={closeMobileMenu}
                  className={`px-5 py-3 font-terminal text-sm transition-colors ${
                    isCheckInActive
                      ? "text-blue-600 dark:text-matrix"
                      : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  &gt; check-in
                </Link>
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className={`px-5 py-3 font-terminal text-sm transition-colors ${
                    isDashboardActive
                      ? "text-blue-600 dark:text-matrix"
                      : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  &gt; dashboard
                </Link>
                <Link
                  to="/settings"
                  onClick={closeMobileMenu}
                  className={`px-5 py-3 font-terminal text-sm transition-colors ${
                    isSettingsActive
                      ? "text-blue-600 dark:text-matrix"
                      : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  &gt; settings
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    setShowLogoutConfirm(true);
                  }}
                  className="px-5 py-3 font-terminal text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-hack-red transition-colors"
                >
                  &gt; logout
                </button>
              </>
            )}
            {!user && !loading && (
              <Link
                to={`/auth?to=${encodeURIComponent(
                  location.pathname === "/" ? "/dashboard" : location.pathname
                )}`}
                onClick={closeMobileMenu}
                className="px-5 py-3 font-terminal text-sm text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <Login className="w-3.5 h-3.5" />
                &gt; sign in
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
