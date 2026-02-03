import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Spinner,
  Check,
  Plus,
  ArrowLeft,
  User,
} from "@/lib/cyberIcon";

interface AttendanceForm {
  secretCode: string;
  studentId: string;
}

function Attendance() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);

  const { user, userProfile } = useAuth();

  const [form, setForm] = useState<AttendanceForm>({
    secretCode: "",
    studentId: "",
  });

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // Pre-fill student ID if user is logged in and has a profile
  useEffect(() => {
    if (userProfile?.student_id) {
      setForm((prev) => ({ ...prev, studentId: userProfile.student_id || "" }));
    }
  }, [userProfile]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Filter out non-numeric characters for student ID
    if (name === "studentId") {
      const numericValue = value.replace(/\D/g, "").slice(0, 8);
      setForm({ ...form, [name]: numericValue });
    } else if (name === "secretCode") {
      // Only allow alphanumeric characters and convert to uppercase
      const alphanumericValue = value
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase();
      setForm({ ...form, [name]: alphanumericValue });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!form.secretCode.trim()) {
      setError("[ERROR] Secret code is required");
      return;
    }

    // Get student ID from profile or form input
    const studentIdToUse = userProfile?.student_id || form.studentId.trim();

    if (!studentIdToUse) {
      setError("[ERROR] Student ID is required");
      return;
    }

    if (studentIdToUse.length !== 8 || !/^\d+$/.test(studentIdToUse)) {
      setError("[ERROR] Student ID must be 8 digits");
      return;
    }

    setSubmitting(true);

    try {
      // Look up meeting by secret code
      const { data: meeting, error: lookupError } = await supabase
        .from("meetings")
        .select("*")
        .ilike("secret_code", form.secretCode.trim())
        .single();

      if (lookupError || !meeting) {
        setError("[ERROR] Invalid secret code");
        return;
      }

      // Check if already checked in (by user_id if logged in, or by student_id if not)
      let existingAttendance;
      if (user) {
        const { data } = await supabase
          .from("attendance")
          .select("id")
          .eq("meeting_id", meeting.id)
          .eq("user_id", user.id)
          .single();
        existingAttendance = data;
      } else {
        const { data } = await supabase
          .from("attendance")
          .select("id")
          .eq("meeting_id", meeting.id)
          .eq("student_id", studentIdToUse)
          .single();
        existingAttendance = data;
      }

      if (existingAttendance) {
        setError("[ERROR] You have already checked in to this meeting");
        return;
      }

      // Record attendance
      const { error: insertError } = await supabase.from("attendance").insert({
        meeting_id: meeting.id,
        user_id: user?.id || null,
        student_id: studentIdToUse,
      });

      if (insertError) throw insertError;

      // Also create/update registration with "attended" status for logged-in users
      if (user) {
        const { data: existingRegistration } = await supabase
          .from("registrations")
          .select("id")
          .eq("meeting_id", meeting.id)
          .eq("user_id", user.id)
          .single();

        if (existingRegistration) {
          // Update existing registration to "attended"
          await supabase
            .from("registrations")
            .update({ status: "attended" })
            .eq("id", existingRegistration.id);
        } else {
          // Create new registration with "attended" status
          await supabase.from("registrations").insert({
            meeting_id: meeting.id,
            user_id: user.id,
            status: "attended",
          });
        }
      }

      // Fetch updated attendance count for signed-in users
      if (user) {
        const { count } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        setAttendanceCount(count || 0);
      }

      setSubmitted(true);
      setForm({
        secretCode: "",
        studentId: userProfile?.student_id || "",
      });
    } catch (err) {
      setError("[ERROR] Transmission failed. Retry.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center p-6">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center mx-auto mb-6 neon-box">
            <Check className="w-10 h-10 text-matrix" />
          </div>
          <div className="terminal-window max-w-md mx-auto">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                success
              </span>
            </div>
            <div className="terminal-body text-left">
              <p className="text-matrix mb-2">
                <span className="text-hack-cyan">[SUCCESS]</span> Attendance
                recorded
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Your attendance has been verified and logged in the system.
              </p>
              <div className="text-xs text-gray-600 mb-4">
                <span className="text-matrix">STATUS:</span> CONFIRMED |
                <span className="text-matrix ml-2">ID:</span>{" "}
                {userProfile?.student_id || form.studentId}
              </div>

              {/* User Profile Section */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex items-center gap-4 mb-4">
                  {userProfile.photo_url ? (
                    <img
                      src={userProfile.photo_url}
                      alt="Profile"
                      className="w-16 h-16 rounded-lg border border-matrix/40"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-matrix/10 border border-matrix/40 flex items-center justify-center">
                      <User className="w-8 h-8 text-matrix/50" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-matrix font-semibold text-lg">
                      {userProfile.display_name}
                    </p>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-matrix/5 border border-matrix/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-matrix mb-1">
                      {attendanceCount}
                    </div>
                    <div className="text-xs text-gray-500 font-terminal uppercase">
                      Total Meetings Attended
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button
              onClick={() => setSubmitted(false)}
              className="btn-hack rounded-lg inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              CHECK IN AGAIN
            </button>
            <Link
              to="/dashboard"
              className="btn-hack-filled rounded-lg inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <header
          className={`mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">
              ./attendance --check-in
            </span>
          </div>

          <h1 className="text-3xl font-bold neon-text tracking-tight mb-2">
            ATTENDANCE CHECK-IN
          </h1>
          <p className="text-gray-500">
            <span className="text-hack-cyan">[INFO]</span> Verify your
            attendance at club meetings
          </p>
        </header>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`space-y-6 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "200ms" }}
        >
          {/* User Identity Section */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                user_session.sh
              </span>
              <span className="ml-auto text-xs text-hack-cyan font-terminal">
                AUTHENTICATED
              </span>
            </div>
            <div className="terminal-body">
              <p className="text-xs text-gray-500 font-terminal mb-3">
                <span className="text-matrix">&gt;</span> Checking in as:
              </p>
              <div className="flex items-center gap-4">
                {userProfile.photo_url ? (
                  <img
                    src={userProfile.photo_url}
                    alt="Profile"
                    className="w-14 h-14 rounded-lg border border-matrix/40"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-matrix/10 border border-matrix/40 flex items-center justify-center">
                    <User className="w-7 h-7 text-matrix/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-matrix font-semibold text-lg truncate">
                    {userProfile.display_name}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 font-terminal">
                      <span className="text-matrix">ID:</span>{" "}
                      {userProfile.student_id}
                    </span>
                    <span className="text-gray-600 truncate">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secret Code */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                verify_code.sh
              </span>
            </div>
            <div className="terminal-body">
              <label className="block text-sm mb-2 text-gray-500 font-terminal">
                --secret-code
              </label>
              <input
                type="text"
                name="secretCode"
                value={form.secretCode}
                onChange={handleChange}
                required
                className="input-hack w-full rounded-lg font-mono uppercase"
                placeholder="Enter code from meeting"
                autoComplete="off"
              />
              <p className="text-xs mt-2 text-gray-600 font-terminal">
                <span className="text-matrix">&gt;</span> Enter the secret code
                provided during the meeting
              </p>
            </div>
          </div>

          {error && (
            <div className="text-hack-red text-sm font-terminal">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.secretCode.trim()}
            className="btn-hack-filled rounded-lg w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="animate-spin h-4 w-4" />
                VERIFYING...
              </span>
            ) : (
              "CHECK IN"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Attendance;
