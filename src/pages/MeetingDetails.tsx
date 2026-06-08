import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useOfficerVerification } from "@/hooks/useOfficerVerification";
import type { Meeting, Resource, Attendance } from "@/types/database.types";
import {
  Spinner,
  Close,
  Edit,
  Plus,
  Trash,
  Calendar,
  MapPin,
  Key,
  Eye,
  EyeOff,
  Fullscreen,
  Download,
  Link as LinkIcon,
  Slides,
  Play,
  ExternalLink,
  CheckCircle,
  Users,
} from "@/lib/cyberIcon";

const DISCORD_RESOURCE: Resource = {
  id: "discord-default",
  title: "Join Discord",
  url: "https://discord.gg/v5JWDrZVNp",
  type: "link",
};

function ensureDiscordResource(resources: Resource[]): Resource[] {
  const hasDiscord = resources.some((r) =>
    r.url.includes("discord.gg/v5JWDrZVNp"),
  );
  if (hasDiscord) return resources;
  return [DISCORD_RESOURCE, ...resources];
}

interface UserProfile {
  id: string;
  display_name: string;
  photo_url: string | null;
  email: string;
}

interface AttendeeWithUser extends Attendance {
  user?: UserProfile;
}

type TabType = "resources";

interface EditForm {
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  topics: string;
  secret_code: string;
  resources: Resource[];
}

function isWithinCheckInWindow(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return eventDate >= sevenDaysAgo && eventDate <= tomorrow;
}

