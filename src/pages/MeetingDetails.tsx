import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { TYPE_COLORS, TYPE_LABELS } from "./Meetings";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Meeting,
  MeetingType,
  Announcement,
  Photo,
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
  Megaphone,
  Photo as PhotoIcon,
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

interface UserProfile {
  id: string;
  display_name: string;
  photo_url: string | null;
  email: string;
}

interface RegistrationWithUser extends Registration {
  user?: UserProfile;
}

type TabType = "announcements" | "photos" | "resources";

interface EditForm {
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: MeetingType;
  featured: boolean;
  topics: string;
  secret_code: string;
  registration_type: RegistrationType;
  registration_capacity: number | null;
  invite_code: string;
  invite_form_url: string;
  announcements: Announcement[];
  photos: Photo[];
  resources: Resource[];
}

function MeetingDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("announcements");
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

  const isOfficer = userProfile?.is_officer ?? false;

  useEffect(() => {
    async function fetchMeeting() {
      if (!slug) return;

      try {
        // Officers get full access with secret_code, regular users use public view
        const table = isOfficer ? "meetings" : "meetings_public";
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) throw error;
        setMeeting(data);

        // Fetch related meetings of the same type
        if (data) {
          const { data: related } = await supabase
            .from(table)
            .select("*")
            .eq("type", data.type)
            .neq("slug", slug)
            .limit(3);

          setRelatedMeetings(related || []);
        }
      } catch (err) {
        console.error("Error fetching meeting:", err);
        setMeeting(null);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    }

    fetchMeeting();
  }, [slug, isOfficer]);

  // Fetch registration data
  useEffect(() => {
    async function fetchRegistrationData() {
      if (!meeting || !user) return;

      try {
        // Fetch user's registration status
        const registration = await getUserRegistration(meeting.id, user.id);
        setUserRegistration(registration);

        // Fetch registration counts
        const count = await getRegistrationCount(meeting.id);
        setRegistrationCount(count);

        const wCount = await getWaitlistCount(meeting.id);
        setWaitlistCount(wCount);
      } catch (err) {
        console.error("Error fetching registration data:", err);
      }
    }

    fetchRegistrationData();
  }, [meeting, user]);

  // Fetch attendees for past events
  useEffect(() => {
    async function fetchPastEventAttendees() {
      if (!meeting || !isPast(meeting.date)) return;

      setLoadingAttendees(true);
      try {
        // Fetch all registrations for this meeting with "attended" status
        // (registrations table is publicly readable for "attended" status)
        const { data: registrations } = await supabase
          .from("registrations")
          .select("*")
          .eq("meeting_id", meeting.id)
          .eq("status", "attended")
          .order("registered_at", { ascending: false });

        if (registrations && registrations.length > 0) {
          // Fetch public profiles for all attendees
          const userIds = registrations.map((r) => r.user_id);
          const { data: profiles } = await supabase
            .from("public_profiles")
            .select("id, display_name, photo_url")
            .in("id", userIds);

          // Map profiles to registrations
          const attendeesWithProfiles: RegistrationWithUser[] = registrations.map(
            (reg) => ({
              ...reg,
              user: profiles?.find((p) => p.id === reg.user_id) as UserProfile | undefined,
            })
          );

          setPastEventAttendees(attendeesWithProfiles);
        } else {
          setPastEventAttendees([]);
        }
      } catch (err) {
        console.error("Error fetching past event attendees:", err);
      } finally {
        setLoadingAttendees(false);
      }
    }

    fetchPastEventAttendees();
  }, [meeting]);

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

  const tabs: TabType[] = ["announcements", "photos", "resources"];

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
      navigate(`/auth?to=/meetings/${slug}`);
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
      type: meeting.type,
      featured: meeting.featured,
      topics: meeting.topics?.join(", ") || "",
      secret_code: meeting.secret_code || "",
      registration_type: meeting.registration_type || "open",
      registration_capacity: meeting.registration_capacity,
      invite_code: meeting.invite_code || "",
      invite_form_url: meeting.invite_form_url || "",
      announcements: meeting.announcements ? [...meeting.announcements] : [],
      photos: meeting.photos ? [...meeting.photos] : [],
      resources: meeting.resources ? [...meeting.resources] : [],
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

  // Announcement handlers
  const addAnnouncement = () => {
    if (!editForm) return;
    const newAnnouncement: Announcement = {
      id: generateId(),
      title: "",
      content: "",
      date: new Date().toISOString().split("T")[0],
    };
    setEditForm({
      ...editForm,
      announcements: [...editForm.announcements, newAnnouncement],
    });
  };

  const updateAnnouncement = (
    id: string,
    field: keyof Announcement,
    value: string,
  ) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      announcements: editForm.announcements.map((a) =>
        a.id === id ? { ...a, [field]: value } : a,
      ),
    });
  };

  const deleteAnnouncement = (id: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      announcements: editForm.announcements.filter((a) => a.id !== id),
    });
  };

  // Photo handlers
  const addPhoto = () => {
    if (!editForm) return;
    const newPhoto: Photo = {
      id: generateId(),
      url: "",
      caption: "",
    };
    setEditForm({ ...editForm, photos: [...editForm.photos, newPhoto] });
  };

  const updatePhoto = (id: string, field: keyof Photo, value: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      photos: editForm.photos.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    });
  };

  const deletePhoto = (id: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      photos: editForm.photos.filter((p) => p.id !== id),
    });
  };

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

      // Filter out empty announcements, photos, and resources
      const validAnnouncements = editForm.announcements.filter(
        (a) => a.title.trim() && a.content.trim(),
      );
      const validPhotos = editForm.photos.filter((p) => p.url.trim());
      const validResources = editForm.resources.filter(
        (r) => r.title.trim() && r.url.trim(),
      );

      const { data, error } = await supabase
        .from("meetings")
        .update({
          slug: editForm.slug,
          title: editForm.title,
          description: editForm.description,
          date: editForm.date,
          time: editForm.time,
          location: editForm.location,
          type: editForm.type,
          featured: editForm.featured,
          topics: topicsArray,
          secret_code: editForm.secret_code || null,
          registration_type: editForm.registration_type,
          registration_capacity: editForm.registration_capacity,
          invite_code: editForm.invite_code || null,
          invite_form_url: editForm.invite_form_url || null,
          announcements: validAnnouncements,
          photos: validPhotos,
          resources: validResources,
          updated_at: new Date().toISOString(),
        })
        .eq("id", meeting.id)
        .select()
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

      // If slug changed, navigate to new URL
      if (editForm.slug !== slug) {
        navigate(`/meetings/${editForm.slug}`, { replace: true });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center">
            <Spinner className="animate-spin h-6 w-6 text-matrix" />
            <span className="font-terminal text-lg">Loading meeting...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="bg-terminal-bg text-matrix min-h-screen">
        <div className="relative max-w-4xl mx-auto px-6">
          <header className="mb-12">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">
                  error
                </span>
              </div>
              <div className="terminal-body text-center py-12">
                <div className="text-4xl mb-4 text-hack-red">404</div>
                <p className="text-gray-500 mb-2">
                  <span className="text-hack-red">[ERROR]</span> Meeting not
                  found
                </p>
                <p className="text-gray-600 text-sm mb-6">
                  The meeting you're looking for doesn't exist or has been
                  removed.
                </p>
                <button
                  onClick={() => navigate("/meetings")}
                  className="btn-hack px-6 py-2"
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
    <div className="bg-terminal-bg text-matrix min-h-screen">
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
          className="fixed inset-0 z-50 bg-terminal-bg flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setCodeFullscreen(false)}
        >
          <div className="text-center">
            <div className="text-sm text-hack-purple uppercase font-terminal mb-4 tracking-widest">
              Attendance Code
            </div>
            <div className="text-6xl sm:text-8xl md:text-9xl font-bold font-mono text-hack-purple tracking-widest neon-text animate-pulse">
              {meeting.secret_code}
            </div>
            <div className="mt-8 text-gray-500 text-sm font-terminal">
              Click anywhere or press ESC to close
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCodeFullscreen(false);
            }}
            className="absolute top-6 right-6 p-3 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Close className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <header
          className={`mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle">$</span>
            <span className="text-gray-400 font-terminal">
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
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                {isEditing
                  ? "edit_meeting.sh"
                  : meeting.title.toLowerCase().replace(/\s+/g, "_")}
              </span>
              {isOfficer && !isEditing && (
                <button
                  onClick={startEditing}
                  className="ml-auto text-xs text-hack-cyan hover:text-hack-cyan/80 font-terminal flex items-center gap-1 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  EDIT
                </button>
              )}
            </div>
            <div className="terminal-body">
              {isEditing && editForm ? (
                /* Edit Mode */
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-matrix">
                      Edit Meeting
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-terminal text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-terminal bg-matrix/20 text-matrix border border-matrix rounded-lg hover:bg-matrix/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving && <Spinner className="animate-spin h-4 w-4" />}
                        {saving ? "SAVING..." : "SAVE"}
                      </button>
                    </div>
                  </div>

                  {editError && (
                    <div className="p-3 rounded-lg bg-hack-red/10 border border-hack-red/50 text-hack-red text-sm">
                      {editError}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Slug */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
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
                        className="input-hack w-full rounded-lg"
                        placeholder="my-meeting"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        /meetings/{editForm.slug}
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
                        TYPE
                      </label>
                      <select
                        value={editForm.type}
                        onChange={(e) =>
                          handleEditChange("type", e.target.value)
                        }
                        className="input-hack w-full rounded-lg"
                      >
                        <option value="workshop">Workshop</option>
                        <option value="lecture">Lecture</option>
                        <option value="ctf">CTF</option>
                        <option value="social">Social</option>
                        <option value="general">General</option>
                      </select>
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
                      className="input-hack w-full rounded-lg"
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
                      className="input-hack w-full rounded-lg min-h-[100px] resize-y"
                      placeholder="Meeting description"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Date */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
                        DATE
                      </label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) =>
                          handleEditChange("date", e.target.value)
                        }
                        className="input-hack w-full rounded-lg"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
                        TIME
                      </label>
                      <input
                        type="text"
                        value={editForm.time}
                        onChange={(e) =>
                          handleEditChange("time", e.target.value)
                        }
                        className="input-hack w-full rounded-lg"
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
                      className="input-hack w-full rounded-lg"
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
                      className="input-hack w-full rounded-lg"
                      placeholder="Security, Hacking, CTF"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Secret Code */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">
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
                        className="input-hack w-full rounded-lg font-mono"
                        placeholder="SECRETCODE"
                      />
                      <p className="text-xs text-gray-600 mt-1">
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
                        className={`relative w-12 h-6 rounded-full transition-colors ${editForm.featured ? "bg-matrix" : "bg-gray-600"}`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${editForm.featured ? "left-7" : "left-1"}`}
                        />
                      </button>
                      <label className="text-sm text-gray-400">
                        Featured meeting
                      </label>
                    </div>
                  </div>

                  {/* Registration Settings */}
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-hack-purple mb-4">
                      Registration Settings
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Registration Type */}
                      <div>
                        <label className="block text-xs text-gray-500 font-terminal mb-1">
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
                          className="input-hack w-full rounded-lg"
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
                        <label className="block text-xs text-gray-500 font-terminal mb-1">
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
                          className="input-hack w-full rounded-lg"
                          placeholder="50"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Max number of attendees
                        </p>
                      </div>
                    </div>

                    {/* Invite-only fields */}
                    {editForm.registration_type === "invite_only" && (
                      <div className="grid gap-4 md:grid-cols-2 mt-4">
                        <div>
                          <label className="block text-xs text-gray-500 font-terminal mb-1">
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
                            className="input-hack w-full rounded-lg font-mono"
                            placeholder="INVITE123"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            Code users enter to register
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 font-terminal mb-1">
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
                            className="input-hack w-full rounded-lg"
                            placeholder="https://forms.gle/..."
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            Optional form for users to request invites
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Registered Users List */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300">
                          Registered Users ({registeredUsers.length})
                        </h4>
                        {loadingRegistrations && (
                          <Spinner className="animate-spin h-4 w-4 text-matrix" />
                        )}
                      </div>

                      {registeredUsers.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          No registrations yet
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {registeredUsers.map((registration) => (
                            <div
                              key={registration.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-terminal-alt border border-gray-700"
                            >
                              {/* Profile Picture */}
                              <div className="shrink-0">
                                {registration.user?.photo_url ? (
                                  <img
                                    src={registration.user.photo_url}
                                    alt={registration.user.display_name}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-600"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                                    <span className="text-gray-400 text-sm font-bold">
                                      {registration.user?.display_name
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-200 truncate">
                                  {registration.user?.display_name ||
                                    "Unknown User"}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {registration.user?.email}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${
                                    registration.status === "attended"
                                      ? "border-matrix text-matrix bg-matrix/10"
                                      : registration.status === "registered"
                                        ? "border-hack-cyan text-hack-cyan bg-hack-cyan/10"
                                        : registration.status === "invited"
                                          ? "border-hack-purple text-hack-purple bg-hack-purple/10"
                                          : registration.status === "waitlist"
                                            ? "border-hack-yellow text-hack-yellow bg-hack-yellow/10"
                                            : "border-gray-600 text-gray-500"
                                  }`}
                                >
                                  {registration.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stats Summary */}
                      {registeredUsers.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div className="p-2 rounded bg-terminal-alt border border-gray-700 text-center">
                            <div className="text-lg font-bold text-matrix">
                              {
                                registeredUsers.filter(
                                  (r) =>
                                    r.status === "registered" ||
                                    r.status === "attended",
                                ).length
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              Registered
                            </div>
                          </div>
                          <div className="p-2 rounded bg-terminal-alt border border-gray-700 text-center">
                            <div className="text-lg font-bold text-hack-yellow">
                              {
                                registeredUsers.filter(
                                  (r) => r.status === "waitlist",
                                ).length
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              Waitlist
                            </div>
                          </div>
                          <div className="p-2 rounded bg-terminal-alt border border-gray-700 text-center">
                            <div className="text-lg font-bold text-matrix">
                              {
                                registeredUsers.filter(
                                  (r) => r.status === "attended",
                                ).length
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              Attended
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Announcements Editor */}
                  <div className="border-t border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-matrix">
                        Announcements
                      </h3>
                      <button
                        type="button"
                        onClick={addAnnouncement}
                        className="text-xs font-terminal text-hack-cyan hover:text-hack-cyan/80 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        ADD
                      </button>
                    </div>
                    {editForm.announcements.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No announcements yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {editForm.announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className="p-4 rounded-lg bg-terminal-alt border border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <input
                                type="text"
                                value={announcement.title}
                                onChange={(e) =>
                                  updateAnnouncement(
                                    announcement.id,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                className="input-hack flex-1 rounded-lg text-sm"
                                placeholder="Announcement title"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  deleteAnnouncement(announcement.id)
                                }
                                className="ml-2 p-1 text-gray-500 hover:text-hack-red transition-colors"
                              >
                                <Trash className="w-5 h-5" />
                              </button>
                            </div>
                            <textarea
                              value={announcement.content}
                              onChange={(e) =>
                                updateAnnouncement(
                                  announcement.id,
                                  "content",
                                  e.target.value,
                                )
                              }
                              className="input-hack w-full rounded-lg text-sm min-h-[60px] resize-y mb-2"
                              placeholder="Announcement content"
                            />
                            <input
                              type="date"
                              value={announcement.date}
                              onChange={(e) =>
                                updateAnnouncement(
                                  announcement.id,
                                  "date",
                                  e.target.value,
                                )
                              }
                              className="input-hack rounded-lg text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Photos Editor */}
                  <div className="border-t border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-hack-cyan">
                        Photos
                      </h3>
                      <button
                        type="button"
                        onClick={addPhoto}
                        className="text-xs font-terminal text-hack-cyan hover:text-hack-cyan/80 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        ADD
                      </button>
                    </div>
                    {editForm.photos.length === 0 ? (
                      <p className="text-gray-500 text-sm">No photos yet</p>
                    ) : (
                      <div className="space-y-4">
                        {editForm.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="p-4 rounded-lg bg-terminal-alt border border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <input
                                type="url"
                                value={photo.url}
                                onChange={(e) =>
                                  updatePhoto(photo.id, "url", e.target.value)
                                }
                                className="input-hack flex-1 rounded-lg text-sm"
                                placeholder="https://example.com/image.jpg"
                              />
                              <button
                                type="button"
                                onClick={() => deletePhoto(photo.id)}
                                className="ml-2 p-1 text-gray-500 hover:text-hack-red transition-colors"
                              >
                                <Trash className="w-5 h-5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={photo.caption || ""}
                              onChange={(e) =>
                                updatePhoto(photo.id, "caption", e.target.value)
                              }
                              className="input-hack w-full rounded-lg text-sm"
                              placeholder="Caption (optional)"
                            />
                            {photo.url && (
                              <div className="mt-3">
                                <img
                                  src={photo.url}
                                  alt="Preview"
                                  className="max-h-32 rounded-lg border border-gray-700"
                                  onError={(e) =>
                                    ((
                                      e.target as HTMLImageElement
                                    ).style.display = "none")
                                  }
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resources Editor */}
                  <div className="border-t border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-hack-yellow">
                        Resources
                      </h3>
                      <button
                        type="button"
                        onClick={addResource}
                        className="text-xs font-terminal text-hack-yellow hover:text-hack-yellow/80 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        ADD
                      </button>
                    </div>
                    {editForm.resources.length === 0 ? (
                      <p className="text-gray-500 text-sm">No resources yet</p>
                    ) : (
                      <div className="space-y-4">
                        {editForm.resources.map((resource) => (
                          <div
                            key={resource.id}
                            className="p-4 rounded-lg bg-terminal-alt border border-gray-700"
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
                                className="input-hack flex-1 rounded-lg text-sm"
                                placeholder="Resource title"
                              />
                              <button
                                type="button"
                                onClick={() => deleteResource(resource.id)}
                                className="ml-2 p-1 text-gray-500 hover:text-hack-red transition-colors"
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
                                className="input-hack w-full rounded-lg text-sm"
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
                                className="input-hack w-full rounded-lg text-sm"
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
              ) : (
                /* View Mode */
                <>
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-terminal border ${TYPE_COLORS[meeting.type]}`}
                    >
                      {TYPE_LABELS[meeting.type]}
                    </span>
                    {meeting.featured && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-terminal bg-matrix/20 text-matrix border border-matrix/50">
                        <Star className="w-4 h-4" />
                        FEATURED
                      </span>
                    )}
                    {isPast(meeting.date) && (
                      <span className="inline-block px-3 py-1 rounded text-sm font-terminal border border-gray-600 text-gray-500">
                        COMPLETED
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1
                    className={`text-3xl md:text-4xl font-bold mb-4 ${isPast(meeting.date) ? "text-gray-400" : "text-matrix neon-text"}`}
                  >
                    {meeting.title}
                  </h1>

                  {/* Description */}
                  <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    {meeting.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Date */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-terminal-alt border border-gray-800">
                      <div className="p-2 rounded-lg bg-matrix/10 text-matrix">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-terminal mb-1">
                          Date
                        </div>
                        <div
                          className={`font-semibold ${isPast(meeting.date) ? "text-gray-400" : "text-matrix"}`}
                        >
                          {formatDate(meeting.date)}
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-terminal-alt border border-gray-800">
                      <div className="p-2 rounded-lg bg-matrix/10 text-matrix">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-terminal mb-1">
                          Time
                        </div>
                        <div className="text-white font-semibold">
                          {meeting.time}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-terminal-alt border border-gray-800 md:col-span-2">
                      <div className="p-2 rounded-lg bg-matrix/10 text-matrix">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-terminal mb-1">
                          Location
                        </div>
                        <div className="text-white font-semibold">
                          {meeting.location}
                        </div>
                      </div>
                    </div>

                    {/* Secret Attendance Code - Officers Only */}
                    {isOfficer && meeting.secret_code && (
                      <div className="relative flex items-start gap-4 p-4 rounded-lg bg-hack-purple/10 border border-hack-purple/50 md:col-span-2">
                        <div className="p-2 rounded-lg bg-hack-purple/20 text-hack-purple">
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
                            className="p-2 rounded-lg bg-hack-purple/20 text-hack-purple hover:bg-hack-purple/30 transition-colors"
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
                            className="p-2 rounded-lg bg-hack-purple/20 text-hack-purple hover:bg-hack-purple/30 transition-colors"
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
                          <span
                            key={topic}
                            className="px-3 py-1.5 rounded-lg text-sm bg-terminal-alt border border-gray-700 text-gray-300 hover:border-matrix/50 transition-colors"
                          >
                            {topic}
                          </span>
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
                          <div className="p-6 rounded-lg bg-matrix/10 border border-matrix/50 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-matrix/20 border border-matrix/50 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-matrix" />
                            </div>
                            <h3 className="text-xl font-bold text-matrix mb-2">
                              Thank you for joining
                            </h3>
                            <p className="text-gray-400 text-sm">
                              We hope you enjoyed the event! Check out the
                              photos and resources below.
                            </p>
                          </div>
                        ) : (
                          <div className="p-6 rounded-lg bg-gray-800/50 border border-gray-700 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 border border-gray-600 flex items-center justify-center">
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
                              photos and resources below.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Past Event - Attendance Summary */}
                  {isPast(meeting.date) && (
                    <div className="pt-6 border-t border-gray-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-matrix/10">
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
                            <div
                              key={attendee.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-terminal-alt border border-gray-800"
                            >
                              {attendee.user?.photo_url ? (
                                <img
                                  src={attendee.user.photo_url}
                                  alt={attendee.user.display_name}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-600"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                                  <span className="text-gray-400 text-xs font-bold">
                                    {attendee.user?.display_name
                                      ?.charAt(0)
                                      .toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-gray-300 truncate">
                                {attendee.user?.display_name || "Unknown"}
                              </span>
                            </div>
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
                          className={`p-3 rounded-lg mb-4 ${
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
                          <div className="p-4 rounded-lg bg-hack-cyan/10 border border-hack-cyan/50">
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
                              className="flex-1 px-4 py-2 text-sm font-terminal text-gray-400 hover:text-hack-red border border-gray-600 hover:border-hack-red rounded-lg transition-colors disabled:opacity-50"
                            >
                              {registering ? "..." : "Decline"}
                            </button>
                            <button
                              onClick={handleAcceptInvite}
                              disabled={registering}
                              className="flex-1 btn-hack-filled px-4 py-2 disabled:opacity-50"
                            >
                              {registering ? "Accepting..." : "Accept Invite"}
                            </button>
                          </div>
                        </div>
                      ) : userRegistration &&
                      userRegistration.status !== "cancelled" ? (
                        /* User already registered */
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-matrix/10 border border-matrix/50">
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
                        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                          <p className="text-gray-400 text-center">
                            Registration is closed for this event
                          </p>
                        </div>
                      ) : meeting.registration_type === "invite_only" &&
                        !showInviteCodeInput ? (
                        /* Invite-only event */
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-hack-purple/10 border border-hack-purple/50">
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
                                className="btn-hack px-6 py-3 text-center flex-1"
                              >
                                Request Invite
                              </a>
                            )}
                            <button
                              onClick={() => setShowInviteCodeInput(true)}
                              className="btn-hack-filled px-6 py-3 flex-1"
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
                              className="input-hack w-full rounded-lg font-mono"
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
                              className="btn-hack px-6 py-3 flex-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleRegister}
                              disabled={registering || !inviteCode}
                              className="btn-hack-filled px-6 py-3 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="btn-hack-filled px-6 py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                              className="btn-hack px-6 py-2 text-center text-sm flex-1"
                            >
                              Join Discord
                            </a>
                            <Link
                              to="/meetings"
                              className="btn-hack px-6 py-2 text-center text-sm flex-1"
                            >
                              View All Events
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </article>

        {/* Tabbed Content Section */}
        {!isEditing &&
          (meeting.announcements?.length > 0 ||
            meeting.photos?.length > 0 ||
            meeting.resources?.length > 0) && (
            <section
              className={`mb-12 transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-matrix neon-text-subtle text-lg">$</span>
                <span className="text-gray-400 font-terminal">
                  ls ./meetings/{slug}/
                </span>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setActiveTab("announcements")}
                  className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === "announcements"
                      ? "bg-matrix/20 text-matrix border border-matrix"
                      : "bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50"
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                  ANNOUNCEMENTS
                  {meeting.announcements?.length ? (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-matrix/30">
                      {meeting.announcements.length}
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => setActiveTab("photos")}
                  className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === "photos"
                      ? "bg-hack-cyan/20 text-hack-cyan border border-hack-cyan"
                      : "bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-cyan/50"
                  }`}
                >
                  <PhotoIcon className="w-4 h-4" />
                  PHOTOS
                  {meeting.photos?.length ? (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-hack-cyan/30">
                      {meeting.photos.length}
                    </span>
                  ) : null}
                </button>
                <button
                  onClick={() => setActiveTab("resources")}
                  className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === "resources"
                      ? "bg-hack-yellow/20 text-hack-yellow border border-hack-yellow"
                      : "bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-yellow/50"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  RESOURCES
                  {meeting.resources?.length ? (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-hack-yellow/30">
                      {meeting.resources.length}
                    </span>
                  ) : null}
                </button>
              </div>

              {/* Swipe indicator */}
              <div className="flex justify-center gap-2 mb-4 md:hidden">
                {tabs.map((tab) => (
                  <div
                    key={tab}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeTab === tab ? "bg-matrix w-4" : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>

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
                <div className="terminal-body min-h-[200px]">
                  {/* Announcements Tab */}
                  {activeTab === "announcements" && (
                    <div className="space-y-4">
                      {meeting.announcements &&
                      meeting.announcements.length > 0 ? (
                        meeting.announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className="p-4 rounded-lg bg-terminal-alt border border-gray-800"
                          >
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h4 className="font-semibold text-matrix">
                                {announcement.title}
                              </h4>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {new Date(announcement.date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">
                              {announcement.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Megaphone className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                          <p className="text-gray-500 text-sm">
                            No announcements yet
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Photos Tab */}
                  {activeTab === "photos" && (
                    <div>
                      {meeting.photos && meeting.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {meeting.photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="group relative aspect-square rounded-lg overflow-hidden bg-terminal-alt border border-gray-800"
                            >
                              <img
                                src={photo.url}
                                alt={photo.caption || "Event photo"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
                                }}
                              />
                              {photo.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-xs">
                                    {photo.caption}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <PhotoIcon className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                          <p className="text-gray-500 text-sm">No photos yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resources Tab */}
                  {activeTab === "resources" && (
                    <div className="space-y-3">
                      {meeting.resources && meeting.resources.length > 0 ? (
                        meeting.resources.map((resource) => (
                          <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 rounded-lg bg-terminal-alt border border-gray-800 hover:border-hack-yellow/50 transition-colors group"
                          >
                            <div className="p-2 rounded-lg bg-hack-yellow/10 text-hack-yellow">
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
        {relatedMeetings.length > 0 && (
          <section
            className={`mb-16 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-400 font-terminal">
                ls ./meetings/ --type={meeting.type} | head -3
              </span>
            </div>

            <h2 className="text-xl font-bold text-matrix mb-4">
              Related {TYPE_LABELS[meeting.type]} Events
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedMeetings.map((related) => (
                <Link
                  key={related.id}
                  to={`/meetings/${related.slug}`}
                  className={`card-hack p-4 rounded-lg group transition-all ${
                    isPast(related.date) ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[related.type]}`}
                    >
                      {TYPE_LABELS[related.type]}
                    </span>
                    {isPast(related.date) && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-terminal border border-gray-600 text-gray-500">
                        PAST
                      </span>
                    )}
                  </div>
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
