import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useOfficerVerification } from "@/hooks/useOfficerVerification";
import {
  Spinner,
  ChevronLeft,
  Mail,
  Calendar,
  Shield,
  Trophy,
  CheckCircle,
  Users,
  Clock,
} from "@/lib/cyberIcon";

interface UserDetails {
  id: string;
  display_name: string;
  email: string;
  photo_url: string | null;
  student_id: string | null;
  is_officer: boolean;
  created_at: string;
}

interface UserRegistration {
  id: string;
  meeting_id: string;
  status: string;
  registered_at: string;
  meeting?: {
    title: string;
    slug: string;
    date: string;
  };
}

interface UserAttendance {
  id: string;
  meeting_id: string;
  checked_in_at: string;
  meeting?: {
    title: string;
    slug: string;
    date: string;
  };
}

interface CTFTeamInfo {
  team_id: string;
  team_name: string;
  is_captain: boolean;
  total_points: number;
  solves_count: number;
}

function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { isVerifiedOfficer, isLoading: verifyingOfficer } = useOfficerVerification();
  const [loaded, setLoaded] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [attendance, setAttendance] = useState<UserAttendance[]>([]);
  const [ctfInfo, setCtfInfo] = useState<CTFTeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingAttendance, setDeletingAttendance] = useState<string | null>(null);

  // Use server-verified officer status instead of client-side state
  const isOfficer = isVerifiedOfficer ?? false;

  // Redirect non-authenticated users or non-officers
  useEffect(() => {
    if (!authLoading && (!user || !isOfficer)) {
      navigate("/dashboard");
    }
  }, [authLoading, user, isOfficer, navigate]);

  // Note: Authorization is also enforced by ProtectedRoute wrapper (requireOfficer)
  // and server-side RLS policies on all Supabase operations

  // Fetch user details
  useEffect(() => {
    async function fetchUserDetails() {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch user details using officer function
        const { data: userData, error: userError } = await supabase.rpc(
          "get_user_details_for_officers",
          { target_user_id: id },
        );

        if (userError) throw userError;
        if (!userData || userData.length === 0) {
          setError("User not found");
          setLoading(false);
          return;
        }

        setUserDetails(userData[0]);

        // Fetch user's registrations
        const { data: regsData } = await supabase
          .from("registrations")
          .select("*")
          .eq("user_id", id)
          .order("registered_at", { ascending: false });

        if (regsData && regsData.length > 0) {
          const meetingIds = [...new Set(regsData.map((r) => r.meeting_id))];
          const { data: meetings } = await supabase
            .from("meetings_public")
            .select("id, title, slug, date")
            .in("id", meetingIds);

          const regsWithMeetings = regsData.map((reg) => ({
            ...reg,
            meeting: meetings?.find((m) => m.id === reg.meeting_id),
          }));
          setRegistrations(regsWithMeetings);
        }

        // Fetch user's attendance
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("*")
          .eq("user_id", id)
          .order("checked_in_at", { ascending: false });

        if (attendanceData && attendanceData.length > 0) {
          const meetingIds = [
            ...new Set(attendanceData.map((a) => a.meeting_id)),
          ];
          const { data: meetings } = await supabase
            .from("meetings_public")
            .select("id, title, slug, date")
            .in("id", meetingIds);

          const attendanceWithMeetings = attendanceData.map((att) => ({
            ...att,
            meeting: meetings?.find((m) => m.id === att.meeting_id),
          }));
          setAttendance(attendanceWithMeetings);
        }

        // Fetch CTF team info
        const { data: teamMember } = await supabase
          .from("ctf_team_members")
          .select("team_id, ctf_teams(id, name, captain_id)")
          .eq("user_id", id)
          .single();

        if (teamMember && teamMember.ctf_teams) {
          const team = teamMember.ctf_teams as any;

          // Get team's submissions
          const { data: submissions } = await supabase
            .from("ctf_submissions")
            .select("*")
            .eq("team_id", team.id)
            .eq("is_correct", true);

          // Calculate points (simplified - you may want to join with challenges)
          setCtfInfo({
            team_id: team.id,
            team_name: team.name,
            is_captain: team.captain_id === id,
            total_points: 0, // Would need challenge data to calculate
            solves_count: submissions?.length || 0,
          });
        }
      } catch (err: any) {
        console.error("Error fetching user details:", err);
        // If authorization error, redirect to dashboard
        if (err?.code === "PGRST301" || err?.status === 403) {
          navigate("/dashboard");
          return;
        }
        setError("Failed to load user details");
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }

    fetchUserDetails();
  }, [id, navigate]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const deleteAttendanceRecord = async (attendanceId: string) => {
    if (!confirm("Remove this attendance record?")) return;

    setDeletingAttendance(attendanceId);
    try {
      const { error: deleteError } = await supabase
        .from("attendance")
        .delete()
        .eq("id", attendanceId);

      if (deleteError) throw deleteError;

      // Remove from local state
      setAttendance(attendance.filter((a) => a.id !== attendanceId));
    } catch (err) {
      console.error("Error deleting attendance record:", err);
      alert("Failed to delete attendance record");
    } finally {
      setDeletingAttendance(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <Spinner className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link
            to="/officer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-matrix transition-colors mb-8"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Officer Dashboard
          </Link>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
            </div>
            <div className="terminal-body text-center py-16">
              <p className="text-hack-red text-lg">User not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link
          to="/officer"
          className={`inline-flex items-center gap-2 text-gray-400 hover:text-matrix transition-colors mb-8 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Officer Dashboard
        </Link>

        {/* User Header */}
        <div
          className={`terminal-window mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">
              user_profile_{userDetails.id.slice(0, 8)}.sh
            </span>
          </div>
          <div className="terminal-body">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              {userDetails.photo_url ? (
                <img
                  src={userDetails.photo_url}
                  alt={userDetails.display_name}
                  className="w-24 h-24 rounded-xl border-2 border-matrix/50 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                  <span className="text-3xl text-gray-400 font-bold">
                    {userDetails.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">
                    {userDetails.display_name}
                  </h1>
                  {userDetails.is_officer && (
                    <span className="px-2 py-1 rounded text-xs bg-hack-purple/20 text-hack-purple border border-hack-purple/30 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      OFFICER
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{userDetails.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(userDetails.created_at)}</span>
                  </div>
                  {userDetails.student_id && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <CheckCircle className="w-4 h-4 text-matrix" />
                      <span>Student ID: {userDetails.student_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800">
            <div className="text-2xl font-bold text-white">
              {attendance.length}
            </div>
            <div className="text-xs text-gray-500 font-terminal">
              ATTENDANCE
            </div>
          </div>
          <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800">
            <div className="text-2xl font-bold text-white">
              {registrations.length}
            </div>
            <div className="text-xs text-gray-500 font-terminal">
              REGISTRATIONS
            </div>
          </div>
          <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800">
            <div className="text-2xl font-bold text-white">
              {registrations.filter((r) => r.status === "attended").length}
            </div>
            <div className="text-xs text-gray-500 font-terminal">
              EVENTS ATTENDED
            </div>
          </div>
          <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800">
            <div className="text-2xl font-bold text-white">
              {ctfInfo?.solves_count || 0}
            </div>
            <div className="text-xs text-gray-500 font-terminal">
              CTF SOLVES
            </div>
          </div>
        </div>

        {/* CTF Team */}
        {ctfInfo && (
          <div
            className={`mb-8 transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-hack-red" />
              CTF Team
            </h2>
            <div className="p-4 rounded-xl bg-terminal-alt border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-hack-red/10">
                    <Users className="w-5 h-5 text-hack-red" />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {ctfInfo.team_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {ctfInfo.is_captain ? "Team Captain" : "Team Member"} •{" "}
                      {ctfInfo.solves_count} solves
                    </div>
                  </div>
                </div>
                <Link
                  to="/ctf/leaderboard"
                  className="text-sm text-hack-cyan hover:underline"
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recent Attendance */}
        <div
          className={`mb-8 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-matrix" />
            Attendance History ({attendance.length})
          </h2>
          {attendance.length === 0 ? (
            <p className="text-gray-500 text-sm">No attendance records</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {attendance.slice(0, 10).map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-terminal-alt border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-matrix/10">
                      <CheckCircle className="w-4 h-4 text-matrix" />
                    </div>
                    {att.meeting ? (
                      <Link
                        to={`/meetings/${att.meeting.slug}`}
                        className="text-gray-200 hover:text-hack-cyan transition-colors"
                      >
                        {att.meeting.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unknown Meeting</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDateTime(att.checked_in_at)}
                    </span>
                    {isOfficer && (
                      <button
                        onClick={() => deleteAttendanceRecord(att.id)}
                        disabled={deletingAttendance === att.id}
                        className="px-2 py-1 text-xs rounded text-hack-red hover:bg-hack-red/10 border border-hack-red/30 transition-colors disabled:opacity-50"
                      >
                        {deletingAttendance === att.id ? "..." : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registrations */}
        <div
          className={`mb-8 transition-all duration-700 delay-250 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-hack-cyan" />
            Registration History ({registrations.length})
          </h2>
          {registrations.length === 0 ? (
            <p className="text-gray-500 text-sm">No registrations</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {registrations.slice(0, 10).map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-terminal-alt border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    {reg.meeting ? (
                      <Link
                        to={`/meetings/${reg.meeting.slug}`}
                        className="text-gray-200 hover:text-hack-cyan transition-colors"
                      >
                        {reg.meeting.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Unknown Meeting</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
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
                      {formatDate(reg.registered_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User ID */}
        <div
          className={`transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-xs text-gray-600 font-terminal text-center">
            USER ID: {userDetails.id}
          </p>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
