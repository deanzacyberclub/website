import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "./ProfileMenu";
import { Login, Home, Settings, Logout, User } from "@/lib/cyberIcon";
import ConfirmDialog from "./ConfirmDialog";

function PageHeader() {
  const location = useLocation();
  const navigate = useLocation();
  const { user, userProfile, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isEventsActive = location.pathname.startsWith("/meetings");
  const isStudyActive = location.pathname === "/study";
  const isCTFActive = location.pathname.startsWith("/ctf");
  const isCheckInActive = location.pathname === "/live";
  const isDashboardActive = location.pathname === "/dashboard";
  const isSettingsActive = location.pathname === "/settings";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    setShowLogoutConfirm(false);
    closeMobileMenu();
    window.location.href = '/';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <Link
          to="/"
          className="glitch text-blue-600 dark:text-matrix hover:text-blue-700 dark:hover:text-matrix transition-colors font-terminal text-sm tracking-tight neon-text-subtle"
          data-text="[dacc]"
        >
          [dacc]
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/meetings"
            className={`${
              isEventsActive
                ? "text-blue-600 dark:text-matrix neon-text-subtle"
                : "text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix"
            } transition-colors font-terminal text-sm`}
          >
            events
          </Link>
          <Link
            to="/ctf"
            className={`${
              isCTFActive
                ? "text-blue-600 dark:text-matrix neon-text-subtle"
                : "text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix"
            } transition-colors font-terminal text-sm`}
          >
            ctf
          </Link>
          {user && (
            <Link
              to="/live"
              className={`${
                isCheckInActive
                  ? "text-blue-600 dark:text-matrix neon-text-subtle"
                  : "text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix"
              } transition-colors font-terminal text-sm`}
            >
              check-in
            </Link>
          )}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:block">
          {loading ? (
            <div className="w-10 h-10 bg-gray-100 dark:bg-terminal-alt border-2 border-gray-300 dark:border-gray-700 animate-pulse" />
          ) : user ? (
            <ProfileMenu />
          ) : (
            <Link
              to={`/auth?to=${encodeURIComponent(location.pathname === "/" ? "/dashboard" : location.pathname)}`}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-matrix text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-matrix transition-colors font-terminal text-sm"
            >
              <Login className="w-4 h-4" />
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 w-7 h-7 justify-center items-center group"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
              mobileMenuOpen ? "w-6 rotate-45 translate-y-2" : "w-6"
            }`}
          />
          <span
            className={`block h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
              mobileMenuOpen ? "w-0 opacity-0" : "w-5"
            }`}
          />
          <span
            className={`block h-0.5 bg-gray-700 dark:bg-gray-400 transition-all duration-300 ${
              mobileMenuOpen ? "w-6 -rotate-45 -translate-y-2" : "w-4"
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? "max-h-[32rem] mb-8" : "max-h-0"
        }`}
      >
        <div className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-terminal-bg">
          <div className="flex flex-col">
            <Link
              to="/meetings"
              onClick={closeMobileMenu}
              className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
                isEventsActive
                  ? "text-blue-600 dark:text-matrix bg-blue-50 dark:bg-matrix/10"
                  : "text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-terminal-alt"
              } transition-colors font-terminal text-sm`}
            >
              &gt; events
            </Link>
            <Link
              to="/ctf"
              onClick={closeMobileMenu}
              className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
                isCTFActive
                  ? "text-blue-600 dark:text-matrix bg-blue-50 dark:bg-matrix/10"
                  : "text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-terminal-alt"
              } transition-colors font-terminal text-sm`}
            >
              &gt; ctf
            </Link>
            {user && (
              <>
                <Link
                  to="/live"
                  onClick={closeMobileMenu}
                  className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
                    isCheckInActive
                      ? "text-blue-600 dark:text-matrix bg-blue-50 dark:bg-matrix/10"
                      : "text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-terminal-alt"
                  } transition-colors font-terminal text-sm`}
                >
                  &gt; check-in
                </Link>
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
                    isDashboardActive
                      ? "text-blue-600 dark:text-matrix bg-blue-50 dark:bg-matrix/10"
                      : "text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-terminal-alt"
                  } transition-colors font-terminal text-sm`}
                >
                  &gt; dashboard
                </Link>
                <Link
                  to="/settings"
                  onClick={closeMobileMenu}
                  className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
                    isSettingsActive
                      ? "text-blue-600 dark:text-matrix bg-blue-50 dark:bg-matrix/10"
                      : "text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-terminal-alt"
                  } transition-colors font-terminal text-sm`}
                >
                  &gt; settings
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    setShowLogoutConfirm(true);
                  }}
                  className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-left text-gray-700 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-hack-red/10 hover:text-red-600 dark:hover:text-hack-red transition-colors font-terminal text-sm"
                >
                  &gt; logout
                </button>
              </>
            )}

            {/* Profile Info or Sign In */}
            <div className="px-4 py-3">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-terminal-alt border-2 border-gray-300 dark:border-gray-700 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-terminal-alt animate-pulse w-24" />
                    <div className="h-3 bg-gray-100 dark:bg-terminal-alt animate-pulse w-32" />
                  </div>
                </div>
              ) : user && userProfile ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 overflow-hidden border-2 border-blue-300 dark:border-matrix/50 flex-shrink-0">
                    {userProfile.photo_url ? (
                      <img
                        src={userProfile.photo_url}
                        alt={userProfile.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-100 dark:bg-matrix/20 flex items-center justify-center text-blue-600 dark:text-matrix font-bold text-sm">
                        {userProfile.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-600 dark:text-matrix truncate">
                      {userProfile.display_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-500 truncate">
                      {userProfile.email}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  to={`/auth?to=${encodeURIComponent(location.pathname === "/" ? "/dashboard" : location.pathname)}`}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-matrix text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-matrix transition-colors font-terminal text-sm"
                >
                  <Login className="w-4 h-4" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
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
