import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/lib/cyberIcon";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
  requireOfficer?: boolean;
}

function ProtectedRoute({
  children,
  requireProfile = true,
  requireOfficer = false,
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
    // Redirect to auth page with return URL
    return <Navigate to={`/auth?to=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireProfile && !userProfile) {
    // User is authenticated but has no profile - redirect to auth to complete setup
    return <Navigate to={`/auth?to=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireOfficer && !userProfile?.is_officer) {
    // User is authenticated but is not an officer - redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