function MeetingDetails({
  slug: propSlug,
  embedded = false,
  onClose,
  onSelectMeeting,
  availableTopics: _availableTopics,
  onTitleLoad,
}: {
  slug?: string;
  embedded?: boolean;
  onClose?: () => void;
  onSelectMeeting?: (slug: string) => void;
  availableTopics?: string[];
  onTitleLoad?: (title: string) => void;
} = {}) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = propSlug || routeSlug;
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { isVerifiedOfficer } = useOfficerVerification();
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("resources");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [codeFullscreen, setCodeFullscreen] = useState(false);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Attendance state
  const [myAttendance, setMyAttendance] = useState<Attendance | null>(null);
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);

  // Check-in form state
  const [checkInCode, setCheckInCode] = useState("");
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isOfficer = isVerifiedOfficer ?? false;

  useEffect(() => {
    async function fetchRichMeetingPageData() {
      if (!slug) return;

      setLoading(true);
      try {
        const { data: rawData, error } = await supabase.rpc(
          "get_meeting_page_data",
          {
            p_slug: slug,
          },
        );

        if (error) throw error;
        const data = rawData as any;
        if (data?.error === "not_found") {
          setMeeting(null);
          return;
        }

        if (data?.meeting) {
          setMeeting(data.meeting as Meeting);
          onTitleLoad?.(data.meeting.title);
        }

        setMyAttendance(data?.my_attendance ?? null);

        if (data?.attendees) {
          setAttendees(
            (data.attendees as any[]).map((a) => ({
              ...a,
              user: a.user as UserProfile | undefined,
            })) as AttendeeWithUser[],
          );
        } else {
          setAttendees([]);
        }
      } catch (err) {
        console.error("get_meeting_page_data failed, falling back:", err);
        try {
          const { data, error } = await supabase
            .from("meetings_public")
            .select("*")
            .eq("slug", slug)
            .single();

          if (error) throw error;
          setMeeting({ ...data, secret_code: null } as Meeting);
        } catch (fallbackErr) {
          console.error("Fallback fetch failed:", fallbackErr);
          setMeeting(null);
        }
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }

    fetchRichMeetingPageData();
  }, [slug]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && codeFullscreen) {
        setCodeFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [codeFullscreen]);

  const tabs: TabType[] = ["resources"];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      const currentIndex = tabs.indexOf(activeTab);
      if (diff > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const isPast = (dateStr: string) => {
    return parseLocalDate(dateStr) < today;
  };

  const handleCheckIn = async () => {
    if (!meeting) return;
    if (!user) {
      navigate(`/auth?to=/home?meeting=${encodeURIComponent(slug || "")}`);
      return;
    }

    setCheckInSubmitting(true);
    setCheckInMessage(null);

    try {
      // Verify the code and 7-day window via RPC
      const { data: verifyRows, error: verifyError } = await supabase.rpc(
        "verify_meeting_secret_code",
        { secret_code_input: checkInCode },
      );

      if (verifyError) throw verifyError;

      const rows = verifyRows as any;
      const matched = Array.isArray(rows) ? rows[0] : rows;

      if (!matched || matched.meeting_id !== meeting.id) {
        setCheckInMessage({
          type: "error",
          text: "Invalid code. Make sure you're entering the code for this event.",
        });
        return;
      }

      // Insert attendance record
      const { data: newAttendance, error: insertError } = await supabase
        .from("attendance")
        .insert({
          meeting_id: meeting.id,
          user_id: user.id,
          student_id: userProfile?.student_id || "N/A",
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          // Already checked in (unique constraint)
          const { data: existing } = await supabase
            .from("attendance")
            .select("*")
            .eq("meeting_id", meeting.id)
            .eq("user_id", user.id)
            .single();
          if (existing) setMyAttendance(existing);
          setCheckInMessage({ type: "success", text: "Already checked in!" });
          return;
        }
        throw insertError;
      }

      setMyAttendance(newAttendance);
      setCheckInMessage({ type: "success", text: "Checked in successfully!" });
      setCheckInCode("");
      // Refresh attendees list
      setAttendees((prev) => [
        { ...newAttendance, user: userProfile as any },
        ...prev,
      ]);
    } catch (err) {
      console.error("Check-in error:", err);
      setCheckInMessage({
        type: "error",
        text: "Failed to check in. Please try again.",
      });
    } finally {
      setCheckInSubmitting(false);
    }
  };

  const startEditing = async () => {
    if (!meeting) return;
    setEditForm({
      slug: meeting.slug,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location,
      topics: meeting.topics?.join(", ") || "",
      secret_code: meeting.secret_code || "",
      resources: ensureDiscordResource(
        meeting.resources ? [...meeting.resources] : [],
      ),
    });
    setEditError("");
    setIsEditing(true);
  };

  const generateId = () => crypto.randomUUID();

  const addResource = () => {
    if (!editForm) return;
    const newResource: Resource = {
      id: generateId(),
      title: "",
      url: "",
      type: "link",
    };
    setEditForm({
      ...editForm,
      resources: [...editForm.resources, newResource],
    });
  };

  const updateResource = (id: string, field: keyof Resource, value: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      resources: editForm.resources.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    });
  };

  const deleteResource = (id: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      resources: editForm.resources.filter((r) => r.id !== id),
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
    setEditError("");
  };

  const handleEditChange = (
    field: keyof EditForm,
    value: string | boolean | number | null,
  ) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const saveChanges = async () => {
    if (!meeting || !editForm) return;

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(editForm.slug)) {
      setEditError(
        'Slug must be lowercase letters, numbers, and hyphens only (e.g., "my-meeting")',
      );
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      const topicsArray = editForm.topics
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const resourcesWithDiscord = ensureDiscordResource(editForm.resources);
      const validResources = resourcesWithDiscord.filter(
        (r) => r.title.trim() && r.url.trim(),
      );

      const { data, error } = await supabase
        .rpc("officer_update_meeting", {
          meeting_id: meeting.id,
          p_slug: editForm.slug,
          p_title: editForm.title,
          p_description: editForm.description,
          p_date: editForm.date,
          p_time: editForm.time,
          p_location: editForm.location,
          p_topics: topicsArray,
          p_secret_code: editForm.secret_code || null,
          p_resources: validResources as any,
        })
        .single();

      if (error) throw error;

      setMeeting(data as unknown as Meeting);
      setIsEditing(false);
      setEditForm(null);

      if (editForm.slug !== slug) {
        if (embedded && onSelectMeeting) {
          onSelectMeeting(editForm.slug);
        } else {
          navigate(`/home?meeting=${editForm.slug}`, { replace: true });
        }
      }
    } catch (err) {
      console.error("Error saving meeting:", err);
      if (err instanceof Error && err.message.includes("duplicate")) {
        setEditError(
          "This slug is already in use. Please choose a different one.",
        );
      } else {
        setEditError("Failed to save changes. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!meeting && !loading) {
    return (
      <div
        className={
          embedded
            ? "bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix"
            : "bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix min-h-screen"
        }
      >
        <div
          className={embedded ? "px-4 py-4" : "relative max-w-4xl mx-auto px-6"}
        >
          <header className="mb-12">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">
                  error
                </span>
              </div>
              <div className="terminal-body text-center py-12">
                <div className="text-4xl mb-4 text-red-600 dark:text-hack-red">
                  404
                </div>
                <p className="text-gray-600 dark:text-gray-500 mb-2">
                  <span className="text-red-600 dark:text-hack-red">
                    [ERROR]
                  </span>{" "}
                  Meeting not found
                </p>
                <p className="text-gray-500 dark:text-gray-600 text-sm mb-6">
                  The meeting you're looking for doesn't exist or has been
                  removed.
                </p>
                <button
                  onClick={() => {
                    if (embedded && onClose) {
                      onClose();
                    } else {
                      navigate("/home");
                    }
                  }}
                  className="cli-btn-dashed px-6 py-2"
                >
                  Browse All Meetings
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix"
          : "bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix min-h-screen"
      }
    >
      {/* Fullscreen Attendance Code Overlay */}
      {codeFullscreen && meeting?.secret_code && (
        <div
          className="fixed inset-0 z-50 bg-white dark:bg-terminal-bg flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setCodeFullscreen(false)}
        >
          <div className="text-center">
            <div className="text-sm text-purple-600 dark:text-hack-purple uppercase font-terminal mb-4 tracking-widest">
              Attendance Code
            </div>
            <div className="text-6xl sm:text-8xl md:text-9xl font-bold font-mono text-purple-600 dark:text-hack-purple tracking-widest neon-text animate-pulse">
              {meeting.secret_code}
            </div>
            <div className="mt-8 text-gray-600 dark:text-gray-500 text-sm font-terminal">
              Click anywhere or press ESC to close
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCodeFullscreen(false);
            }}
            className="absolute top-6 right-6 p-3 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <Close className="w-6 h-6" />
          </button>
        </div>
      )}

      <div
        className={embedded ? "px-4 py-4" : "relative max-w-4xl mx-auto px-6"}
      >
        {/* Header - always visible immediately for stable layout */}
        <header className={`mb-8 ${embedded ? "hidden" : ""}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-blue-600 dark:text-matrix neon-text-subtle">
              $
            </span>
            <span className="text-gray-600 dark:text-gray-400 font-terminal">
              cat ./meetings/{slug}/README.md
            </span>
          </div>
        </header>

        {/* Main Content */}
        <article
          className={`mb-12 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner className="animate-spin h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
            ) : isEditing && editForm ? (
              /* Edit Mode */
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">
                    edit_meeting.sh
                  </span>
                </div>
                <div className="terminal-body">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-matrix">
                        Edit Meeting
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEditing}
                          disabled={saving}
                          className="px-4 py-2 text-sm font-terminal text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50"
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={saveChanges}
                          disabled={saving}
                          className="px-4 py-2 text-sm font-terminal bg-blue-50 dark:bg-matrix/20 text-blue-600 dark:text-matrix border border-blue-300 dark:border-matrix hover:bg-blue-100 dark:hover:bg-matrix/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving && (
                            <Spinner className="animate-spin h-4 w-4" />
                          )}
                          {saving ? "SAVING..." : "SAVE"}
                        </button>
                      </div>
                    </div>

                    {editError && (
                      <div className="p-3 bg-red-50 dark:bg-hack-red/10 border border-red-300 dark:border-hack-red/50 text-red-600 dark:text-hack-red text-sm">
                        {editError}
                      </div>
                    )}

                    {/* Slug */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">
                        URL SLUG
                      </label>
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) =>
                          handleEditChange(
                            "slug",
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          )
                        }
                        className="input-hack w-full"
                        placeholder="my-meeting"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                        /meetings/{editForm.slug}
                      </p>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
                        TITLE
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          handleEditChange("title", e.target.value)
                        }
                        className="input-hack w-full"
                        placeholder="Meeting title"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
                        DESCRIPTION
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          handleEditChange("description", e.target.value)
                        }
                        className="input-hack w-full min-h-[100px] resize-y"
                        placeholder="Meeting description"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Date */}
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">
                          DATE
                        </label>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) =>
                            handleEditChange("date", e.target.value)
                          }
                          className="input-hack w-full"
                        />
                      </div>

                      {/* Time */}
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">
                          TIME
                        </label>
                        <input
                          type="text"
                          value={editForm.time}
                          onChange={(e) =>
                            handleEditChange("time", e.target.value)
                          }
                          className="input-hack w-full"
                          placeholder="4:00 PM - 6:00 PM"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
                        LOCATION
                      </label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) =>
                          handleEditChange("location", e.target.value)
                        }
                        className="input-hack w-full"
                        placeholder="S43 Room 120"
                      />
                    </div>

                    {/* Topics */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
                        TOPICS (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editForm.topics}
                        onChange={(e) =>
                          handleEditChange("topics", e.target.value)
                        }
                        className="input-hack w-full"
                        placeholder="Security, Hacking, CTF"
                      />
                    </div>

                    {/* Attendance Code */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">
                        ATTENDANCE CODE
                      </label>
                      <input
                        type="text"
                        value={editForm.secret_code}
                        onChange={(e) =>
                          handleEditChange(
                            "secret_code",
                            e.target.value.toUpperCase(),
                          )
                        }
                        className="input-hack w-full font-mono"
                        placeholder="SECRETCODE"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                        Members enter this code to check in during the event
                      </p>
                    </div>

                    {/* Attendees List (read-only in edit mode) */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Attendees ({attendees.length})
                        </h4>
                      </div>

                      {attendees.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-500 text-sm">
                          No check-ins yet
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {attendees.map((att) => (
                            <Link
                              key={att.id}
                              to={`/@/${att.user_id}`}
                              className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 hover:border-matrix/50 hover:bg-matrix/5 transition-all group"
                            >
                              <div className="shrink-0">
                                {att.user?.photo_url ? (
                                  <img
                                    src={att.user.photo_url}
                                    alt={att.user.display_name}
                                    className="w-10 h-10 object-cover border border-gray-300 dark:border-gray-600 group-hover:border-matrix/40 transition-colors"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 flex items-center justify-center border border-gray-400 dark:border-gray-600 group-hover:border-matrix/40 transition-colors">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">
                                      {att.user?.display_name
                                        ?.charAt(0)
                                        .toUpperCase() || "?"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-matrix transition-colors">
                                  {att.user?.display_name || "Unknown User"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {new Date(att.checked_in_at).toLocaleString()}
                                </div>
                              </div>
                              <span className="text-xs px-2 py-0.5 border border-matrix/40 text-matrix bg-matrix/10 font-terminal">
                                ATTENDED
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resources Editor */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-yellow-600 dark:text-hack-yellow">
                          Resources
                        </h3>
                        <button
                          type="button"
                          onClick={addResource}
                          className="text-xs font-terminal text-yellow-600 dark:text-hack-yellow hover:text-yellow-700 dark:hover:text-hack-yellow/80 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          ADD
                        </button>
                      </div>
                      {editForm.resources.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-500 text-sm">
                          No resources yet
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {editForm.resources.map((resource) => (
                            <div
                              key={resource.id}
                              className="p-4 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <input
                                  type="text"
                                  value={resource.title}
                                  onChange={(e) =>
                                    updateResource(
                                      resource.id,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  className="input-hack flex-1 text-sm"
                                  placeholder="Resource title"
                                />
                                <button
                                  type="button"
                                  onClick={() => deleteResource(resource.id)}
                                  className="ml-2 p-1 text-gray-600 dark:text-gray-500 hover:text-red-600 dark:hover:text-hack-red transition-colors"
                                >
                                  <Trash className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <input
                                  type="url"
                                  value={resource.url}
                                  onChange={(e) =>
                                    updateResource(
                                      resource.id,
                                      "url",
                                      e.target.value,
                                    )
                                  }
                                  className="input-hack w-full text-sm"
                                  placeholder="https://example.com/resource"
                                />
                                <select
                                  value={resource.type}
                                  onChange={(e) =>
                                    updateResource(
                                      resource.id,
                                      "type",
                                      e.target.value,
                                    )
                                  }
                                  className="input-hack w-full text-sm"
                                >
                                  <option value="link">Link</option>
                                  <option value="slides">Slides</option>
                                  <option value="video">Video</option>
                                  <option value="file">File</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : meeting ? (
              /* View Mode */
              <>
                {/* Officer edit button */}
                {isOfficer && (
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={startEditing}
                      className="text-xs text-cyan-600 dark:text-hack-cyan hover:text-cyan-700 dark:hover:text-hack-cyan/80 font-terminal flex items-center gap-2 transition-colors px-3 py-1.5 border border-cyan-200 dark:border-hack-cyan/40 hover:border-cyan-400 dark:hover:border-hack-cyan/70"
                    >
                      <Edit className="w-3 h-3" />
                      EDIT MEETING
                    </button>
                  </div>
                )}

                {/* Big Title */}
                <h1 className="text-[28px] md:text-[34px] leading-tight font-semibold tracking-[-0.5px] text-white mb-4">
                  {meeting.title}
                </h1>

                {/* Date + Time */}
                <div className="flex items-center gap-2 text-white/90 mb-5 text-[15px]">
                  <Calendar className="w-4 h-4 text-white/60" />
                  <span>
                    {(() => {
                      const d = parseLocalDate(meeting.date);
                      return d.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      });
                    })()}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="font-mono text-sm text-white/70">
                    {meeting.time}
                  </span>
                </div>

                {/* Location Card */}
                <div
                  onClick={() =>
                    window.open("https://maps.apple/p/VvLMJzG~DAkT7d", "_blank")
                  }
                  className="mb-6 rounded-2xl overflow-hidden border border-[#222] bg-[#0a0a0a] cursor-pointer active:scale-[0.985] transition-all"
                >
                  <div className="relative h-[130px] bg-[#0f1f2e] flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#1a2a3a_0.6px,transparent_1px)] bg-[length:3px_3px]" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-[#ff3b5c] shadow-[0_0_0_8px_rgba(255,59,92,0.25)] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-[#111] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">
                        {meeting.location}
                      </div>
                      <div className="text-xs text-white/50">
                        Cupertino, California
                      </div>
                    </div>
                    <div className="text-xs px-3 py-1 rounded-md bg-white/5 text-white/70">
                      OPEN IN MAPS
                    </div>
                  </div>
                </div>

                {/* Officer Secret Code Card */}
                {isOfficer && meeting.secret_code && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-hack-purple/40 bg-[#0d0a14] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-hack-purple" />
                        <span className="text-xs font-terminal text-hack-purple uppercase tracking-widest">
                          Attendance Code (For Officers)
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCodeRevealed(!codeRevealed)}
                          className="p-1.5 bg-hack-purple/20 text-hack-purple hover:bg-hack-purple/30 transition-colors rounded"
                          title={codeRevealed ? "Hide code" : "Reveal code"}
                        >
                          {codeRevealed ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setCodeRevealed(true);
                            setCodeFullscreen(true);
                          }}
                          className="p-1.5 bg-hack-purple/20 text-hack-purple hover:bg-hack-purple/30 transition-colors rounded"
                          title="Fullscreen"
                        >
                          <Fullscreen className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div
                      className={`text-3xl font-bold font-mono text-hack-purple tracking-widest transition-all select-none ${!codeRevealed ? "blur-sm" : ""}`}
                    >
                      {codeRevealed ? meeting.secret_code : "XXXXXXXXX"}
                    </div>
                  </div>
                )}

                {/* Attendance Status / Check-in Card */}
                {myAttendance ? (
                  /* Always show CHECKED IN, even for old events */
                  <div className="mb-8 rounded-2xl border border-emerald-900/60 bg-emerald-950/40 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium tracking-wider text-emerald-400">
                        CHECKED IN
                      </span>
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      {new Date(myAttendance.checked_in_at).toLocaleString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </div>
                  </div>
                ) : isWithinCheckInWindow(meeting.date) ? (
                  /* Within 7-day window — show check-in form */
                  <div className="mb-8 rounded-2xl border border-[#222] bg-[#111] p-5">
                    <div className="space-y-3">
                      {checkInMessage && (
                        <div
                          className={`text-sm ${
                            checkInMessage.type === "success"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {checkInMessage.text}
                        </div>
                      )}
                      <div className="text-xs text-white/50 mb-2 font-terminal uppercase tracking-widest">
                        {isPast(meeting.date)
                          ? "Event Check-in (7-day window)"
                          : "Check In"}
                      </div>
                      <input
                        type="text"
                        value={checkInCode}
                        onChange={(e) =>
                          setCheckInCode(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          !checkInSubmitting &&
                          checkInCode &&
                          handleCheckIn()
                        }
                        placeholder="ENTER CODE"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 font-mono text-lg tracking-widest focus:outline-none focus:border-white/20"
                        disabled={checkInSubmitting}
                      />
                      <button
                        onClick={handleCheckIn}
                        disabled={checkInSubmitting || !checkInCode.trim()}
                        className="w-full py-3 text-lg font-medium rounded-2xl bg-white text-black active:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                      >
                        {checkInSubmitting ? "Checking in..." : "Check In"}
                      </button>
                      <a
                        href="https://discord.gg/v5JWDrZVNp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2 text-sm text-center text-white/50 hover:text-white/80 transition-colors"
                      >
                        Join Discord →
                      </a>
                    </div>
                  </div>
                ) : isPast(meeting.date) ? (
                  /* Past event, 7-day window expired, no check-in */
                  <div className="mb-8 rounded-2xl border border-red-900/40 bg-[#0f0808] p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-red-400 text-base leading-none">
                        ✗
                      </span>
                      <span className="text-sm font-medium tracking-wider text-red-400">
                        NOT CHECKED IN
                      </span>
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      {(() => {
                        const [y, m, d] = meeting.date.split("-").map(Number);
                        const deadline = new Date(y, m - 1, d + 7);
                        return `Check-in deadline passed on ${deadline.toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}`;
                      })()}
                    </div>
                  </div>
                ) : (
                  /* Future event, window not open yet */
                  <div className="mb-8 rounded-2xl border border-[#222] bg-[#111] p-5">
                    <div className="text-xs text-white/40 mb-3 font-terminal uppercase tracking-widest">
                      Upcoming Event
                    </div>
                    <a
                      href="https://discord.gg/v5JWDrZVNp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2 text-sm text-center text-white/50 hover:text-white/80 transition-colors"
                    >
                      Join Discord for updates →
                    </a>
                  </div>
                )}

                {/* Guests / Attendees */}
                {attendees.length > 0 && (
                  <div className="mb-8">
                    <div className="text-sm font-medium text-white/80 mb-3">
                      Guests{" "}
                      <span className="text-white/50">
                        ({attendees.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 rounded-2xl border border-[#222] bg-[#111] p-4">
                      {attendees.slice(0, 20).map((a, i) => {
                        const name = a.user?.display_name;
                        const parts = name?.trim().split(/\s+/) ?? [];
                        const shortLabel =
                          parts.length > 1
                            ? `${parts[0]} ${parts[parts.length - 1][0]}`
                            : (parts[0] ?? "Guest");

                        const avatarContent = (
                          <>
                            {a.user?.photo_url ? (
                              <img
                                src={a.user.photo_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-matrix/20 flex items-center justify-center text-xs text-matrix">
                                {(name || "G")[0]}
                              </div>
                            )}
                          </>
                        );

                        return (
                          <div key={i} className="group relative">
                            {a.user_id ? (
                              <Link
                                to={`/@/${a.user_id}`}
                                className="block w-10 h-10 rounded-full overflow-hidden border-2 border-[#222] bg-[#0a0a0a] hover:border-white/30 transition-colors"
                              >
                                {avatarContent}
                              </Link>
                            ) : (
                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#222] bg-[#0a0a0a]">
                                {avatarContent}
                              </div>
                            )}
                            {/* Tooltip — outside overflow-hidden, desktop only */}
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-black text-white rounded whitespace-nowrap z-50 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                              {shortLabel}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* About */}
                <div className="mb-8 text-[15px] text-white/85 leading-relaxed">
                  <div className="uppercase text-xs tracking-[1px] text-white/50 mb-2">
                    About Event
                  </div>
                  <p>{meeting.description}</p>
                </div>

                {/* Topics */}
                {meeting.topics && meeting.topics.length > 0 && (
                  <div className="mb-8">
                    <div className="text-xs text-gray-500 uppercase font-terminal mb-3">
                      Topics Covered
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {meeting.topics.map((topic) => (
                        <Link
                          key={topic}
                          to={`/home?q=${encodeURIComponent(topic)}`}
                          className="px-3 py-1.5 text-sm bg-terminal-alt border border-gray-700 text-gray-300 hover:border-matrix/50 hover:text-matrix transition-colors cursor-pointer"
                        >
                          {topic}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Event - Attendance Summary */}
                {isPast(meeting.date) && attendees.length > 0 && (
                  <div className="pt-6 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-matrix/10">
                        <Users className="w-5 h-5 text-matrix" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {attendees.length}{" "}
                          {attendees.length === 1 ? "person" : "people"}{" "}
                          attended
                        </h3>
                        <p className="text-sm text-gray-500">
                          Event participants
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {attendees.map((attendee) => (
                        <Link
                          key={attendee.id}
                          to={`/@/${attendee.user_id}`}
                          className="flex items-center gap-2 p-2 bg-terminal-alt border border-gray-800 hover:border-matrix/50 hover:bg-matrix/5 transition-all group"
                        >
                          {attendee.user?.photo_url ? (
                            <img
                              src={attendee.user.photo_url}
                              alt={attendee.user.display_name}
                              className="w-8 h-8 object-cover border border-gray-600 group-hover:border-matrix/40 transition-colors"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-700 flex items-center justify-center border border-gray-600 group-hover:border-matrix/40 transition-colors">
                              <span className="text-gray-400 text-xs font-bold">
                                {attendee.user?.display_name
                                  ?.charAt(0)
                                  .toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-gray-300 truncate group-hover:text-matrix transition-colors">
                            {attendee.user?.display_name || "Unknown"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </>
        </article>

        {/* Resources Section */}
        {!loading &&
          !isEditing &&
          meeting?.resources &&
          meeting.resources.length > 0 && (
            <section
              className={`mb-12 transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-matrix neon-text-subtle text-lg">$</span>
                <span className="text-gray-400 font-terminal">
                  ls ./meetings/{slug}/
                </span>
              </div>

              <div className="text-sm text-gray-400 mb-2 font-terminal">
                RESOURCES
              </div>

              <div
                ref={tabContainerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="terminal-window"
              >
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">
                    {activeTab}
                  </span>
                </div>
                <div className="terminal-body min-h-[120px]">
                  {activeTab === "resources" && (
                    <div className="space-y-3">
                      {meeting.resources && meeting.resources.length > 0 ? (
                        meeting.resources.map((resource) => (
                          <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 bg-terminal-alt border border-gray-800 hover:border-hack-yellow/50 transition-colors group"
                          >
                            <div className="p-2 bg-hack-yellow/10 text-hack-yellow">
                              {resource.type === "slides" && (
                                <Slides className="w-5 h-5" />
                              )}
                              {resource.type === "video" && (
                                <Play className="w-5 h-5" />
                              )}
                              {resource.type === "link" && (
                                <LinkIcon className="w-5 h-5" />
                              )}
                              {resource.type === "file" && (
                                <Download className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-200 group-hover:text-hack-yellow transition-colors">
                                {resource.title}
                              </h4>
                              <p className="text-xs text-gray-500 uppercase">
                                {resource.type}
                              </p>
                            </div>
                            <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-hack-yellow group-hover:translate-x-1 transition-all" />
                          </a>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Download className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                          <p className="text-gray-500 text-sm">
                            No resources yet
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
      </div>
    </div>
  );
}

export default MeetingDetails;
