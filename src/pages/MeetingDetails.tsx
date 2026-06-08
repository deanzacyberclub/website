import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useOfficerVerification } from "@/hooks/useOfficerVerification";
import type {
  Meeting,
  Resource,
  Registration,
  RegistrationType,
} from "@/types/database.types";
import {
  Spinner,
  Close,
  Edit,
  Plus,
  Trash,
  Calendar,
  Clock,
  MapPin,
  Star,
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
import {
  registerForMeeting,
  cancelRegistration,
  getUserRegistration,
  getRegistrationCount,
  getWaitlistCount,
} from "@/lib/registrations";
import ConfirmDialog from "@/components/ConfirmDialog";

// Discord is the canonical place for announcements now.
// We always ensure this resource exists on meetings.
const DISCORD_RESOURCE: Resource = {
  id: "discord-default",
  title: "Join Discord",
  url: "https://discord.gg/v5JWDrZVNp",
  type: "link",
};

function ensureDiscordResource(resources: Resource[]): Resource[] {
  const hasDiscord = resources.some((r) =>
    r.url.includes("discord.gg/v5JWDrZVNp")
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

interface RegistrationWithUser extends Registration {
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
  featured: boolean;
  topics: string;
  secret_code: string;
  registration_type: RegistrationType;
  registration_capacity: number | null;
  invite_code: string;
  invite_form_url: string;
  resources: Resource[];
}

function MeetingDetails({
  slug: propSlug,
  embedded = false,
  onClose,
  onSelectMeeting,
  availableTopics,
}: {
  slug?: string;
  embedded?: boolean;
  onClose?: () => void;
  onSelectMeeting?: (slug: string) => void;
  availableTopics?: string[];
} = {}) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = propSlug || routeSlug;
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { isVerifiedOfficer, isLoading: verifyingOfficer } = useOfficerVerification();
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("resources");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [relatedMeetings, setRelatedMeetings] = useState<Meeting[]>([]);
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

  // Registration state
  const [userRegistration, setUserRegistration] = useState<Registration | null>(
    null,
  );
  const [registrationCount, setRegistrationCount] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [showInviteCodeInput, setShowInviteCodeInput] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<
    RegistrationWithUser[]
  >([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [pastEventAttendees, setPastEventAttendees] = useState<
    RegistrationWithUser[]
  >([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Use server-verified officer status instead of client-side state
  const isOfficer = isVerifiedOfficer ?? false;

  // Fast path: Use the new consolidated RPC for the entire meeting page payload in one roundtrip.
  // Falls back to the classic public + related queries if the RPC isn't available yet (dev / partial deploy).
  // This collapses: meeting + related + my reg + counts + (past) attendees + officer secrets into 1 call.
  useEffect(() => {
    async function fetchRichMeetingPageData() {
      if (!slug) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_meeting_page_data", {
          p_slug: slug,
        });

        if (error) throw error;
        if (data?.error === "not_found") {
          setMeeting(null);
          return;
        }

        // The RPC already returns the correct shape (secrets only for officers)
        if (data?.meeting) {
          setMeeting(data.meeting as Meeting);
        }

        // Embedded data from the single call
        if (data?.my_registration) {
          setUserRegistration(data.my_registration as Registration);
        } else {
          setUserRegistration(null);
        }

        setRegistrationCount(data?.registration_count ?? 0);
        setWaitlistCount(data?.waitlist_count ?? 0);

        if (data?.related_meetings) {
          setRelatedMeetings(data.related_meetings as Meeting[]);
        }

        if (data?.attendees) {
          // The RPC already joins public profile info into `user`
          setPastEventAttendees(
            (data.attendees as any[]).map((a) => ({
              ...a,
              user: a.user as UserProfile | undefined,
            })) as RegistrationWithUser[],
          );
        } else {
          setPastEventAttendees([]);
        }
      } catch (err) {
        console.error(
          "Rich meeting page RPC failed, falling back to classic queries:",
          err,
        );

        // === FALLBACK: original behavior (multiple roundtrips) ===
        try {
          const { data, error } = await supabase
            .from("meetings_public")
            .select("*")
            .eq("slug", slug)
            .single();

          if (error) throw error;
          setMeeting(data);

          if (data) {
            const { data: related } = await supabase
              .from("meetings_public")
              .select("*")
              .neq("slug", slug)
              .order("date", { ascending: false })
              .limit(3);
            setRelatedMeetings(related || []);
          }
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

  // NOTE: The registration + attendees data is now populated by the rich
  // get_meeting_page_data() RPC in the effect above. These two effects are
  // intentionally disabled for the initial load path (massive speedup).
  //
  // Post-mutation refresh (register/cancel/accept) still uses the small helpers
  // in the action handlers — those are fine (user-initiated, small payload).
  //
  // If you need to re-enable the old behavior for any reason, just restore the bodies.

  // (Disabled duplicate fetch effect — data comes from get_meeting_page_data)
  // useEffect(() => { ...fetchRegistrationData... }, [meeting, user]);

  // (Disabled duplicate fetch effect — attendees come from get_meeting_page_data)
  // useEffect(() => { ...fetchPastEventAttendees... }, [meeting]);

  // ESC key to close fullscreen code
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

  // Parse date string as local timezone (not UTC)
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const isPast = (dateStr: string) => {
    return parseLocalDate(dateStr) < today;
  };

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRegister = async () => {
    if (!meeting || !user) {
      // After login, come back to the dashboard with the meeting sheet open
      const returnTo = `/dashboard?meeting=${encodeURIComponent(slug || "")}`;
      navigate(`/auth?to=${returnTo}`);
      return;
    }

    setRegistering(true);
    setRegistrationMessage(null);

    const result = await registerForMeeting(
      meeting.id,
      user.id,
      meeting,
      inviteCode,
    );

    if (result.success) {
      setUserRegistration(result.registration || null);
      setRegistrationMessage({ type: "success", text: result.message });
      setShowInviteCodeInput(false);
      setInviteCode("");

      // Refresh counts
      const count = await getRegistrationCount(meeting.id);
      setRegistrationCount(count);
      const wCount = await getWaitlistCount(meeting.id);
      setWaitlistCount(wCount);
    } else {
      setRegistrationMessage({ type: "error", text: result.message });
    }

    setRegistering(false);
  };

  const handleCancelRegistration = async () => {
    if (!meeting || !user) return;

    setRegistering(true);
    setCancelError("");

    const result = await cancelRegistration(meeting.id, user.id);

    if (result.success) {
      setUserRegistration(null);
      setRegistrationMessage({ type: "success", text: result.message });
      setShowCancelDialog(false);

      // Refresh counts
      const count = await getRegistrationCount(meeting.id);
      setRegistrationCount(count);
      const wCount = await getWaitlistCount(meeting.id);
      setWaitlistCount(wCount);
    } else {
      setCancelError(result.message);
    }

    setRegistering(false);
  };

  const handleAcceptInvite = async () => {
    if (!meeting || !user || !userRegistration) return;

    setRegistering(true);
    setRegistrationMessage(null);

    try {
      const { data, error } = await supabase
        .from("registrations")
        .update({ status: "registered" })
        .eq("id", userRegistration.id)
        .select()
        .single();

      if (error) throw error;

      setUserRegistration(data);
      setRegistrationMessage({ type: "success", text: "You have accepted the invite!" });

      // Refresh counts
      const count = await getRegistrationCount(meeting.id);
      setRegistrationCount(count);
    } catch (err) {
      console.error("Error accepting invite:", err);
      setRegistrationMessage({ type: "error", text: "Failed to accept invite. Please try again." });
    }

    setRegistering(false);
  };

  const handleDeclineInvite = async () => {
    if (!meeting || !user) return;

    setRegistering(true);
    setRegistrationMessage(null);

    const result = await cancelRegistration(meeting.id, user.id);

    if (result.success) {
      setUserRegistration(null);
      setRegistrationMessage({ type: "success", text: "Invite declined" });
    } else {
      setRegistrationMessage({ type: "error", text: result.message });
    }

    setRegistering(false);
  };

  const isAtCapacity = meeting?.registration_capacity
    ? registrationCount >= meeting.registration_capacity
    : false;

  const startEditing = async () => {
    if (!meeting) return;
    setEditForm({
      slug: meeting.slug,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location,
      featured: meeting.featured,
      topics: meeting.topics?.join(", ") || "",
      secret_code: meeting.secret_code || "",
      registration_type: meeting.registration_type || "open",
      registration_capacity: meeting.registration_capacity,
      invite_code: meeting.invite_code || "",
      invite_form_url: meeting.invite_form_url || "",
      resources: ensureDiscordResource(meeting.resources ? [...meeting.resources] : []),
    });
    setEditError("");
    setIsEditing(true);

    // Fetch registered users for this meeting
    if (isOfficer) {
      setLoadingRegistrations(true);
      try {
        const { data: registrations } = await supabase
          .from("registrations")
          .select("*")
          .eq("meeting_id", meeting.id)
          .order("registered_at", { ascending: false });

        if (registrations && registrations.length > 0) {
          // Fetch user profiles for all registrations using officer function
          const userIds = registrations.map((r) => r.user_id);
          const { data: profiles } = await supabase
            .rpc("get_user_profiles_for_officers", { user_ids: userIds });

          // Map users to registrations
          const registrationsWithUsers: RegistrationWithUser[] =
            registrations.map((reg) => ({
              ...reg,
              user: profiles?.find((p) => p.id === reg.user_id),
            }));

          setRegisteredUsers(registrationsWithUsers);
        } else {
          setRegisteredUsers([]);
        }
      } catch (err) {
        console.error("Error fetching registrations:", err);
      } finally {
        setLoadingRegistrations(false);
      }
    }
  };

  const generateId = () => crypto.randomUUID();

  // Resource handlers
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

    // Validate slug
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

      // Ensure Discord link is always present + filter empty resources
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
          p_featured: editForm.featured,
          p_topics: topicsArray,
          p_secret_code: editForm.secret_code || null,
          p_registration_type: editForm.registration_type,
          p_registration_capacity: editForm.registration_capacity,
          p_invite_code: editForm.invite_code || null,
          p_invite_form_url: editForm.invite_form_url || null,
          p_resources: validResources,
        })
        .single();

      if (error) throw error;

      setMeeting(data);
      setIsEditing(false);
      setEditForm(null);

      // Refresh registration counts
      const count = await getRegistrationCount(data.id);
      setRegistrationCount(count);
      const wCount = await getWaitlistCount(data.id);
      setWaitlistCount(wCount);

      // If slug changed, navigate to new URL (or update parent sheet)
      if (editForm.slug !== slug) {
        if (embedded && onSelectMeeting) {
          onSelectMeeting(editForm.slug);
        } else {
          navigate(`/dashboard?meeting=${editForm.slug}`, { replace: true });
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
        <div className={embedded ? "px-4 py-4" : "relative max-w-4xl mx-auto px-6"}>
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
                <div className="text-4xl mb-4 text-red-600 dark:text-hack-red">404</div>
                <p className="text-gray-600 dark:text-gray-500 mb-2">
                  <span className="text-red-600 dark:text-hack-red">[ERROR]</span> Meeting not
                  found
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
                      navigate("/dashboard");
                    }
                  }}
                  className="cli-btn-dashedpx-6 py-2"
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
      {/* Cancel Registration Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setCancelError("");
        }}
        onConfirm={handleCancelRegistration}
        title="Cancel Registration?"
        message="Are you sure you want to cancel your registration for this event? You may lose your spot if the event fills up."
        confirmText="YES, CANCEL"
        cancelText="KEEP REGISTRATION"
        loading={registering}
        error={cancelError}
        variant="danger"
      />

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

      <div className={embedded ? "px-4 py-4" : "relative max-w-4xl mx-auto px-6"}>
        {/* Header - always visible immediately for stable layout */}
        <header className={`mb-8 ${embedded ? "hidden" : ""}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-blue-600 dark:text-matrix neon-text-subtle">$</span>
            <span className="text-gray-600 dark:text-gray-400 font-terminal">
              cat ./meetings/{slug}/README.md
            </span>
          </div>
        </header>

        {/* Main Content */}
        <article
          className={`mb-12 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">
                {loading
                  ? "loading..."
                  : isEditing
                  ? "edit_meeting.sh"
                  : meeting!.title.toLowerCase().replace(/\s+/g, "_")}
              </span>
              {!loading && isOfficer && !isEditing && (
                <button
                  onClick={startEditing}
                  className="ml-auto text-xs text-cyan-600 dark:text-hack-cyan hover:text-cyan-700 dark:hover:text-hack-cyan/80 font-terminal flex items-center gap-1 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  EDIT
                </button>
              )}
            </div>
            <div className="terminal-body">
              {loading ? (
                /* Skeleton while loading - stable layout, no flash */
                <div className="space-y-4 py-2">
                  <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="h-20 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-800 rounded animate-pulse" />
                    <div className="h-20 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-800 rounded animate-pulse" />
                    <div className="h-20 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-800 rounded animate-pulse md:col-span-2" />
                  </div>
                </div>
              ) : isEditing && editForm ? (
                /* Edit Mode */
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
                        {saving && <Spinner className="animate-spin h-4 w-4" />}
                        {saving ? "SAVING..." : "SAVE"}
                      </button>
                    </div>
                  </div>

                  {editError && (
                    <div className="p-3 bg-red-50 dark:bg-hack-red/10 border border-red-300 dark:border-hack-red/50 text-red-600 dark:text-hack-red text-sm">
                      {editError}
                    </div>
                  )}

                  <div>
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
                        className="input-hack w-full "
                        placeholder="my-meeting"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                        /meetings/{editForm.slug}
                      </p>
                    </div>
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
                      className="input-hack w-full "
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
                      className="input-hack w-full  min-h-[100px] resize-y"
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
                        className="input-hack w-full "
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
                        className="input-hack w-full "
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
                      className="input-hack w-full "
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
                      className="input-hack w-full "
                      placeholder="Security, Hacking, CTF"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Secret Code */}
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
                        className="input-hack w-full  font-mono"
                        placeholder="SECRETCODE"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                        Code for attendance check-in
                      </p>
                    </div>

                    {/* Featured */}
                    <div className="flex items-center gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditChange("featured", !editForm.featured)
                        }
                        className={`relative w-12 h-6 transition-colors ${editForm.featured ? "bg-blue-600 dark:bg-matrix" : "bg-gray-400 dark:bg-gray-600"}`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white transition-transform ${editForm.featured ? "left-7" : "left-1"}`}
                        />
                      </button>
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Featured meeting
                      </label>
                    </div>
                  </div>

                  {/* Registration Settings */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-purple-600 dark:text-hack-purple mb-4">
                      Registration Settings
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Registration Type */}
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">
                          REGISTRATION TYPE
                        </label>
                        <select
                          value={editForm.registration_type}
                          onChange={(e) =>
                            handleEditChange(
                              "registration_type",
                              e.target.value,
                            )
                          }
                          className="input-hack w-full "
                        >
                          <option value="open">
                            Open (anyone can register)
                          </option>
                          <option value="invite_only">Invite Only</option>
                          <option value="closed">
                            Closed (no registration)
                          </option>
                        </select>
                      </div>

                      {/* Registration Capacity */}
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">
                          CAPACITY (leave empty for unlimited)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.registration_capacity || ""}
                          onChange={(e) =>
                            handleEditChange(
                              "registration_capacity",
                              e.target.value ? parseInt(e.target.value) : null,
                            )
                          }
                          className="input-hack w-full "
                          placeholder="50"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                          Max number of attendees
                        </p>
                      </div>
                    </div>

                    {/* Invite-only fields */}
                    {editForm.registration_type === "invite_only" && (
                      <div className="grid gap-4 md:grid-cols-2 mt-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">
                            INVITE CODE
                          </label>
                          <input
                            type="text"
                            value={editForm.invite_code}
                            onChange={(e) =>
                              handleEditChange(
                                "invite_code",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="input-hack w-full  font-mono"
                            placeholder="INVITE123"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                            Code users enter to register
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">
                            INVITE REQUEST FORM URL
                          </label>
                          <input
                            type="url"
                            value={editForm.invite_form_url}
                            onChange={(e) =>
                              handleEditChange(
                                "invite_form_url",
                                e.target.value,
                              )
                            }
                            className="input-hack w-full "
                            placeholder="https://forms.gle/..."
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                            Optional form for users to request invites
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Registered Users List */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Registered Users ({registeredUsers.length})
                        </h4>
                        {loadingRegistrations && (
                          <Spinner className="animate-spin h-4 w-4 text-blue-600 dark:text-matrix" />
                        )}
                      </div>

                      {registeredUsers.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-500 text-sm">
                          No registrations yet
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {registeredUsers.map((registration) => (
                            <Link
                              key={registration.id}
                              to={`/@/${registration.user_id}`}
                              className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 hover:border-matrix/50 hover:bg-matrix/5 transition-all group"
                            >
                              {/* Profile Picture */}
                              <div className="shrink-0">
                                {registration.user?.photo_url ? (
                                  <img
                                    src={registration.user.photo_url}
                                    alt={registration.user.display_name}
                                    className="w-10 h-10 object-cover border border-gray-300 dark:border-gray-600 group-hover:border-matrix/40 transition-colors"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 flex items-center justify-center border border-gray-400 dark:border-gray-600 group-hover:border-matrix/40 transition-colors">
                                    <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">
                                      {registration.user?.display_name
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-matrix transition-colors">
                                  {registration.user?.display_name ||
                                    "Unknown User"}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-500 truncate">
                                  {registration.user?.email}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div>
                                <span
                                  className={`inline-block px-2 py-0.5text-xs font-terminal border ${
                                    registration.status === "attended"
                                      ? "border-blue-300 dark:border-matrix text-blue-600 dark:text-matrix bg-blue-50 dark:bg-matrix/10"
                                      : registration.status === "registered"
                                        ? "border-cyan-300 dark:border-hack-cyan text-cyan-600 dark:text-hack-cyan bg-cyan-50 dark:bg-hack-cyan/10"
                                        : registration.status === "invited"
                                          ? "border-purple-300 dark:border-hack-purple text-purple-600 dark:text-hack-purple bg-purple-50 dark:bg-hack-purple/10"
                                          : registration.status === "waitlist"
                                            ? "border-yellow-300 dark:border-hack-yellow text-yellow-600 dark:text-hack-yellow bg-yellow-50 dark:bg-hack-yellow/10"
                                            : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-500"
                                  }`}
                                >
                                  {registration.status.toUpperCase()}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Stats Summary */}
                      {registeredUsers.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-lg font-bold text-blue-600 dark:text-matrix">
                              {
                                registeredUsers.filter(
                                  (r) =>
                                    r.status === "registered" ||
                                    r.status === "attended",
                                ).length
                              }
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-500">
                              Registered
                            </div>
                          </div>
                          <div className="p-2 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-lg font-bold text-yellow-600 dark:text-hack-yellow">
                              {
                                registeredUsers.filter(
                                  (r) => r.status === "waitlist",
                                ).length
                              }
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-500">
                              Waitlist
                            </div>
                          </div>
                          <div className="p-2 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-700 text-center">
                            <div className="text-lg font-bold text-blue-600 dark:text-matrix">
                              {
                                registeredUsers.filter(
                                  (r) => r.status === "attended",
                                ).length
                              }
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-500">
                              Attended
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                      <p className="text-gray-600 dark:text-gray-500 text-sm">No resources yet</p>
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
                                className="input-hack flex-1  text-sm"
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
                                className="input-hack w-full  text-sm"
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
                                className="input-hack w-full  text-sm"
                              >
                                <option value="link">Link</option>
                                <option value="slides"></option>
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
              ) : meeting ? (
                /* View Mode */
                <>
                  {/* ========== LUMA REDESIGN (the version you liked) ========== */}
                  {/* Host pill */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111] border border-[#222] text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-black">C</div>
                      <span className="text-white/90 font-medium">De Anza Cyber Security Club</span>
                      <span className="text-white/40">›</span>
                    </div>
                    {meeting.featured && <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">FEATURED</span>}
                  </div>

                  {/* Big Title */}
                  <h1 className="text-[28px] md:text-[34px] leading-tight font-semibold tracking-[-0.5px] text-white mb-4">
                    {meeting.title}
                  </h1>

                  {/* Date + Time */}
                  <div className="flex items-center gap-2 text-white/90 mb-5 text-[15px]">
                    <Calendar className="w-4 h-4 text-white/60" />
                    <span>{(() => {
                      const d = parseLocalDate(meeting.date);
                      return d.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      });
                    })()}</span>
                    <span className="text-white/40">•</span>
                    <span className="font-mono text-sm text-white/70">{meeting.time}</span>
                  </div>

                  {/* Location Card with your Apple Maps link */}
                  <div 
                    onClick={() => window.open('https://maps.apple/p/VvLMJzG~DAkT7d', '_blank')}
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
                        <div className="font-semibold text-white">{meeting.location}</div>
                        <div className="text-xs text-white/50">Cupertino, California</div>
                      </div>
                      <div className="text-xs px-3 py-1 rounded-md bg-white/5 text-white/70">OPEN IN MAPS</div>
                    </div>
                  </div>

                  {/* You're In / Register card */}
                  {!isPast(meeting.date) && (
                    <div className="mb-8 rounded-2xl border border-[#222] bg-[#111] p-5">
                      {userRegistration && userRegistration.status !== "cancelled" ? (
                        <div>
                          <div className="text-emerald-400 text-sm font-medium tracking-wider mb-1">YOU'RE IN</div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}`, '_blank')} className="flex-1 py-2 text-sm rounded-xl bg-white/5 hover:bg-white/10">Add to Calendar</button>
                            <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }} className="flex-1 py-2 text-sm rounded-xl bg-white/5 hover:bg-white/10">Copy Link</button>
                          </div>
                          <button onClick={() => setShowCancelDialog(true)} className="mt-3 text-xs text-pink-400 hover:text-pink-300 w-full text-center">Cancel registration</button>
                        </div>
                      ) : (
                        <button onClick={handleRegister} disabled={registering} className="w-full py-3 text-lg font-medium rounded-2xl bg-white text-black active:bg-white/90 disabled:opacity-60">
                          {registering ? "Processing..." : "Register for Event"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Blasts */}
                  <div className="mb-8">
                    <div className="text-sm font-medium text-white/80 mb-3">Blasts</div>
                    <div className="space-y-3">
                      <div className="rounded-2xl bg-[#111] border border-[#222] p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/80 flex items-center justify-center text-[10px] font-bold">C</div>
                          <span className="text-white/90 text-sm">De Anza Cyber Security Club</span>
                        </div>
                        <a href="https://discord.gg/v5JWDrZVNp" target="_blank" className="text-[#ff7aa8] text-sm">Join the Discord for live updates →</a>
                      </div>
                      {meeting.resources?.filter(r => !r.url.includes('discord')).slice(0,2).map((r,i) => (
                        <div key={i} className="rounded-2xl bg-[#111] border border-[#222] p-4">
                          <div className="text-white/90 text-sm mb-1">{r.title}</div>
                          <a href={r.url} target="_blank" className="text-[#ff7aa8] text-sm break-all">{r.url}</a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guests with hover names */}
                  {(registrationCount > 0 || pastEventAttendees.length > 0) && (
                    <div className="mb-8">
                      <div className="text-sm font-medium text-white/80 mb-3">Guests <span className="text-white/50">({registrationCount || pastEventAttendees.length})</span></div>
                      <div className="flex flex-wrap gap-3 rounded-2xl border border-[#222] bg-[#111] p-4">
                        {pastEventAttendees.slice(0, 20).map((a, i) => (
                          <div key={i} className="group relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#222] bg-[#0a0a0a]" title={a.user?.display_name || 'Guest'}>
                            {a.user?.photo_url ? <img src={a.user.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-matrix/20 flex items-center justify-center text-xs text-matrix">{(a.user?.display_name||'G')[0]}</div>}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-white/10">{a.user?.display_name}</div>
                          </div>
                        ))}
                        {(registrationCount > pastEventAttendees.length) && <div className="w-10 h-10 rounded-full border-2 border-[#222] bg-[#1a1a1a] flex items-center justify-center text-xs text-white/60">+{registrationCount - pastEventAttendees.length}</div>}
                      </div>
                    </div>
                  )}

                  {/* About */}
                  <div className="mb-8 text-[15px] text-white/85 leading-relaxed">
                    <div className="uppercase text-xs tracking-[1px] text-white/50 mb-2">About Event</div>
                    <p>{meeting.description}</p>
                  </div>

                  {/* Hide the immediate duplicate old sections so the Luma hero leads cleanly */}
                  <div className="hidden">
                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      {meeting.featured && <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-terminal bg-blue-50 dark:bg-matrix/20 text-blue-600 dark:text-matrix border border-blue-300 dark:border-matrix/50"><Star className="w-4 h-4" /> FEATURED</span>}
                      {isPast(meeting.date) && <span className="inline-block px-3 py-1 text-sm font-terminal border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-500">COMPLETED</span>}
                    </div>

                    {/* Title (duplicate) */}
                    <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${isPast(meeting.date) ? "text-gray-600 dark:text-gray-400" : "text-blue-600 dark:text-matrix neon-text"}`}>
                      {meeting.title}
                    </h1>

                    {/* Description (duplicate) */}
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
                      {meeting.description}
                    </p>

                    {/* Details Grid (duplicate) */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      {/* Date */}
                      <div className="flex items-start gap-4 p-4 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-800">
                        <div className="p-2 bg-blue-50 dark:bg-matrix/10 text-blue-600 dark:text-matrix">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 dark:text-gray-500 uppercase font-terminal mb-1">
                            Date
                          </div>
                          <div className={`font-semibold ${isPast(meeting.date) ? "text-gray-600 dark:text-gray-400" : "text-blue-600 dark:text-matrix"}`}>
                            {formatDate(meeting.date)}
                          </div>
                        </div>
                      </div>

                    {/* Time */}
                    <div className="flex items-start gap-4 p-4 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-800">
                      <div className="p-2 bg-blue-50 dark:bg-matrix/10 text-blue-600 dark:text-matrix">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-500 uppercase font-terminal mb-1">
                          Time
                        </div>
                        <div className="text-gray-900 dark:text-white font-semibold">
                          {meeting.time}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-4 p-4 bg-gray-100 dark:bg-terminal-alt border border-gray-200 dark:border-gray-800 md:col-span-2">
                      <div className="p-2 bg-blue-50 dark:bg-matrix/10 text-blue-600 dark:text-matrix">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-500 uppercase font-terminal mb-1">
                          Location
                        </div>
                        <div className="text-gray-900 dark:text-white font-semibold">
                          {meeting.location}
                        </div>
                      </div>
                    </div>
                  </div>   {/* close the hidden div for duplicate old sections */}

                  {/* Secret Attendance Code - Officers Only */}
                    {isOfficer && meeting.secret_code && (
                      <div className="relative flex items-start gap-4 p-4  bg-hack-purple/10 border border-hack-purple/50 md:col-span-2">
                        <div className="p-2  bg-hack-purple/20 text-hack-purple">
                          <Key className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-hack-purple uppercase font-terminal mb-1">
                            Attendance Code
                          </div>
                          <div
                            className={`text-2xl font-bold font-mono text-hack-purple tracking-widest transition-all ${!codeRevealed ? "blur-sm select-none" : ""}`}
                          >
                            {codeRevealed ? meeting.secret_code : "SAMPLECODE"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCodeRevealed(!codeRevealed)}
                            className="p-2  bg-hack-purple/20 text-hack-purple hover:bg-hack-purple/30 transition-colors"
                            title={codeRevealed ? "Hide code" : "Reveal code"}
                          >
                            {codeRevealed ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setCodeRevealed(true);
                              setCodeFullscreen(true);
                            }}
                            className="p-2  bg-hack-purple/20 text-hack-purple hover:bg-hack-purple/30 transition-colors"
                            title="Fullscreen"
                          >
                            <Fullscreen className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
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
                            to={`/dashboard?q=${encodeURIComponent(topic)}`}
                            className="px-3 py-1.5 text-sm bg-terminal-alt border border-gray-700 text-gray-300 hover:border-matrix/50 hover:text-matrix transition-colors cursor-pointer"
                          >
                            {topic}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Event - Show Registration Status */}
                  {isPast(meeting.date) &&
                    userRegistration &&
                    userRegistration.status !== "cancelled" && (
                      <div className="pt-6 border-t border-gray-800">
                        {userRegistration.status === "attended" ? (
                          <div className="p-6  bg-matrix/10 border border-matrix/50 text-center">
                            <div className="w-16 h-16 mx-auto mb-4  bg-matrix/20 border border-matrix/50 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-matrix" />
                            </div>
                            <h3 className="text-xl font-bold text-matrix mb-2">
                              Thank you for joining
                            </h3>
                            <p className="text-gray-400 text-sm">
                              We hope you enjoyed the event! Check out the
                              resources below.
                            </p>
                          </div>
                        ) : (
                          <div className="p-6  bg-gray-800/50 border border-gray-700 text-center">
                            <div className="w-16 h-16 mx-auto mb-4  bg-gray-700/50 border border-gray-600 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">
                              {userRegistration.status === "registered" &&
                                "Thank you for joining"}
                              {userRegistration.status === "invited" &&
                                "You were invited to this event"}
                              {userRegistration.status === "waitlist" &&
                                "You were on the waitlist"}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              We hope you enjoyed the event! Check out the
                              resources below.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Past Event - Attendance Summary */}
                  {isPast(meeting.date) && (
                    <div className="pt-6 border-t border-gray-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2  bg-matrix/10">
                          <Users className="w-5 h-5 text-matrix" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {loadingAttendees ? (
                              <span className="text-gray-400">Loading...</span>
                            ) : (
                              <>
                                {pastEventAttendees.length}{" "}
                                {pastEventAttendees.length === 1
                                  ? "person"
                                  : "people"}{" "}
                                attended
                              </>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Event participants
                          </p>
                        </div>
                      </div>

                      {/* Attendees List */}
                      {!loadingAttendees && pastEventAttendees.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {pastEventAttendees.map((attendee) => (
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
                      )}

                      {!loadingAttendees && pastEventAttendees.length === 0 && (
                        <p className="text-gray-500 text-sm">
                          No attendance records for this event.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Registration Section */}
                  {!isPast(meeting.date) && (
                    <div className="pt-6 border-t border-gray-800">
                      {registrationMessage && (
                        <div
                          className={`p-3  mb-4 ${
                            registrationMessage.type === "success"
                              ? "bg-matrix/10 border border-matrix/50 text-matrix"
                              : "bg-hack-red/10 border border-hack-red/50 text-hack-red"
                          }`}
                        >
                          {registrationMessage.text}
                        </div>
                      )}

                      {/* Registration Stats */}
                      {(meeting.registration_capacity ||
                        registrationCount > 0) && (
                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>
                              {registrationCount} registered
                              {meeting.registration_capacity &&
                                ` / ${meeting.registration_capacity} capacity`}
                            </span>
                          </div>
                          {waitlistCount > 0 && (
                            <div className="text-gray-500">
                              {waitlistCount} on waitlist
                            </div>
                          )}
                        </div>
                      )}

                      {/* User has been invited - show accept/decline */}
                      {userRegistration &&
                      userRegistration.status === "invited" ? (
                        <div className="space-y-4">
                          <div className="p-4  bg-hack-cyan/10 border border-hack-cyan/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="w-5 h-5 text-hack-cyan" />
                              <span className="font-semibold text-hack-cyan">
                                You've been invited!
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              You've been invited to attend this meeting. Accept the invite to confirm your spot.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleDeclineInvite}
                              disabled={registering}
                              className="flex-1 px-4 py-2 text-sm font-terminal text-gray-400 hover:text-hack-red border border-gray-600 hover:border-hack-red  transition-colors disabled:opacity-50"
                            >
                              {registering ? "..." : "Decline"}
                            </button>
                            <button
                              onClick={handleAcceptInvite}
                              disabled={registering}
                              className="flex-1 cli-btn-filled px-4 py-2 disabled:opacity-50"
                            >
                              {registering ? "Accepting..." : "Accept Invite"}
                            </button>
                          </div>
                        </div>
                      ) : userRegistration &&
                      userRegistration.status !== "cancelled" ? (
                        /* User already registered */
                        <div className="space-y-4">
                          <div className="p-4  bg-matrix/10 border border-matrix/50">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-matrix" />
                              <span className="font-semibold text-matrix">
                                {userRegistration.status === "registered" &&
                                  "You are registered"}
                                {userRegistration.status === "waitlist" &&
                                  "You are on the waitlist"}
                                {userRegistration.status === "attended" &&
                                  "You are registered"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              {userRegistration.status === "registered" &&
                                "See you at the event!"}
                              {userRegistration.status === "waitlist" &&
                                "You'll be notified if a spot opens up."}
                              {userRegistration.status === "attended" &&
                                "See you at the event!"}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowCancelDialog(true)}
                            className="text-sm text-gray-500 hover:text-hack-red transition-colors"
                          >
                            Cancel registration
                          </button>
                        </div>
                      ) : meeting.registration_type === "closed" ? (
                        /* Closed registration */
                        <div className="p-4  bg-gray-800/50 border border-gray-700">
                          <p className="text-gray-400 text-center">
                            Registration is closed for this event
                          </p>
                        </div>
                      ) : meeting.registration_type === "invite_only" &&
                        !showInviteCodeInput ? (
                        /* Invite-only event */
                        <div className="space-y-4">
                          <div className="p-4  bg-hack-purple/10 border border-hack-purple/50">
                            <p className="text-hack-purple text-sm mb-2">
                              This is an invite-only event
                            </p>
                            <p className="text-gray-400 text-xs">
                              {meeting.invite_form_url
                                ? "Request an invite or enter your invite code to register."
                                : "Enter your invite code to register."}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            {meeting.invite_form_url && (
                              <a
                                href={meeting.invite_form_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cli-btn-dashedpx-6 py-3 text-center flex-1"
                              >
                                Request Invite
                              </a>
                            )}
                            <button
                              onClick={() => setShowInviteCodeInput(true)}
                              className="cli-btn-filled px-6 py-3 flex-1"
                            >
                              I have an invite code
                            </button>
                          </div>
                        </div>
                      ) : showInviteCodeInput ||
                        meeting.registration_type === "invite_only" ? (
                        /* Invite code input */
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-gray-500 font-terminal mb-2">
                              INVITE CODE
                            </label>
                            <input
                              type="text"
                              value={inviteCode}
                              onChange={(e) =>
                                setInviteCode(e.target.value.toUpperCase())
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleRegister()
                              }
                              className="input-hack w-full  font-mono"
                              placeholder="ENTER CODE"
                              disabled={registering}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setShowInviteCodeInput(false);
                                setInviteCode("");
                              }}
                              disabled={registering}
                              className="cli-btn-dashedpx-6 py-3 flex-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleRegister}
                              disabled={registering || !inviteCode}
                              className="cli-btn-filled px-6 py-3 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {registering ? "Registering..." : "Register"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Open registration or waitlist */
                        <div className="flex flex-col gap-4">
                          <button
                            onClick={handleRegister}
                            disabled={registering}
                            className="cli-btn-filled px-6 py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {registering
                              ? "Processing..."
                              : isAtCapacity
                                ? "Join Waitlist"
                                : "Register for Event"}
                          </button>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <a
                              href="https://discord.gg/v5JWDrZVNp"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cli-btn-dashedpx-6 py-2 text-center text-sm flex-1"
                            >
                              Join Discord
                            </a>
                            {embedded && onClose ? (
                              <button
                                onClick={onClose}
                                className="cli-btn-dashedpx-6 py-2 text-center text-sm flex-1"
                              >
                                Close
                              </button>
                            ) : (
                              <Link
                                to="/meetings"
                                className="cli-btn-dashedpx-6 py-2 text-center text-sm flex-1"
                              >
                                View All Events
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </article>

        {/* Resources Section */}
        {!loading && !isEditing && meeting?.resources && meeting.resources.length > 0 && (
            <section
              className={`mb-12 transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-matrix neon-text-subtle text-lg">$</span>
                <span className="text-gray-400 font-terminal">
                  ls ./meetings/{slug}/
                </span>
              </div>

              {/* Resources header (simplified - only resources remain) */}
              <div className="text-sm text-gray-400 mb-2 font-terminal">RESOURCES</div>



              {/* Tab Content */}
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
                  {/* Resources Tab (only remaining tab) */}
                  {activeTab === "resources" && (
                    <div className="space-y-3">
                      {meeting.resources && meeting.resources.length > 0 ? (
                        meeting.resources.map((resource) => (
                          <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4  bg-terminal-alt border border-gray-800 hover:border-hack-yellow/50 transition-colors group"
                          >
                            <div className="p-2  bg-hack-yellow/10 text-hack-yellow">
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

              {/* Swipe hint on mobile */}
              <p className="text-center text-xs text-gray-600 mt-3 md:hidden">
                Swipe left or right to switch tabs
              </p>
            </section>
          )}

        {/* Related Meetings */}
        {!loading && meeting && relatedMeetings.length > 0 && (
          <section
            className={`mb-16 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-400 font-terminal">
                ls ./meetings/ | head -3
              </span>
            </div>

            <h2 className="text-xl font-bold text-matrix mb-4">
              Related Events
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedMeetings.map((related) => (
                <Link
                  key={related.id}
                  to={embedded && onSelectMeeting ? "#" : `/dashboard?meeting=${related.slug}`}
                  onClick={
                    embedded && onSelectMeeting
                      ? (e) => {
                          e.preventDefault();
                          onSelectMeeting(related.slug);
                        }
                      : undefined
                  }
                  className={`card-hack p-4  group transition-all ${
                    isPast(related.date) ? "opacity-70" : ""
                  }`}
                >
                  {isPast(related.date) && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-0.5text-xs font-terminal border border-gray-600 text-gray-500">
                        PAST
                      </span>
                    </div>
                  )}
                  <h3
                    className={`font-semibold mb-2 group-hover:neon-text-subtle transition-all line-clamp-2 ${
                      isPast(related.date) ? "text-gray-400" : "text-matrix"
                    }`}
                  >
                    {related.title}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {formatDate(related.date)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default MeetingDetails;
