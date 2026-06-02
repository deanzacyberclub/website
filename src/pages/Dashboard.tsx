import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOfficerVerification } from "@/hooks/useOfficerVerification";
import { supabase } from "@/lib/supabase";
import {
  TYPE_COLORS,
  TYPE_LABELS,
  defaultCreateForm,
  formatTimeRange,
  getCurrentTopicsList,
  getLastTopicPartial,
  parseLocalDate,
} from "@/lib/meetingUtils";
import type { CreateMeetingForm } from "@/lib/meetingUtils";
import type { Meeting, MeetingType, Registration } from "@/types/database.types";
import MeetingDetailSheet from "@/components/MeetingDetailSheet";
import {
  CheckCircle,
  ChevronRight,
  MapPin,
  Calendar,
  Shield,
  Clock,
  Plus,
  Close,
} from "@/lib/cyberIcon";
import { Tabs } from "@/components/Tabs";
import { SectionHeader } from "@/components/SectionHeader";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useInView } from "@/hooks/useInView";

interface MeetingWithRegistration extends Meeting {
  userRegistration?: Registration;
}

// ─── Action Card ─────────────────────────────────────
function ActionCard({
  to,
  onClick,
  icon: Icon,
  title,
  description,
  headerFile,
  headerTag,
  tagColor,
  iconBg,
  iconBorder,
  iconColor,
}: {
  to?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  headerFile: string;
  headerTag: string;
  tagColor: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
}) {
  const content = (
    <div className="terminal-window group cursor-pointer hover:border-green-500 dark:hover:border-matrix/40 transition-all duration-300 relative overflow-hidden">
      {/* Hover glow line */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 dark:via-matrix to-transparent" />
      </div>

      <div className="terminal-header">
        <div className="terminal-dot red" />
        <div className="terminal-dot yellow" />
        <div className="terminal-dot green" />
        <span className="ml-4 text-xs text-gray-500 font-terminal">
          {headerFile}
        </span>
        <span className={`ml-auto text-xs font-terminal ${tagColor}`}>
          {headerTag}
        </span>
      </div>
      <div className="terminal-body">
        <div className="flex items-center gap-5">
          <div
            className={`w-14 h-14 ${iconBg} border ${iconBorder} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}
          >
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-matrix mb-1 group-hover:tracking-wider transition-all duration-300">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-500 text-sm">
              {description}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-matrix/30 group-hover:text-green-600 dark:group-hover:text-matrix group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }
  return <div onClick={onClick}>{content}</div>;
}

function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [meetings, setMeetings] = useState<MeetingWithRegistration[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">(
    "upcoming",
  );
  const { user, userProfile } = useAuth();
  const { isVerifiedOfficer } = useOfficerVerification();

  // Sheet / detail drawer state (ported from Meetings.tsx) driven by ?meeting=slug
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSlug = searchParams.get("meeting");

  const openMeeting = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("meeting", slug);
    setSearchParams(params, { replace: false });
  };

  const closeMeeting = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("meeting");
    setSearchParams(params, { replace: true });
  };

  // Search + Type filter (expandable search + pills), synced with URL for deep linking from tags in MeetingDetails
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState<"all" | MeetingType>(() => (searchParams.get("type") as any) || "all");
  const [isSearchExpanded, setIsSearchExpanded] = useState(!!searchParams.get("q"));

  const updateFilterUrl = (q?: string, t?: string) => {
    const params = new URLSearchParams(searchParams);
    if (q !== undefined) {
      if (q.trim()) params.set("q", q.trim()); else params.delete("q");
    }
    if (t !== undefined) {
      if (t && t !== "all") params.set("type", t); else params.delete("type");
    }
    setSearchParams(params, { replace: true });
  };

  // Officer create meeting flow (exact same as Meetings.tsx)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMeetingForm>(defaultCreateForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showCreateTopicSuggestions, setShowCreateTopicSuggestions] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // Sync search + type filters from URL (so clicks on "Topics Covered" / type tags
  // from MeetingDetails — even when the sheet is open — actually filter the list).
  // Using functional setters avoids stale closures and feedback loops.
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const t = (searchParams.get("type") as MeetingType | null) || "all";

    setSearchQuery((curr) => (curr !== q ? q : curr));
    setTypeFilter((curr) => (curr !== t ? t : curr));

    if (q) {
      setIsSearchExpanded(true);
    } else {
      // Collapse search UI only when URL no longer carries a query
      setIsSearchExpanded((exp) => (searchParams.get("q") ? exp : false));
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      setDataLoading(true);
      try {
        // Single roundtrip via optimized SECURITY DEFINER RPC.
        // Returns meetings (public fields) + embedded my_registration + attendance_count.
        const { data, error } = await supabase.rpc("get_my_dashboard_data");

        if (error) throw error;

        const meetingsRaw = (data?.meetings || []) as any[];
        const mapped: MeetingWithRegistration[] = meetingsRaw.map((m) => ({
          ...(m as Meeting),
          userRegistration: m.my_registration
            ? ({
                id: m.my_registration.id,
                meeting_id: m.id,
                user_id: user?.id,
                status: m.my_registration.status,
                registered_at: m.my_registration.registered_at,
              } as Registration)
            : undefined,
        }));

        setMeetings(mapped);
        setAttendanceCount(data?.attendance_count || 0);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        // Fallback to the old (slower) path if the new RPC isn't deployed yet
        try {
          const { data: meetingsData } = await supabase
            .from("meetings_public")
            .select("*")
            .order("date", { ascending: true });

          if (meetingsData && user) {
            const { data: registrationsData } = await supabase
              .from("registrations")
              .select("*")
              .eq("user_id", user.id);

            const meetingsWithRegistrations: MeetingWithRegistration[] =
              meetingsData.map((meeting) => {
                const registration = registrationsData?.find(
                  (r) => r.meeting_id === meeting.id,
                );
                return {
                  ...(meeting as Meeting),
                  userRegistration: registration,
                };
              });
            setMeetings(meetingsWithRegistrations);
          } else if (meetingsData) {
            setMeetings(meetingsData as Meeting[]);
          }

          if (user) {
            const { count } = await supabase
              .from("attendance")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id);
            setAttendanceCount(count || 0);
          }
        } catch (fallbackErr) {
          console.error("Fallback fetch also failed:", fallbackErr);
        }
      } finally {
        setDataLoading(false);
      }
    }

    if (user) {
      fetchData();
    } else {
      setDataLoading(false);
    }
  }, [user]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter((m) => parseLocalDate(m.date) >= today)
      .sort(
        (a, b) =>
          parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime(),
      );
  }, [meetings, today]);

  // All past meetings (for the "Past" tab — show every past event regardless of personal attendance)
  const pastMeetings = useMemo(() => {
    return meetings
      .filter((m) => parseLocalDate(m.date) < today)
      .sort(
        (a, b) =>
          parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime(),
      );
  }, [meetings, today]);

  // All past meetings the user *could* have attended (for accurate rate calculations)
  const eligiblePastMeetings = useMemo(() => {
    return meetings.filter((m) => parseLocalDate(m.date) < today);
  }, [meetings, today]);

  const baseDisplayed =
    activeTab === "upcoming" ? upcomingMeetings : pastMeetings;

  // Apply search + type filter (client-side on whatever the tab gives us)
  const displayedMeetings = useMemo(() => {
    let list = baseDisplayed;

    if (typeFilter !== "all") {
      list = list.filter((m) => m.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q) ||
        (m.location || "").toLowerCase().includes(q) ||
        m.topics?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [baseDisplayed, searchQuery, typeFilter]);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    meetings.forEach((m) => m.topics?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [meetings]);

  // Same autocomplete suggestions logic as Meetings.tsx for the create form
  const createTopicSuggestions = useMemo(() => {
    const partial = getLastTopicPartial(createForm.topics);
    const current = getCurrentTopicsList(createForm.topics);
    if (!partial) return [];
    return allTopics
      .filter((t) =>
        t.toLowerCase().includes(partial) &&
        !current.some((c) => c.toLowerCase() === t.toLowerCase())
      )
      .slice(0, 8);
  }, [createForm.topics, allTopics]);

  const getStatusBadge = (registration?: Registration, isPastEvent = false) => {
    if (!registration || registration.status === "cancelled") {
      return null;
    }

    if (isPastEvent) {
      const pastStatusConfig = {
        attended: {
          label: "Attended",
          color:
            "bg-green-100 dark:bg-matrix/20 text-green-800 dark:text-matrix border-green-300 dark:border-matrix/40",
        },
        registered: {
          label: "Registered",
          color:
            "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700",
        },
        waitlist: {
          label: "Waitlisted",
          color:
            "bg-yellow-100 dark:bg-hack-yellow/10 text-yellow-800 dark:text-hack-yellow border-yellow-300 dark:border-hack-yellow/30",
        },
        invited: {
          label: "Invited",
          color:
            "bg-orange-100 dark:bg-hack-orange/10 text-orange-800 dark:text-hack-orange border-orange-300 dark:border-hack-orange/30",
        },
      };
      return pastStatusConfig[registration.status] || null;
    }

    const statusConfig = {
      registered: {
        label: "Going",
        color:
          "bg-green-100 dark:bg-matrix/20 text-green-800 dark:text-matrix border-green-300 dark:border-matrix/40",
      },
      waitlist: {
        label: "Waitlist",
        color:
          "bg-yellow-100 dark:bg-hack-yellow/10 text-yellow-800 dark:text-hack-yellow border-yellow-300 dark:border-hack-yellow/30",
      },
      invited: {
        label: "Invited",
        color:
          "bg-cyan-100 dark:bg-hack-cyan/10 text-cyan-800 dark:text-hack-cyan border-cyan-300 dark:border-hack-cyan/30",
      },
      attended: {
        label: "Going",
        color:
          "bg-green-100 dark:bg-matrix/20 text-green-800 dark:text-matrix border-green-300 dark:border-matrix/40",
      },
    };

    return statusConfig[registration.status] || null;
  };

  // Exact same create logic as Meetings.tsx (rich form with topics autocomplete, slug, proper time formatting, etc.)
  const createMeeting = async () => {
    if (!createForm.title.trim()) {
      setCreateError("Title is required");
      return;
    }
    if (!createForm.date) {
      setCreateError("Date is required");
      return;
    }
    if (!createForm.startTime || !createForm.endTime) {
      setCreateError("Start and end times are required");
      return;
    }

    const slug = createForm.slug.trim() || createForm.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      setCreateError("Invalid slug format. Use lowercase letters, numbers, and hyphens only.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const topicsArray = createForm.topics
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const resourcesWithDiscord = [
        { id: "discord-default", title: "Join Discord", url: "https://discord.gg/v5JWDrZVNp", type: "link" as const },
      ];

      const timeStr = formatTimeRange(createForm.startTime, createForm.endTime);

      const { data, error } = await supabase.rpc("create_meeting_for_officers", {
        p_slug: slug,
        p_title: createForm.title.trim(),
        p_description: createForm.description.trim() || "No description provided.",
        p_date: createForm.date,
        p_time: timeStr,
        p_location: createForm.location.trim() || "ATC 205",
        p_type: createForm.type,
        p_featured: createForm.featured,
        p_topics: topicsArray,
        p_secret_code: createForm.secret_code.trim() || null,
        p_resources: resourcesWithDiscord,
      });

      if (error) throw error;

      const newMeeting = Array.isArray(data) ? data[0] : data;

      setShowCreateModal(false);
      setCreateForm(defaultCreateForm);
      setShowCreateTopicSuggestions(false);

      // Refresh dashboard data + open the new meeting in the sheet
      // (simple & reliable given the personalized RPC)
      if (newMeeting?.slug) {
        // Optimistic: add to local list so it appears without full reload
        const optimistic: MeetingWithRegistration = {
          ...(newMeeting as Meeting),
          userRegistration: undefined,
        };
        setMeetings((prev) => [optimistic, ...prev]);

        // Open it in the sheet
        const params = new URLSearchParams(searchParams);
        params.set("meeting", newMeeting.slug);
        params.delete("q"); // clear search so the new one is visible
        setSearchParams(params, { replace: false });
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Error creating meeting:", err);
      if (err?.message?.includes("duplicate")) {
        setCreateError("A meeting with this slug already exists. Please choose a different one.");
      } else {
        setCreateError("Failed to create meeting. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10">
        {/* Header */}
        <header
          className={`min-h-[40vh] flex flex-col justify-center relative overflow-hidden mb-12 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* Background ASCII Art */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <pre className="font-mono text-[clamp(40px,12vw,160px)] leading-[0.85] text-green-200/20 dark:text-matrix/[0.03] whitespace-pre">
              {`██████╗  █████╗ ███████╗██╗  ██╗
██╔══██╗██╔══██╗██╔════╝██║  ██║
██║  ██║███████║███████╗███████║
██║  ██║██╔══██║╚════██║██╔══██║
██████╔╝██║  ██║███████║██║  ██║
╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`}
            </pre>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 w-full">
            <p className="font-mono text-sm text-gray-600 dark:text-matrix/60 mb-6">
              <span className="text-green-700 dark:text-matrix">&gt;</span>{" "}
              ./dashboard --user
            </p>
            <h1 className="font-mono font-bold text-green-700 dark:text-matrix leading-tight mb-6">
              <span className="block text-4xl md:text-5xl lg:text-6xl uppercase">
                WELCOME,
              </span>
              <span className="block text-4xl md:text-5xl lg:text-6xl uppercase">
                {userProfile?.display_name || "HACKER"}
              </span>
            </h1>
            <div className="border-l-2 border-green-300 dark:border-matrix/30 pl-5 max-w-2xl">
              <p className="font-mono text-gray-600 dark:text-gray-400 text-sm md:text-base">
                <span className="text-green-700 dark:text-matrix">
                  [{userProfile?.student_id || "NO_ID"}]
                </span>{" "}
                · Session active
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 pb-12">
          {/* Action Cards */}
          <div className="space-y-4 mb-12">
            <ScrollReveal delay={0}>
              <ActionCard
                to="/live"
                icon={CheckCircle}
                title="Mark Attendance"
                description="At a meeting? Enter the secret code to check in and record your attendance."
                headerFile="attendance_check_in.sh"
                headerTag="READY"
                tagColor="text-cyan-600 dark:text-hack-cyan animate-pulse"
                iconBg="bg-blue-50 dark:bg-matrix/10"
                iconBorder="border-blue-200 dark:border-matrix/30"
                iconColor="text-blue-600 dark:text-matrix"
              />
            </ScrollReveal>

            {isVerifiedOfficer === true && (
              <ScrollReveal delay={50}>
                <ActionCard
                  to="/officer"
                  icon={Shield}
                  title="Officer Dashboard"
                  description="Manage members, view registrations, and access admin tools."
                  headerFile="officer_dashboard.sh"
                  headerTag="ADMIN"
                  tagColor="text-purple-600 dark:text-hack-purple"
                  iconBg="bg-purple-50 dark:bg-hack-purple/10"
                  iconBorder="border-purple-200 dark:border-hack-purple/30"
                  iconColor="text-purple-600 dark:text-hack-purple"
                />
              </ScrollReveal>
            )}

            {/* New Meeting button — only for verified officers (ported from Meetings.tsx) */}
            {isVerifiedOfficer === true && (
              <ScrollReveal delay={60}>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="cli-btn-filled px-4 py-2 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Meeting
                </button>
              </ScrollReveal>
            )}
          </div>

          {/* Events */}
          <ScrollReveal delay={0}>
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <SectionHeader index="01" title="Events" />

                <div className="flex items-center gap-3 flex-wrap">
                  <Tabs
                    tabs={[
                      { id: "upcoming", label: "Upcoming" },
                      { id: "past", label: "Past" },
                    ]}
                    activeTab={activeTab}
                    onTabChange={(tab) =>
                      setActiveTab(tab as "upcoming" | "past")
                    }
                  />

                  {/* Expandable search button (per request) */}
                  <div className="flex items-center gap-2">
                    {!isSearchExpanded ? (
                      <button
                        onClick={() => setIsSearchExpanded(true)}
                        className="p-2 border border-gray-300 dark:border-gray-700 hover:border-green-500 dark:hover:border-matrix/60 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-matrix transition-colors rounded"
                        aria-label="Search events"
                        title="Search events"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    ) : (
                      <div className="relative w-48 sm:w-64">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            updateFilterUrl(e.target.value, undefined);
                          }}
                          placeholder="Search by name, topic, location..."
                          className="input-hack w-full pr-8 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setIsSearchExpanded(false);
                            updateFilterUrl("", undefined);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Close search"
                        >
                          <Close className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Type filter pills (always visible, works with search + tabs) */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-[10px] font-terminal text-gray-500 dark:text-gray-600 uppercase tracking-wider mr-1">Filter</span>
                {(["all", "workshop", "lecture", "ctf", "social", "general"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      const next = t === "all" ? "all" : t;
                      setTypeFilter(next as any);
                      updateFilterUrl(undefined, next);
                    }}
                    className={`px-2.5 py-0.5 text-xs font-terminal border transition-all ${
                      typeFilter === t
                        ? t === "all"
                          ? "bg-blue-100 dark:bg-matrix/20 text-blue-700 dark:text-matrix border-blue-300 dark:border-matrix"
                          : `bg-opacity-15 dark:bg-opacity-15 ${TYPE_COLORS[t]}`
                        : "bg-gray-100 dark:bg-terminal-alt text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {t === "all" ? "ALL" : TYPE_LABELS[t]}
                  </button>
                ))}
                {(searchQuery || typeFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("all");
                      setIsSearchExpanded(false);
                      updateFilterUrl("", "all");
                    }}
                    className="ml-2 text-xs font-terminal text-hack-red hover:text-red-400"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {dataLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-24 h-14 bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
                      <div className="flex-1 border border-gray-200 dark:border-matrix/20 p-4">
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 mb-3 animate-pulse" />
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 mb-2 animate-pulse" />
                        <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedMeetings.length > 0 ? (
                <div className="space-y-0">
                  {displayedMeetings.map((meeting, index) => (
                    <div key={meeting.id} className="flex gap-4 group">
                      {/* Timeline column */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="text-left w-24">
                          <div className="text-sm font-terminal text-gray-700 dark:text-gray-400">
                            {parseLocalDate(meeting.date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-600 font-terminal">
                            {parseLocalDate(meeting.date).toLocaleDateString(
                              "en-US",
                              { weekday: "long" },
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center flex-1 mt-2">
                          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 group-hover:bg-green-500 dark:group-hover:bg-matrix transition-colors" />
                          {index < displayedMeetings.length - 1 && (
                            <div className="h-full min-h-[60px] border-l-2 border-dotted border-gray-300 dark:border-gray-700 group-hover:border-green-400 dark:group-hover:border-matrix/30 transition-colors" />
                          )}
                        </div>
                      </div>

                      {/* Event card — click opens the same MeetingDetailSheet as in the old /meetings */}
                      <div
                        onClick={() => openMeeting(meeting.slug)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openMeeting(meeting.slug);
                          }
                        }}
                        className="flex-1 border border-gray-200 dark:border-matrix/20 p-4 hover:border-green-500 dark:hover:border-matrix/40 hover:bg-green-50/30 dark:hover:bg-matrix/[0.03] hover:translate-x-1 transition-all duration-300 mb-4 relative overflow-hidden group/card cursor-pointer"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-matrix scale-y-0 group-hover/card:scale-y-100 transition-transform duration-300 origin-top" />
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-gray-500 dark:text-gray-500 text-xs font-terminal flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {meeting.time}
                              </span>
                            </div>
                            <h3 className="text-gray-900 dark:text-matrix font-semibold text-base mb-2 group-hover/card:tracking-wider transition-all duration-300">
                              {meeting.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span
                                className={`inline-block px-2 py-0.5 text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}
                              >
                                {TYPE_LABELS[meeting.type]}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-600">
                                <MapPin className="w-3 h-3" />
                                {meeting.location}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {activeTab === "past" ? (
                                // Past tab: show Attended (green) or Not Attended (red) for every past event
                                meeting.userRegistration?.status === "attended" ? (
                                  <span className="inline-block px-2 py-0.5 text-xs font-terminal border bg-green-100 dark:bg-matrix/20 text-green-800 dark:text-matrix border-green-300 dark:border-matrix/40">
                                    Attended
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 text-xs font-terminal border bg-red-100 dark:bg-hack-red/10 text-red-700 dark:text-hack-red border-red-300 dark:border-hack-red/40">
                                    Not Attended
                                  </span>
                                )
                              ) : meeting.userRegistration &&
                                getStatusBadge(
                                  meeting.userRegistration,
                                  false,
                                ) ? (
                                <span
                                  className={`inline-block px-2 py-0.5 text-xs font-terminal border ${getStatusBadge(meeting.userRegistration, false)!.color}`}
                                >
                                  {getStatusBadge(meeting.userRegistration, false)!.label}
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 text-xs font-terminal border bg-blue-50 dark:bg-hack-cyan/5 text-blue-700 dark:text-hack-cyan border-blue-200 dark:border-hack-cyan/20">
                                  Invited
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-matrix/30 group-hover/card:text-green-600 dark:group-hover/card:text-matrix group-hover/card:translate-x-0.5 transition-all shrink-0 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="terminal-window">
                  <div className="terminal-header">
                    <div className="terminal-dot red" />
                    <div className="terminal-dot yellow" />
                    <div className="terminal-dot green" />
                  </div>
                  <div className="terminal-body text-center py-14">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 mx-auto mb-5 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {searchQuery || typeFilter !== "all"
                          ? "No matches for your filters"
                          : activeTab === "upcoming"
                            ? "No upcoming events yet"
                            : "No past events yet"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-500 text-sm mb-6">
                        {searchQuery || typeFilter !== "all"
                          ? "Try a different search term or clear the type filter."
                          : activeTab === "upcoming"
                            ? "Check out our meetings page to discover and register for upcoming events and workshops."
                            : "All past club events appear here. Events you attended are marked green; others show as Not Attended."}
                      </p>
                      {searchQuery || typeFilter !== "all" ? (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setTypeFilter("all");
                            setIsSearchExpanded(false);
                            updateFilterUrl("", "all");
                          }}
                          className="cli-btn-filled px-6 py-2.5 inline-flex items-center gap-2 text-sm"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <Link
                          to="/dashboard"
                          className="cli-btn-filled px-6 py-2.5 inline-flex items-center gap-2 text-sm"
                        >
                          <Calendar className="w-4 h-4" />
                          {activeTab === "upcoming" ? "Browse All Events" : "Browse Events"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </ScrollReveal>

          {/* My Stats */}
          <ScrollReveal delay={0}>
            <section className="mb-12">
              <SectionHeader index="02" title="My Stats" />

              <div className="grid md:grid-cols-3 gap-4">
                {/* Attendance Ring */}
                <div className="border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-24 shrink-0">
                      <svg
                        className="w-24 h-24 transform -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-gray-200 dark:text-gray-800"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeLinecap="round"
                          className="text-green-600 dark:text-matrix"
                          strokeDasharray={`${(attendanceCount / Math.max(eligiblePastMeetings.length, 1)) * 251.2} 251.2`}
                          style={{ transition: "stroke-dasharray 1s ease-out" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-green-700 dark:text-matrix">
                          {attendanceCount}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-600 font-terminal">
                          ATTENDED
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-matrix mb-3">
                        Attendance
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between font-mono text-xs">
                          <span className="text-gray-500 dark:text-gray-500">
                            Events Attended
                          </span>
                          <span className="text-green-700 dark:text-matrix">
                            {attendanceCount}
                          </span>
                        </div>
                        <div className="flex justify-between font-mono text-xs">
                          <span className="text-gray-500 dark:text-gray-500">
                            Total Events
                          </span>
                          <span className="text-gray-700 dark:text-gray-400">
                            {meetings.length}
                          </span>
                        </div>
                        <div className="flex justify-between font-mono text-xs">
                          <span className="text-gray-500 dark:text-gray-500">
                            Attendance Rate
                          </span>
                          <span className="text-green-700 dark:text-matrix">
                            {eligiblePastMeetings.length > 0
                              ? Math.round(
                                  (attendanceCount /
                                    eligiblePastMeetings.length) *
                                    100,
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Types Breakdown */}
                <div className="border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 transition-colors">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-matrix mb-4">
                    Events by Type
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const typeStats = meetings.reduce(
                        (acc, m) => {
                          if (!acc[m.type]) {
                            acc[m.type] = { total: 0, attended: 0 };
                          }
                          acc[m.type].total += 1;
                          if (m.userRegistration?.status === "attended") {
                            acc[m.type].attended += 1;
                          }
                          return acc;
                        },
                        {} as Record<
                          string,
                          { total: number; attended: number }
                        >,
                      );
                      const maxCount = Math.max(
                        ...Object.values(typeStats).map((s) => s.total),
                        1,
                      );

                      return Object.entries(typeStats).map(([type, stats]) => (
                        <div key={type}>
                          <div className="flex justify-between text-xs mb-1 font-mono">
                            <span
                              className={`${TYPE_COLORS[type as keyof typeof TYPE_COLORS]?.split(" ")[1] || "text-gray-400"}`}
                            >
                              {TYPE_LABELS[type as keyof typeof TYPE_LABELS] ||
                                type}
                            </span>
                            <span className="text-gray-500 dark:text-gray-500">
                              <span className="text-green-700 dark:text-matrix">
                                {stats.attended}
                              </span>
                              /{stats.total}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-800 overflow-hidden flex">
                            <div
                              className={`h-full transition-all duration-700 ${
                                type === "workshop"
                                  ? "bg-green-500 dark:bg-matrix"
                                  : type === "ctf"
                                    ? "bg-cyan-500 dark:bg-hack-cyan"
                                    : type === "social"
                                      ? "bg-purple-500 dark:bg-hack-purple"
                                      : type === "competition"
                                        ? "bg-orange-500 dark:bg-hack-orange"
                                        : "bg-gray-500 dark:bg-gray-400"
                              }`}
                              style={{
                                width: `${(stats.attended / maxCount) * 100}%`,
                              }}
                            />
                            <div
                              className="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-700"
                              style={{
                                width: `${((stats.total - stats.attended) / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ));
                    })()}
                    {Object.keys(
                      meetings.reduce(
                        (acc, m) => {
                          acc[m.type] = true;
                          return acc;
                        },
                        {} as Record<string, boolean>,
                      ),
                    ).length === 0 && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm text-center py-4 font-mono">
                        No events yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Activity Overview */}
                <OverviewCard
                  meetings={meetings}
                  upcomingMeetings={upcomingMeetings}
                  studentId={userProfile?.student_id}
                />
              </div>

              {/* Monthly Activity Chart */}
              <div className="border border-gray-200 dark:border-matrix/20 p-5 mt-4 hover:border-green-500 dark:hover:border-matrix/40 transition-colors">
                <h3 className="text-base font-semibold text-gray-900 dark:text-matrix mb-4">
                  Monthly Activity
                </h3>
                <div className="flex items-end gap-2 h-28">
                  {(() => {
                    const now = new Date();
                    const months: {
                      label: string;
                      total: number;
                      attended: number;
                    }[] = [];

                    for (let i = 5; i >= 0; i--) {
                      const date = new Date(
                        now.getFullYear(),
                        now.getMonth() - i,
                        1,
                      );
                      const monthMeetings = meetings.filter((m) => {
                        const mDate = parseLocalDate(m.date);
                        return (
                          mDate.getMonth() === date.getMonth() &&
                          mDate.getFullYear() === date.getFullYear()
                        );
                      });
                      const attendedMeetings = monthMeetings.filter(
                        (m) => m.userRegistration?.status === "attended",
                      );
                      months.push({
                        label: date.toLocaleDateString("en-US", {
                          month: "short",
                        }),
                        total: monthMeetings.length,
                        attended: attendedMeetings.length,
                      });
                    }

                    const maxEvents = Math.max(
                      ...months.map((m) => m.total),
                      1,
                    );

                    return months.map((month, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div className="w-full flex flex-col items-center justify-end h-20">
                          <div
                            className="w-full max-w-6 bg-gray-300 dark:bg-gray-600 transition-all duration-500"
                            style={{
                              height:
                                month.total > 0
                                  ? `${Math.max(((month.total - month.attended) / maxEvents) * 100, 0)}%`
                                  : "0",
                            }}
                          />
                          <div
                            className={`w-full max-w-6 transition-all duration-500 ${
                              month.attended > 0
                                ? "bg-green-500 dark:bg-matrix"
                                : "bg-gray-200 dark:bg-gray-800"
                            }`}
                            style={{
                              height:
                                month.attended > 0
                                  ? `${Math.max((month.attended / maxEvents) * 100, 10)}%`
                                  : month.total === 0
                                    ? "4px"
                                    : "0",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-600 font-terminal">
                          {month.label}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-500 font-mono">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-600 dark:bg-matrix" />
                      Attended
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600" />
                      Not attended
                    </span>
                  </div>
                  <span>
                    <span className="text-green-700 dark:text-matrix">
                      {attendanceCount}
                    </span>
                    /{eligiblePastMeetings.length} past events
                  </span>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Browse All Events CTA */}
          <ScrollReveal delay={0}>
            <Link
              to="/dashboard"
              className="block border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 hover:bg-green-50/30 dark:hover:bg-matrix/[0.03] hover:translate-x-1 transition-all duration-300 group text-center relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-matrix scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
              <div className="flex items-center justify-center gap-3">
                <Calendar className="w-5 h-5 text-green-700 dark:text-matrix" />
                <span className="text-gray-900 dark:text-matrix font-semibold">
                  Browse All Events & Meetings
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-matrix/30 group-hover:text-green-600 dark:group-hover:text-matrix group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </div>

    {/* Meeting detail sheet (sidebar on desktop, bottom sheet on mobile) — exact same component as used in Meetings.tsx */}
    <MeetingDetailSheet
      slug={selectedSlug}
      onClose={closeMeeting}
      availableTopics={allTopics}
      onSelectMeeting={(newSlug) => {
        const params = new URLSearchParams(searchParams);
        params.set("meeting", newSlug);
        setSearchParams(params, { replace: true });
      }}
    />

    {/* Officer-only Create New Meeting modal — EXACT same rich form as in Meetings.tsx (topics autocomplete, slug preview, type select, featured toggle, proper time range, etc.) */}
    {showCreateModal && isVerifiedOfficer === true && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80">
        <div className="terminal-window w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="terminal-header flex-shrink-0">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-500 font-terminal">create_meeting.sh</span>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm(defaultCreateForm);
                setCreateError("");
                setShowCreateTopicSuggestions(false);
              }}
              className="ml-auto text-gray-500 hover:text-white transition-colors"
            >
              <Close className="w-5 h-5" />
            </button>
          </div>
          <div className="terminal-body space-y-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-matrix">Create New Meeting</h2>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 dark:bg-hack-red/10 border border-red-300 dark:border-hack-red/50 text-red-700 dark:text-hack-red text-sm">
                {createError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">TITLE *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="input-hack w-full"
                  placeholder="Introduction to Ethical Hacking"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">URL SLUG</label>
                <input
                  type="text"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className="input-hack w-full"
                  placeholder="auto-generated-from-title"
                />
                <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">/dashboard?meeting={createForm.slug || createForm.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 30) || "slug"}</p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">TYPE</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as any })}
                  className="input-hack w-full"
                >
                  <option value="general">General</option>
                  <option value="workshop">Workshop</option>
                  <option value="lecture">Lecture</option>
                  <option value="ctf">CTF</option>
                  <option value="social">Social</option>
                </select>
              </div>

              {/* Date + Time Range */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">DATE *</label>
                    <input
                      type="date"
                      value={createForm.date}
                      onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                      className="input-hack w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">START TIME *</label>
                    <input
                      type="time"
                      value={createForm.startTime}
                      onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                      className="input-hack w-full"
                      step="900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">END TIME *</label>
                    <input
                      type="time"
                      value={createForm.endTime}
                      onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                      className="input-hack w-full"
                      step="900"
                    />
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-600 font-mono">
                  Stored as: {formatTimeRange(createForm.startTime, createForm.endTime)}
                </p>
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">LOCATION</label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="input-hack w-full"
                  placeholder="ATC 205"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">DESCRIPTION</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="input-hack w-full min-h-[80px] resize-y"
                  placeholder="Describe the meeting..."
                />
              </div>

              {/* Topics with autocomplete (exact same as Meetings.tsx) */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">TOPICS (comma-separated)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={createForm.topics}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, topics: e.target.value });
                      if (!showCreateTopicSuggestions) setShowCreateTopicSuggestions(true);
                    }}
                    onFocus={() => {
                      if (allTopics.length > 0) setShowCreateTopicSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowCreateTopicSuggestions(false), 150)}
                    className="input-hack w-full"
                    placeholder="Security, Hacking, CTF"
                  />
                  {showCreateTopicSuggestions && createTopicSuggestions.length > 0 && (
                    <div className="absolute z-[60] mt-1 w-full max-h-44 overflow-auto rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-terminal-bg shadow-lg">
                      <div className="px-2 py-1 text-[10px] text-gray-500 dark:text-gray-600 font-terminal border-b border-gray-200 dark:border-gray-800">Suggestions from existing tags</div>
                      {createTopicSuggestions.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const partial = getLastTopicPartial(createForm.topics);
                            const currentList = getCurrentTopicsList(createForm.topics);
                            let next: string;
                            if (partial && tag.toLowerCase().startsWith(partial)) {
                              const parts = createForm.topics.split(",");
                              parts[parts.length - 1] = " " + tag;
                              next = parts.join(",").trim();
                            } else if (!currentList.some((c) => c.toLowerCase() === tag.toLowerCase())) {
                              next = createForm.topics.trim() ? createForm.topics.trim() + ", " + tag : tag;
                            } else {
                              next = createForm.topics;
                            }
                            setCreateForm({ ...createForm, topics: next });
                          }}
                          className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-terminal-alt font-mono border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-600 mt-1">Type to search existing topics. Click to add (supports multiple).</p>
              </div>

              {/* Secret Code */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">ATTENDANCE CODE</label>
                <input
                  type="text"
                  value={createForm.secret_code}
                  onChange={(e) => setCreateForm({ ...createForm, secret_code: e.target.value.toUpperCase() })}
                  className="input-hack w-full font-mono"
                  placeholder="SECRETCODE"
                />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setCreateForm({ ...createForm, featured: !createForm.featured })}
                  className={`relative w-12 h-6 transition-colors border ${createForm.featured ? "bg-blue-600 dark:bg-matrix border-blue-600 dark:border-matrix" : "bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white transition-transform ${createForm.featured ? "left-7" : "left-1"}`} />
                </button>
                <label className="text-sm text-gray-700 dark:text-gray-400">Featured meeting</label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm(defaultCreateForm);
                  setCreateError("");
                  setShowCreateTopicSuggestions(false);
                }}
                disabled={creating}
                className="cli-btn-dashed disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={createMeeting}
                disabled={creating}
                className="cli-btn-filled disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <span className="animate-spin h-4 w-4 inline-block">⏳</span>}
                {creating ? "CREATING..." : "CREATE MEETING"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
}

// ─── Overview Card (extracted to use useInView) ──────
function OverviewCard({
  meetings,
  upcomingMeetings,
  studentId,
}: {
  meetings: MeetingWithRegistration[];
  upcomingMeetings: MeetingWithRegistration[];
  studentId: string | null | undefined;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  return (
    <div
      ref={ref}
      className="border border-gray-200 dark:border-matrix/20 p-5 hover:border-green-500 dark:hover:border-matrix/40 transition-colors"
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-matrix mb-4">
        Quick Overview
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-green-50 dark:bg-matrix/5 border border-green-200 dark:border-matrix/20">
          <div className="text-2xl font-bold text-green-700 dark:text-matrix">
            <AnimatedCounter value={upcomingMeetings.length} inView={inView} />
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-terminal uppercase mt-1">
            Upcoming
          </div>
        </div>
        <div className="text-center p-3 bg-cyan-50 dark:bg-hack-cyan/5 border border-cyan-200 dark:border-hack-cyan/20">
          <div className="text-2xl font-bold text-cyan-700 dark:text-hack-cyan">
            <AnimatedCounter
              value={
                meetings.filter(
                  (m) =>
                    m.userRegistration &&
                    m.userRegistration.status !== "cancelled",
                ).length
              }
              inView={inView}
            />
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-terminal uppercase mt-1">
            Registered
          </div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-hack-purple/5 border border-purple-200 dark:border-hack-purple/20">
          <div className="text-2xl font-bold text-purple-700 dark:text-hack-purple">
            <AnimatedCounter
              value={upcomingMeetings.filter((m) => m.userRegistration).length}
              inView={inView}
            />
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-terminal uppercase mt-1">
            RSVPs
          </div>
        </div>
        <div
          className={`text-center p-3 border ${
            studentId
              ? "bg-green-50 dark:bg-matrix/5 border-green-200 dark:border-matrix/20"
              : "bg-yellow-50 dark:bg-hack-yellow/5 border-yellow-200 dark:border-hack-yellow/20"
          }`}
        >
          <div
            className={`text-lg font-bold ${
              studentId
                ? "text-green-700 dark:text-matrix"
                : "text-yellow-700 dark:text-hack-yellow"
            }`}
          >
            {studentId ? "OK" : "??"}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-terminal uppercase mt-1">
            ID Status
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
