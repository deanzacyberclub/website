import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "./ProfileMenu";
import { Login } from "@/lib/cyberIcon";

function PageHeader() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isEventsActive = location.pathname.startsWith("/meetings");
  const isStudyActive = location.pathname === "/study";
  const isCTFActive = location.pathname.startsWith("/ctf");
  const isCheckInActive = location.pathname === "/live";

  return (
    <div className="flex items-center justify-between mb-8">
      <Link
        to="/"
        className="glitch text-blue-600 dark:text-matrix hover:text-blue-700 dark:hover:text-matrix transition-colors font-terminal text-sm tracking-tight neon-text-subtle"
        data-text="[dacc]"
      >
        [dacc]
      </Link>

      <div className="flex items-center gap-6">
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
        {/*<Link
          to="/study"
          className={`${isStudyActive
            ? 'text-blue-600 dark:text-matrix neon-text-subtle'
            : 'text-gray-600 dark:text-gray-500 hover:text-blue-600 dark:hover:text-matrix'
            } transition-colors font-terminal text-sm`}
        >
          study
        </Link>*/}
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
  );
}

export default PageHeader;
