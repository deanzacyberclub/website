import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Spinner, Check, Plus, ArrowLeft, User } from "@/lib/cyberIcon";

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
      // Use secure server-side function to verify secret code
      const { data: meetingData, error: lookupError } = await supabase
        .rpc("verify_meeting_secret_code", {
          secret_code_input: form.secretCode.trim(),
        })
        .single();

      if (lookupError || !meetingData) {
        setError("[ERROR] Invalid secret code");
        return;
      }

      // Extract meeting info from the secure function response
      const meeting = {
        id: meetingData.meeting_id,
        title: meetingData.meeting_title,
        date: meetingData.meeting_date,
        time: meetingData.meeting_time,
        location: meetingData.meeting_location,
      };

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
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center p-6">
        <div className="crt-overlay dark:opacity-100 opacity-0" />
        <div className="text-center relative z-10 max-w-2xl w-full">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 dark:bg-matrix/10 border-2 border-green-500 dark:border-matrix/50 flex items-center justify-center mx-auto mb-8">
            <Check className="w-12 h-12 text-green-600 dark:text-matrix" />
          </div>

          {/* Success Message */}
          <h1 className="font-mono font-bold text-green-700 dark:text-matrix text-4xl md:text-5xl mb-4 uppercase">
            CHECK-IN COMPLETE
          </h1>

          <div className="border-l-2 border-green-300 dark:border-matrix/30 pl-5 mb-8 text-left max-w-lg mx-auto">
            <p className="font-mono text-gray-600 dark:text-gray-400 text-sm">
              Your attendance has been verified and logged in the system.
            </p>
          </div>

          {/* User Profile */}
          {user && userProfile && (
            <div className="border border-gray-200 dark:border-matrix/20 p-6 mb-6 text-left">
              <div className="flex items-center gap-4 mb-6">
                {userProfile.photo_url ? (
                  <img
                    src={userProfile.photo_url}
                    alt="Profile"
                    className="w-16 h-16 border border-gray-300 dark:border-matrix/30"
                  />
                ) : (
                  <div className="w-16 h-16 bg-green-100 dark:bg-matrix/10 border border-gray-300 dark:border-matrix/30 flex items-center justify-center">
                    <User className="w-8 h-8 text-green-700 dark:text-matrix" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-green-700 dark:text-matrix font-mono font-semibold text-lg">
                    {userProfile.display_name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-500 text-sm font-mono">
                    {user.email}
                  </p>
                  <p className="text-gray-500 dark:text-gray-600 text-xs font-mono mt-1">
                    ID: {userProfile?.student_id || form.studentId}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 dark:border-matrix/20 pt-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-600 font-mono uppercase tracking-widest mb-2">
                    Total Meetings Attended
                  </p>
                  <div className="text-5xl font-bold font-mono text-green-700 dark:text-matrix">
                    {attendanceCount}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setSubmitted(false)}
              className="cli-btn-dashed font-mono inline-flex items-center justify-center gap-2 uppercase"
            >
              <Plus className="w-4 h-4" />
              CHECK IN AGAIN
            </button>
            <Link
              to="/dashboard"
              className="cli-btn-filled font-mono inline-flex items-center justify-center gap-2 uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay dark:opacity-100 opacity-0" />

      <div className="relative z-10">
        {/* Header with ASCII Background */}
        <header
          className={`min-h-[40vh] flex flex-col justify-center relative overflow-hidden mb-12 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* Background ASCII Art */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <pre className="font-mono text-[clamp(60px,15vw,200px)] leading-[0.85] text-green-200/20 dark:text-matrix/[0.03] whitespace-pre">
              {`██████╗  █████╗  ██████╗ ██████╗
██╔══██╗██╔══██╗██╔════╝██╔════╝
██║  ██║███████║██║     ██║
██║  ██║██╔══██║██║     ██║
██████╔╝██║  ██║╚██████╗╚██████╗
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝`}
            </pre>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6">
            <p className="font-mono text-sm text-gray-600 dark:text-matrix/60 mb-6">
              <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
              ./attendance --check-in
            </p>

            <h1 className="font-mono font-bold text-green-700 dark:text-matrix leading-tight mb-6">
              <span className="block text-5xl md:text-6xl lg:text-7xl">
                ATTENDANCE
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl">
                CHECK-IN
              </span>
            </h1>

            <div className="border-l-2 border-green-300 dark:border-matrix/30 pl-5 max-w-2xl">
              <p className="font-mono text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Verify your attendance at club meetings using the secret code
                provided during the session.
              </p>
            </div>
          </div>
        </header>

        {/* Form */}
        <div className="max-w-5xl mx-auto px-6">
          <form
            onSubmit={handleSubmit}
            className={`max-w-2xl space-y-8 pb-20 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "200ms" }}
          >
          {/* User Identity Section */}
          {user && userProfile ? (
            <div className="border border-gray-200 dark:border-matrix/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-600 dark:text-gray-500 font-mono uppercase tracking-widest">
                  User Session
                </p>
                <span className="text-xs text-green-600 dark:text-matrix font-mono">
                  AUTHENTICATED
                </span>
              </div>

              <div className="flex items-center gap-4">
                {userProfile.photo_url ? (
                  <img
                    src={userProfile.photo_url}
                    alt="Profile"
                    className="w-16 h-16 border border-gray-300 dark:border-matrix/30"
                  />
                ) : (
                  <div className="w-16 h-16 bg-green-100 dark:bg-matrix/10 border border-gray-300 dark:border-matrix/30 flex items-center justify-center">
                    <User className="w-8 h-8 text-green-700 dark:text-matrix" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-green-700 dark:text-matrix font-mono font-semibold text-lg truncate">
                    {userProfile.display_name}
                  </p>
                  <div className="flex items-center gap-4 text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-500 font-mono">
                      ID: {userProfile.student_id}
                    </span>
                    <span className="text-gray-500 dark:text-gray-600 truncate font-mono text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-matrix/20 p-6">
              <label className="block text-xs text-gray-600 dark:text-gray-500 font-mono uppercase tracking-widest mb-4">
                Student ID
              </label>
              <input
                type="text"
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                required
                maxLength={8}
                className="w-full px-4 py-3 bg-white dark:bg-terminal-bg border border-gray-300 dark:border-matrix/30 font-mono text-lg text-gray-900 dark:text-matrix focus:border-green-500 dark:focus:border-matrix focus:outline-none transition-colors"
                placeholder="12345678"
                autoComplete="off"
              />
              <p className="text-xs mt-3 text-gray-500 dark:text-gray-600 font-mono">
                <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
                Enter your 8-digit student ID
              </p>
            </div>
          )}

          {/* Secret Code */}
          <div className="border border-gray-200 dark:border-matrix/20 p-6">
            <label className="block text-xs text-gray-600 dark:text-gray-500 font-mono uppercase tracking-widest mb-4">
              Secret Code
            </label>
            <input
              type="text"
              name="secretCode"
              value={form.secretCode}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white dark:bg-terminal-bg border border-gray-300 dark:border-matrix/30 font-mono uppercase text-lg text-gray-900 dark:text-matrix focus:border-green-500 dark:focus:border-matrix focus:outline-none transition-colors"
              placeholder="ENTER CODE"
              autoComplete="off"
            />
            <p className="text-xs mt-3 text-gray-500 dark:text-gray-600 font-mono">
              <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
              Enter the secret code provided during the meeting
            </p>
          </div>

          {error && (
            <div className="text-red-600 dark:text-hack-red text-sm font-mono border-l-2 border-red-500 dark:border-hack-red pl-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.secretCode.trim()}
            className="cli-btn-filled w-full justify-center font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

export default Attendance;
