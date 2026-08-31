import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/lib/cyberIcon";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

function ProtectedRoute({
  children,
  requireProfile = true,
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="flex items-center gap-3 justify-center">
            <Spinner className="animate-spin h-6 w-6 text-matrix" />
            <span className="font-terminal text-lg neon-pulse">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?to=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (requireProfile && !userProfile) {
    return <Navigate to={`/auth?to=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
