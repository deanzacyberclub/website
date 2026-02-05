import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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
  // null = not yet verified, true/false = server result
  const [officerVerified, setOfficerVerified] = useState<boolean | null>(
    requireOfficer ? null : true,
  );

  // Server-side officer verification: queries the database directly
  // instead of relying on client-side context state which can be intercepted
  useEffect(() => {
    if (!requireOfficer || !user) {
      setOfficerVerified(requireOfficer ? null : true);
      return;
    }

    let cancelled = false;

    async function verifyOfficerStatus() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("is_officer")
          .eq("id", user!.id)
          .single();

        if (cancelled) return;

        if (error || !data?.is_officer) {
          setOfficerVerified(false);
        } else {
          setOfficerVerified(true);
        }
      } catch {
        if (!cancelled) setOfficerVerified(false);
      }
    }

    verifyOfficerStatus();

    return () => {
      cancelled = true;
    };
  }, [requireOfficer, user]);

  if (loading || (requireOfficer && officerVerified === null)) {
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
    return <Navigate to={`/auth?to=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireProfile && !userProfile) {
    return <Navigate to={`/auth?to=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireOfficer && !officerVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
