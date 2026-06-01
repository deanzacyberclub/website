import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { useOfficerVerification } from '@/hooks/useOfficerVerification'
import type { Meeting, MeetingType, Resource } from '@/types/database.types'
import { Spinner, Close, Plus, Calendar, Clock, MapPin, Star } from '@/lib/cyberIcon'
import MeetingDetails from './MeetingDetails'

type FilterType = 'all' | 'upcoming' | 'past'
type TypeFilter = 'all' | MeetingType

export const TYPE_COLORS: Record<MeetingType, string> = {
  workshop: 'text-hack-cyan border-hack-cyan/50',
  lecture: 'text-hack-yellow border-hack-yellow/50',
  ctf: 'text-hack-red border-hack-red/50',
  social: 'text-purple-400 border-purple-400/50',
  general: 'text-matrix border-matrix/50'
}

export const TYPE_LABELS: Record<MeetingType, string> = {
  workshop: 'WORKSHOP',
  lecture: 'LECTURE',
  ctf: 'CTF',
  social: 'SOCIAL',
  general: 'GENERAL'
}

// Discord is the canonical announcement channel.
// We always ensure this resource exists on every meeting.
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

interface CreateMeetingForm {
  slug: string
  title: string
  description: string
  date: string
  time: string
  location: string
  type: MeetingType
  featured: boolean
  topics: string
  secret_code: string
}

const defaultCreateForm: CreateMeetingForm = {
  slug: '',
  title: '',
  description: '',
  date: '',
  time: '',
  location: 'S43 Room 120',
  type: 'general',
  featured: false,
  topics: '',
  secret_code: ''
}

