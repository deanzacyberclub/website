import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Spinner,
  Users,
  Calendar,
  Trophy,
  ChevronRight,
  Shield,
  Clock,
  CheckCircle,
  Star,
} from "@/lib/cyberIcon";

interface Stats {
  totalUsers: number;
  totalMeetings: number;
  upcomingMeetings: number;
  totalRegistrations: number;
  totalTeams: number;
  totalOfficers: number;
}

interface RecentRegistration {
  id: string;
  user_id: string;
  meeting_id: string;
  status: string;
  registered_at: string;
  user?: {
    display_name: string;
    photo_url: string | null;
  };
  meeting?: {
    title: string;
    slug: string;
    date: string;
  };
}

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  photo_url: string | null;
  is_officer: boolean;
  created_at: string;
}

function Officer() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalMeetings: 0,
    upcomingMeetings: 0,
    totalRegistrations: 0,
    totalTeams: 0,
    totalOfficers: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState<
    RecentRegistration[]
  >([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [togglingOfficer, setTogglingOfficer] = useState<string | null>(null);
  const [deletingRegistration, setDeletingRegistration] = useState<string | null>(null);

  // Server-side officer verification as defense-in-depth
  // This catches cases where client-side state was tampered with after ProtectedRoute rendered
  const [officerVerified, setOfficerVerified] = useState(false);

  useEffect(() => {
    async function verifyOfficer() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("is_officer")
          .eq("id", userProfile?.id)
          .single();

        if (error || !data?.is_officer) {
          navigate("/dashboard", { replace: true });
          return;
        }
        setOfficerVerified(true);
      } catch {
        navigate("/dashboard", { replace: true });
      }
    }

    if (userProfile?.id) {
      verifyOfficer();
    }
  }, [userProfile?.id, navigate]);

  // Fetch dashboard stats only after officer status is verified server-side
  useEffect(() => {
    if (!officerVerified) return;

    async function fetchStats() {
      try {
        const today = new Date().toISOString().split("T")[0];

        // Fetch counts in parallel
        const [
          { count: usersCount },
          { count: meetingsCount },
          { count: upcomingCount },
          { count: registrationsCount },
          { count: teamsCount },
          { count: officersCount },
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("meetings_public").select("*", { count: "exact", head: true }),
          supabase
            .from("meetings_public")
            .select("*", { count: "exact", head: true })
            .gte("date", today),
          supabase
            .from("registrations")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("ctf_teams")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("is_officer", true),
        ]);

        setStats({
          totalUsers: usersCount || 0,
          totalMeetings: meetingsCount || 0,
          upcomingMeetings: upcomingCount || 0,
          totalRegistrations: registrationsCount || 0,
          totalTeams: teamsCount || 0,
          totalOfficers: officersCount || 0,
        });

        // Fetch recent registrations
        const { data: registrations } = await supabase
          .from("registrations")
          .select("*")
          .order("registered_at", { ascending: false })
          .limit(10);

        if (registrations && registrations.length > 0) {
          // Fetch user profiles and meetings
          const userIds = [...new Set(registrations.map((r) => r.user_id))];
          const meetingIds = [
            ...new Set(registrations.map((r) => r.meeting_id)),
          ];

          const [{ data: profiles }, { data: meetings }] = await Promise.all([
            supabase
              .from("public_profiles")
              .select("id, display_name, photo_url")
              .in("id", userIds),
            supabase
              .from("meetings_public")
              .select("id, title, slug, date")
              .in("id", meetingIds),
          ]);

          const registrationsWithData = registrations.map((reg) => ({
            ...reg,
            user: profiles?.find((p) => p.id === reg.user_id),
            meeting: meetings?.find((m) => m.id === reg.meeting_id),
          }));

          setRecentRegistrations(registrationsWithData);
        }
      } catch (err: any) {
        console.error("Error fetching stats:", err);
        // If authorization error, redirect to dashboard
        if (err?.code === "PGRST301" || err?.status === 403) {
          navigate("/dashboard");
        }
      } finally {
        setLoadingStats(false);
        setLoaded(true);
      }
    }

    fetchStats();
  }, [officerVerified]);

  // Fetch all users (guarded by server-side officer verification)
  const fetchUsers = async () => {
    if (!officerVerified) return;
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.rpc("get_all_users_for_officers");
      if (error) {
        console.error("Error fetching users - authorization denied:", error);
        navigate("/dashboard");
        return;
      }
      if (data) {
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      navigate("/dashboard");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleShowUsers = () => {
    if (!showUsers && users.length === 0) {
      fetchUsers();
    }
    setShowUsers(!showUsers);
  };

  const toggleOfficerStatus = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    setTogglingOfficer(userId);
    try {
      const { error } = await supabase.rpc("toggle_officer_status", {
        target_user_id: userId,
        new_status: !currentStatus,
      });

      if (error) throw error;

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, is_officer: !currentStatus } : u,
        ),
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalOfficers: currentStatus
          ? prev.totalOfficers - 1
          : prev.totalOfficers + 1,
      }));
    } catch (err) {
      console.error("Error toggling officer status:", err);
    } finally {
      setTogglingOfficer(null);
    }
  };

  const deleteRegistration = async (registrationId: string) => {
    if (
      !confirm(
        "Remove this registration record? This will also remove any associated attendance.",
      )
    )
      return;

    setDeletingRegistration(registrationId);
    try {
      const { error: deleteError } = await supabase
        .from("registrations")
        .delete()
        .eq("id", registrationId);

      if (deleteError) throw deleteError;

      // Remove from local state
      setRecentRegistrations(
        recentRegistrations.filter((r) => r.id !== registrationId),
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalRegistrations: Math.max(0, prev.totalRegistrations - 1),
      }));
    } catch (err) {
      console.error("Error deleting registration:", err);
      alert("Failed to delete registration");
    } finally {
      setDeletingRegistration(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };


  // Don't render any dashboard content until officer status is verified server-side
  if (!officerVerified) {
    return (
      <div className="bg-terminal-bg text-matrix min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Spinner className="animate-spin h-6 w-6 text-matrix" />
          <span className="font-terminal text-lg">Verifying access...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <header
          className={`mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle">$</span>
            <span className="text-gray-400 font-terminal">
              sudo ./officer-dashboard.sh
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-hack-purple/20 border border-hack-purple/50">
              <Shield className="w-8 h-8 text-hack-purple" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-matrix neon-text">
                Officer Dashboard
              </h1>
              <p className="text-gray-500">Manage club operations</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section
          className={`mb-8 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-matrix/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-matrix" />
                <span className="text-xs text-gray-500 font-terminal">
                  MEMBERS
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loadingStats ? "-" : stats.totalUsers}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-hack-purple/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-hack-purple" />
                <span className="text-xs text-gray-500 font-terminal">
                  OFFICERS
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loadingStats ? "-" : stats.totalOfficers}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-hack-cyan/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-hack-cyan" />
                <span className="text-xs text-gray-500 font-terminal">
                  MEETINGS
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loadingStats ? "-" : stats.totalMeetings}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-hack-yellow/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-hack-yellow" />
                <span className="text-xs text-gray-500 font-terminal">
                  UPCOMING
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loadingStats ? "-" : stats.upcomingMeetings}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-matrix/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-matrix" />
                <span className="text-xs text-gray-500 font-terminal">
                  RSVPS
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loadingStats ? "-" : stats.totalRegistrations}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-hack-red/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-hack-red" />
                <span className="text-xs text-gray-500 font-terminal">
                  CTF TEAMS
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loadingStats ? "-" : stats.totalTeams}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section
          className={`mb-8 transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/meetings"
              className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-hack-cyan/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-hack-cyan/10 text-hack-cyan">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-200">
                    Manage Meetings
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-hack-cyan group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              to="/ctf/leaderboard"
              className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-hack-red/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-hack-red/10 text-hack-red">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-200">
                    CTF Leaderboard
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-hack-red group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              to="/ctf/challenges"
              className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-hack-purple/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-hack-purple/10 text-hack-purple">
                    <Star className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-200">
                    CTF Challenges
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-hack-purple group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <button
              onClick={toggleShowUsers}
              className="p-4 rounded-xl bg-terminal-alt border border-gray-800 hover:border-matrix/50 transition-all group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-matrix/10 text-matrix">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-200">
                    {showUsers ? "Hide Users" : "Manage Users"}
                  </span>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-500 group-hover:text-matrix transition-all ${showUsers ? "rotate-90" : ""}`}
                />
              </div>
            </button>
          </div>
        </section>

        {/* User Management Section */}
        {showUsers && (
          <section
            className={`mb-8 transition-all duration-300 ${showUsers ? "opacity-100" : "opacity-0"}`}
          >
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">
                  user_management.sh
                </span>
              </div>
              <div className="terminal-body">
                <h3 className="text-lg font-semibold text-white mb-4">
                  All Users ({users.length})
                </h3>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="animate-spin h-6 w-6 text-matrix" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-terminal-alt border border-gray-800"
                      >
                        <Link
                          to={`/@/${u.id}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          {u.photo_url ? (
                            <img
                              src={u.photo_url}
                              alt={u.display_name}
                              className="w-10 h-10 rounded-full border border-gray-600 hover:border-matrix transition-colors"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 hover:border-matrix transition-colors">
                              <span className="text-gray-400 font-bold">
                                {u.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-200 hover:text-matrix transition-colors">
                                {u.display_name}
                              </span>
                              {u.is_officer && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-hack-purple/20 text-hack-purple border border-hack-purple/30">
                                  OFFICER
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {u.email}
                            </span>
                          </div>
                        </Link>

                        <button
                          onClick={() =>
                            toggleOfficerStatus(u.id, u.is_officer)
                          }
                          disabled={
                            togglingOfficer === u.id || u.id === userProfile?.id
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-colors disabled:opacity-50 ${
                            u.is_officer
                              ? "bg-hack-red/10 text-hack-red border border-hack-red/30 hover:bg-hack-red/20"
                              : "bg-hack-purple/10 text-hack-purple border border-hack-purple/30 hover:bg-hack-purple/20"
                          }`}
                        >
                          {togglingOfficer === u.id ? (
                            <Spinner className="animate-spin h-4 w-4" />
                          ) : u.is_officer ? (
                            "Remove Officer"
                          ) : (
                            "Make Officer"
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Recent Registrations */}
        <section
          className={`mb-16 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                recent_registrations.log
              </span>
            </div>
            <div className="terminal-body">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Registrations
              </h3>

              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="animate-spin h-6 w-6 text-matrix" />
                </div>
              ) : recentRegistrations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No registrations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {recentRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-terminal-alt border border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <Link to={`/@/${reg.user_id}`} className="shrink-0">
                          {reg.user?.photo_url ? (
                            <img
                              src={reg.user.photo_url}
                              alt={reg.user.display_name}
                              className="w-8 h-8 rounded-full border border-gray-600 hover:border-matrix transition-colors"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 hover:border-matrix transition-colors">
                              <span className="text-gray-400 text-xs font-bold">
                                {reg.user?.display_name
                                  ?.charAt(0)
                                  .toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                        </Link>
                        <div>
                          <Link
                            to={`/@/${reg.user_id}`}
                            className="font-medium text-gray-200 hover:text-matrix transition-colors"
                          >
                            {reg.user?.display_name || "Unknown"}
                          </Link>
                          <span className="text-gray-500 mx-2">
                            registered for
                          </span>
                          {reg.meeting ? (
                            <Link
                              to={`/meetings/${reg.meeting.slug}`}
                              className="text-hack-cyan hover:underline"
                            >
                              {reg.meeting.title}
                            </Link>
                          ) : (
                            <span className="text-gray-400">Unknown Event</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-terminal ${
                            reg.status === "attended"
                              ? "bg-matrix/20 text-matrix border border-matrix/30"
                              : reg.status === "registered"
                                ? "bg-hack-cyan/20 text-hack-cyan border border-hack-cyan/30"
                                : reg.status === "waitlist"
                                  ? "bg-hack-yellow/20 text-hack-yellow border border-hack-yellow/30"
                                  : "bg-gray-700 text-gray-400 border border-gray-600"
                          }`}
                        >
                          {reg.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(reg.registered_at)}
                        </span>
                        <button
                          onClick={() => deleteRegistration(reg.id)}
                          disabled={deletingRegistration === reg.id}
                          className="px-2 py-1 text-xs rounded text-hack-red hover:bg-hack-red/10 border border-hack-red/30 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {deletingRegistration === reg.id ? "..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Officer;