// Parse date string as local timezone (not UTC)
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function Meetings() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isVerifiedOfficer } = useOfficerVerification()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [topicFilter, setTopicFilter] = useState<string | null>(() => searchParams.get('q'))
  const [loaded, setLoaded] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateMeetingForm>(defaultCreateForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const isOfficer = isVerifiedOfficer === true

  // Selected meeting for inline detail panel/sheet (controlled via URL ?meeting=slug)
  const selectedSlug = searchParams.get('meeting')

  const openMeeting = (slug: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('meeting', slug)
    setSearchParams(params, { replace: false })
  }

  const closeMeeting = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('meeting')
    setSearchParams(params, { replace: true })
  }

  // Responsive detection for sheet vs right drawer
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Lock background page scroll when the meeting sheet is open (especially important on mobile)
  useEffect(() => {
    if (!selectedSlug) return

    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const scrollY = window.scrollY

    // Prevent background from scrolling
    document.body.style.overflow = 'hidden'

    // Extra hardening for mobile Safari / iOS when the sheet is open
    if (isMobile) {
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = ''

      // Restore scroll position on iOS-style lock
      if (isMobile) {
        window.scrollTo(0, scrollY)
      }
    }
  }, [selectedSlug, isMobile])

  // Always fetch from the public view immediately so all users see meetings
  useEffect(() => {
    async function fetchMeetings() {
      try {
        const { data, error } = await supabase
          .from('meetings_public')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error
        setMeetings((data as Meeting[]) || [])
      } catch (err) {
        console.error('Error fetching meetings:', err)
      } finally {
        setLoading(false)
        setLoaded(true)
      }
    }

    fetchMeetings()
  }, [])

  // If the user is a verified officer, refetch with secret codes included
  useEffect(() => {
    if (!isOfficer) return

    async function fetchOfficerMeetings() {
      try {
        const { data, error } = await supabase.rpc('get_all_meetings_for_officers')
        if (error) throw error
        setMeetings(data || [])
      } catch (err) {
        console.error('Error fetching officer meetings:', err)
      }
    }

    fetchOfficerMeetings()
  }, [isOfficer])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const featuredMeetings = useMemo(() => {
    return meetings.filter(m => m.featured && parseLocalDate(m.date) >= today)
  }, [meetings])

  const allTopics = useMemo(() => {
    const set = new Set<string>()
    meetings.forEach(m => m.topics?.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [meetings])

  const filteredMeetings = useMemo(() => {
    let filtered = meetings.filter(m => !m.featured || parseLocalDate(m.date) < today)

    if (filter === 'upcoming') {
      filtered = filtered.filter(m => parseLocalDate(m.date) >= today)
    } else if (filter === 'past') {
      filtered = filtered.filter(m => parseLocalDate(m.date) < today)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter)
    }

    if (topicFilter) {
      filtered = filtered.filter(m =>
        m.topics?.some(t => t.toLowerCase() === topicFilter.toLowerCase())
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query) ||
        m.topics?.some(t => t.toLowerCase().includes(query))
      )
    }

    filtered.sort((a, b) => {
      const dateA = parseLocalDate(a.date).getTime()
      const dateB = parseLocalDate(b.date).getTime()
      return dateB - dateA
    })

    return filtered
  }, [meetings, filter, typeFilter, topicFilter, searchQuery])

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isPast = (dateStr: string) => {
    return parseLocalDate(dateStr) < today
  }

  const handleCreateFormChange = (field: keyof CreateMeetingForm, value: string | boolean) => {
    setCreateForm({ ...createForm, [field]: value })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilter('all')
    setTypeFilter('all')
    setTopicFilter(null)
  }

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30)
  }

  const createMeeting = async () => {
    // Validate required fields
    if (!createForm.title.trim()) {
      setCreateError('Title is required')
      return
    }
    if (!createForm.date) {
      setCreateError('Date is required')
      return
    }
    if (!createForm.time.trim()) {
      setCreateError('Time is required')
      return
    }

    // Generate or validate slug
    const slug = createForm.slug.trim() || generateSlugFromTitle(createForm.title)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
      setCreateError('Invalid slug format. Use lowercase letters, numbers, and hyphens only.')
      return
    }

    setCreating(true)
    setCreateError('')

    try {
      const topicsArray = createForm.topics
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      // Always include the canonical Discord link as a resource
      const resourcesWithDiscord = ensureDiscordResource([]);

      const { data, error } = await supabase
        .rpc('create_meeting_for_officers', {
          p_slug: slug,
          p_title: createForm.title.trim(),
          p_description: createForm.description.trim() || 'No description provided.',
          p_date: createForm.date,
          p_time: createForm.time.trim(),
          p_location: createForm.location.trim() || 'TBD',
          p_type: createForm.type,
          p_featured: createForm.featured,
          p_topics: topicsArray,
          p_secret_code: createForm.secret_code.trim() || null,
          p_resources: resourcesWithDiscord
        })

      if (error) throw error

      // The RPC returns an array with one item
      const newMeeting = Array.isArray(data) ? data[0] : data

      // Add to local state and open the detail sheet via URL param (no full route nav)
      setMeetings([newMeeting, ...meetings])
      setShowCreateModal(false)
      setCreateForm(defaultCreateForm)
      const params = new URLSearchParams()
      params.set('meeting', newMeeting.slug)
      setSearchParams(params, { replace: false })
    } catch (err) {
      console.error('Error creating meeting:', err)
      if (err instanceof Error && err.message.includes('duplicate')) {
        setCreateError('A meeting with this slug already exists. Please choose a different one.')
      } else {
        setCreateError('Failed to create meeting. Please try again.')
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix min-h-screen">
      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80">
          <div className="terminal-window w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="terminal-header flex-shrink-0">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">create_meeting.sh</span>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm(defaultCreateForm)
                  setCreateError('')
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
                    onChange={(e) => handleCreateFormChange('title', e.target.value)}
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
                    onChange={(e) => handleCreateFormChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="input-hack w-full"
                    placeholder="auto-generated-from-title"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">/meetings/{createForm.slug || generateSlugFromTitle(createForm.title) || 'slug'}</p>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">TYPE</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => handleCreateFormChange('type', e.target.value)}
                    className="input-hack w-full"
                  >
                    <option value="general">General</option>
                    <option value="workshop">Workshop</option>
                    <option value="lecture">Lecture</option>
                    <option value="ctf">CTF</option>
                    <option value="social">Social</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">DATE *</label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => handleCreateFormChange('date', e.target.value)}
                    className="input-hack w-full"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">TIME *</label>
                  <input
                    type="text"
                    value={createForm.time}
                    onChange={(e) => handleCreateFormChange('time', e.target.value)}
                    className="input-hack w-full"
                    placeholder="4:00 PM - 6:00 PM"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">LOCATION</label>
                  <input
                    type="text"
                    value={createForm.location}
                    onChange={(e) => handleCreateFormChange('location', e.target.value)}
                    className="input-hack w-full"
                    placeholder="S43 Room 120"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">DESCRIPTION</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => handleCreateFormChange('description', e.target.value)}
                    className="input-hack w-full min-h-[80px] resize-y"
                    placeholder="Describe the meeting..."
                  />
                </div>

                {/* Topics */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">TOPICS (comma-separated)</label>
                  <input
                    type="text"
                    value={createForm.topics}
                    onChange={(e) => handleCreateFormChange('topics', e.target.value)}
                    className="input-hack w-full"
                    placeholder="Security, Hacking, CTF"
                  />
                </div>

                {/* Secret Code */}
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-500 font-terminal mb-1">ATTENDANCE CODE</label>
                  <input
                    type="text"
                    value={createForm.secret_code}
                    onChange={(e) => handleCreateFormChange('secret_code', e.target.value.toUpperCase())}
                    className="input-hack w-full font-mono"
                    placeholder="SECRETCODE"
                  />
                </div>

                {/* Featured */}
                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => handleCreateFormChange('featured', !createForm.featured)}
                    className={`relative w-12 h-6 transition-colors border ${createForm.featured ? 'bg-blue-600 dark:bg-matrix border-blue-600 dark:border-matrix' : 'bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white transition-transform ${createForm.featured ? 'left-7' : 'left-1'}`} />
                  </button>
                  <label className="text-sm text-gray-700 dark:text-gray-400">Featured meeting</label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateForm(defaultCreateForm)
                    setCreateError('')
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
                  {creating && <Spinner className="animate-spin h-4 w-4" />}
                  {creating ? 'CREATING...' : 'CREATE MEETING'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with ASCII Background */}
      <header
        className={`min-h-[40vh] flex flex-col justify-center relative overflow-hidden mb-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Background ASCII Art */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <pre className="font-mono text-[clamp(60px,15vw,200px)] leading-[0.85] text-blue-200/20 dark:text-matrix/[0.03] whitespace-pre">
            {`██████╗  █████╗  ██████╗ ██████╗
██╔══██╗██╔══██╗██╔════╝██╔════╝
██║  ██║███████║██║     ██║
██║  ██║██╔══██║██║     ██║
██████╔╝██║  ██║╚██████╗╚██████╗
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝`}
          </pre>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full">
          <p className="font-mono text-sm text-gray-600 dark:text-matrix/60 mb-6">
            <span className="text-blue-700 dark:text-matrix">&gt;</span>{' '}
            cat /var/log/meetings.log
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="font-mono font-bold text-blue-700 dark:text-matrix leading-tight mb-6">
                <span className="block text-5xl md:text-6xl lg:text-7xl">
                  CLUB
                </span>
                <span className="block text-5xl md:text-6xl lg:text-7xl">
                  MEETINGS
                </span>
              </h1>

              <div className="border-l-2 border-blue-300 dark:border-matrix/30 pl-5 max-w-2xl">
                <p className="font-mono text-gray-600 dark:text-gray-400 text-sm md:text-base">
                  Explore our upcoming events and past sessions.
                </p>
              </div>
            </div>
            {isOfficer && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="cli-btn-filled px-4 py-2 flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-5 h-5" />
                New Meeting
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-6">

        {/* Featured Section - stable shell, skeleton while loading */}
        {((loading && meetings.length === 0) || featuredMeetings.length > 0) && (
          <section className={`mb-12 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-blue-600 dark:text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-600 dark:text-gray-400 font-terminal">./highlight --featured</span>
            </div>

            {loading && meetings.length === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="border-2 border-blue-300/40 dark:border-matrix/30 bg-gray-50 dark:bg-terminal-alt p-6">
                    <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
                    <div className="h-6 w-4/5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      <div className="h-4 w-36 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {featuredMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={() => openMeeting(meeting.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openMeeting(meeting.slug)
                      }
                    }}
                    className={`relative overflow-hidden border-2 border-blue-300 dark:border-matrix bg-gradient-to-br from-blue-50 via-white to-blue-25 dark:from-matrix/10 dark:via-terminal-bg dark:to-matrix/5 p-6 group hover:shadow-xl dark:hover:shadow-neon transition-all duration-300 cursor-pointer ${
                      selectedSlug === meeting.slug ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-matrix dark:ring-offset-terminal-bg' : ''
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-terminal bg-blue-100 dark:bg-matrix/20 text-blue-700 dark:text-matrix border border-blue-300 dark:border-matrix/50">
                        <Star className="w-3 h-3" />
                        FEATURED
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className={`inline-block px-2 py-0.5 text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                        {TYPE_LABELS[meeting.type]}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-matrix mb-2 group-hover:text-blue-600 dark:group-hover:neon-text-subtle transition-all">
                      {meeting.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {meeting.description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-500">
                        <Calendar className="w-4 h-4 text-blue-500 dark:text-matrix/70" />
                        {formatDate(meeting.date)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-500">
                        <Clock className="w-4 h-4 text-blue-500 dark:text-matrix/70" />
                        {meeting.time}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-500">
                        <MapPin className="w-4 h-4 text-blue-500 dark:text-matrix/70" />
                        {meeting.location}
                      </div>
                    </div>

                    {meeting.topics && meeting.topics.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {meeting.topics.map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-terminal-alt border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Search and Filter Section */}
        <section className={`mb-8 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 dark:text-gray-500 font-terminal">search_meetings</span>
            </div>
            <div className="terminal-body space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-matrix/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search meetings, topics, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-hack w-full pl-12 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-matrix/60 transition-colors"
                    aria-label="Clear search"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Active Filters Summary */}
              {(filter !== 'all' || typeFilter !== 'all' || topicFilter || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-xs text-gray-500 dark:text-gray-600 font-terminal">ACTIVE:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {filter !== 'all' && (
                      <button
                        onClick={() => setFilter('all')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-terminal border border-blue-300 dark:border-matrix/60 bg-blue-50 dark:bg-matrix/10 text-blue-700 dark:text-matrix hover:bg-blue-100 dark:hover:bg-matrix/20 transition-colors"
                      >
                        {filter.toUpperCase()} <Close className="w-3 h-3" />
                      </button>
                    )}
                    {typeFilter !== 'all' && (
                      <button
                        onClick={() => setTypeFilter('all')}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-terminal border hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${TYPE_COLORS[typeFilter]}`}
                      >
                        {TYPE_LABELS[typeFilter]} <Close className="w-3 h-3" />
                      </button>
                    )}
                    {topicFilter && (
                      <button
                        onClick={() => setTopicFilter(null)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-terminal border border-matrix/60 bg-matrix/10 text-matrix hover:bg-matrix/20 transition-colors"
                      >
                        {topicFilter} <Close className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="ml-auto text-xs font-terminal text-hack-red hover:text-red-400 transition-colors"
                  >
                    CLEAR ALL
                  </button>
                </div>
              )}

              {/* Time + Type Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-x-6 gap-y-3">
                {/* Time Filter - Segmented */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-terminal text-gray-500 dark:text-gray-600 w-12 shrink-0">TIME</span>
                  <div className="inline-flex rounded border border-gray-300 dark:border-gray-700 overflow-hidden text-sm font-terminal">
                    {(['all', 'upcoming', 'past'] as const).map((f, idx) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 transition-all border-r last:border-r-0 border-gray-300 dark:border-gray-700 ${
                          filter === f
                            ? 'bg-blue-100 dark:bg-matrix/20 text-blue-700 dark:text-matrix'
                            : 'bg-white dark:bg-terminal-bg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-terminal-alt/50'
                        }`}
                      >
                        {f === 'all' ? 'ALL' : f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filters - Compact Pills */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-terminal text-gray-500 dark:text-gray-600 w-12 shrink-0">TYPE</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'workshop', 'lecture', 'ctf', 'social', 'general'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-2.5 py-0.5 text-xs font-terminal transition-all border ${
                          typeFilter === t
                            ? t === 'all'
                              ? 'bg-blue-100 dark:bg-matrix/20 text-blue-700 dark:text-matrix border-blue-300 dark:border-matrix'
                              : 'bg-opacity-15 dark:bg-opacity-15'
                            : 'bg-gray-100 dark:bg-terminal-alt text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                        } ${typeFilter === t && t !== 'all' ? TYPE_COLORS[t] : ''}`}
                      >
                        {t === 'all' ? 'ALL' : TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Topics - Secondary and Compact */}
              {allTopics.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-xs font-terminal text-gray-500 dark:text-gray-600 w-12 shrink-0 pt-1">TOPICS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {allTopics.map(topic => {
                      const active = topicFilter?.toLowerCase() === topic.toLowerCase()
                      return (
                        <button
                          key={topic}
                          onClick={() => setTopicFilter(active ? null : topic)}
                          className={`px-2 py-0.5 text-xs font-terminal transition-all border ${
                            active
                              ? 'bg-matrix/20 text-matrix border-matrix'
                              : 'bg-gray-100 dark:bg-terminal-alt text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                          }`}
                        >
                          {topic}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Meetings List */}
        <section className={`mb-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-blue-600 dark:text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-600 dark:text-gray-400 font-terminal">
              ls -la ./meetings/ {filter !== 'all' && `--filter=${filter}`}
              {typeFilter !== 'all' && ` --type=${typeFilter}`}
              {searchQuery && ` | grep "${searchQuery}"`}
            </span>
          </div>

          {loading && meetings.length === 0 ? (
            /* Skeleton loading state - prevents flash of "no results" */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-hack p-5">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-shrink-0 w-16">
                      <div className="h-8 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      <div className="h-3 w-10 bg-gray-200 dark:bg-gray-800 rounded mt-1.5 animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      </div>
                      <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      <div className="flex gap-4 pt-1">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">no_results</span>
              </div>
              <div className="terminal-body text-center py-8">
                <p className="text-gray-600 dark:text-gray-500 mb-2">
                  <span className="text-yellow-600 dark:text-hack-yellow">[INFO]</span> No meetings found matching your criteria.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 dark:text-matrix hover:text-blue-700 dark:hover:neon-text-subtle transition-all text-sm"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  onClick={() => openMeeting(meeting.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openMeeting(meeting.slug)
                    }
                  }}
                  className={`card-hack p-5 group transition-all cursor-pointer ${isPast(meeting.date) ? 'opacity-70' : ''
                    } ${selectedSlug === meeting.slug ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-matrix dark:ring-offset-terminal-bg' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className={`text-2xl font-bold font-terminal ${isPast(meeting.date) ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-matrix'}`}>
                        {parseLocalDate(meeting.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 uppercase">
                        {parseLocalDate(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-600">
                        {parseLocalDate(meeting.date).getFullYear()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                          {TYPE_LABELS[meeting.type]}
                        </span>
                        {isPast(meeting.date) && (
                          <span className="inline-block px-2 py-0.5 text-xs font-terminal border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-500">
                            COMPLETED
                          </span>
                        )}
                      </div>

                      <h3 className={`text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:neon-text-subtle transition-all ${isPast(meeting.date) ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-matrix'
                        }`}>
                        {meeting.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-500 text-sm mb-3">
                        {meeting.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-500 dark:text-matrix/50" />
                          {meeting.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-blue-500 dark:text-matrix/50" />
                          {meeting.location}
                        </div>
                      </div>

                      {meeting.topics && meeting.topics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {meeting.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-terminal-alt border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Stats Section */}
        <section className={`mb-16 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">meeting_stats</span>
            </div>
            <div className="terminal-body">
              {loading && meetings.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {[1,2,3,4].map(i => (
                    <div key={i}>
                      <div className="h-8 w-12 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      <div className="h-3 w-16 mx-auto bg-gray-200 dark:bg-gray-800 rounded mt-2 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-matrix neon-text-subtle">
                      {meetings.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 uppercase">Total Meetings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-600 dark:text-hack-cyan">
                      {meetings.filter(m => parseLocalDate(m.date) >= today).length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 uppercase">Upcoming</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-hack-yellow">
                      {meetings.filter(m => m.type === 'workshop').length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 uppercase">Workshops</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-hack-red">
                      {meetings.filter(m => m.type === 'ctf').length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 uppercase">CTF Events</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Meeting Detail Sheet / Right Slide Panel (driven by ?meeting= in URL) */}
      {selectedSlug &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end md:items-stretch justify-end"
            aria-modal="true"
            role="dialog"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
              onClick={closeMeeting}
            />

            {/* Panel / Sheet — opens with slide animation, closes instantly */}
            <div
              className={`relative flex flex-col w-full md:w-[640px] lg:w-[760px] bg-white dark:bg-terminal-bg border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden ${
                isMobile
                  ? 'rounded-t-2xl max-h-[92vh] sheet-slide-up'
                  : 'h-full sheet-slide-right'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Header Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-terminal-alt flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-terminal text-gray-500 dark:text-gray-400">MEETING</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-matrix/20 text-blue-700 dark:text-matrix font-terminal">DETAIL</span>
                </div>
                <button
                  onClick={closeMeeting}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="Close meeting details"
                >
                  <Close className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile drag handle (visual only, placed right under header) */}
              {isMobile && (
                <div className="flex h-3 items-center justify-center md:hidden bg-gray-50 dark:bg-terminal-alt">
                  <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>
              )}

              {/* Scrollable Content Area — the sheet owns the scroll on mobile.
                  MeetingDetails (embedded) renders plain flowing content inside this. */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <MeetingDetails
                  slug={selectedSlug}
                  embedded
                  onClose={closeMeeting}
                  onSelectMeeting={(newSlug) => {
                    const params = new URLSearchParams(searchParams)
                    params.set('meeting', newSlug)
                    setSearchParams(params, { replace: true })
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default Meetings
