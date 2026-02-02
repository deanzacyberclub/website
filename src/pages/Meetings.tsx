import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Meeting, MeetingType } from '@/types/database.types'
import { Spinner, Close, Plus, Calendar, Clock, MapPin, Star } from '@/lib/cyberIcon'

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
  const { userProfile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [loaded, setLoaded] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateMeetingForm>(defaultCreateForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const isOfficer = userProfile?.is_officer ?? false

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error
        setMeetings(data || [])
      } catch (err) {
        console.error('Error fetching meetings:', err)
        // TODO: SHOW ERROR TO USER
      } finally {
        setLoading(false)
        setLoaded(true)
      }
    }

    fetchMeetings()
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const featuredMeetings = useMemo(() => {
    return meetings.filter(m => m.featured && parseLocalDate(m.date) >= today)
  }, [meetings])

  const filteredMeetings = useMemo(() => {
    let filtered = meetings.filter(m => !m.featured || parseLocalDate(m.date) < today)

    // Apply time filter
    if (filter === 'upcoming') {
      filtered = filtered.filter(m => parseLocalDate(m.date) >= today)
    } else if (filter === 'past') {
      filtered = filtered.filter(m => parseLocalDate(m.date) < today)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query) ||
        m.topics?.some(t => t.toLowerCase().includes(query))
      )
    }

    // Sort by date (upcoming first for 'all' and 'upcoming', past first for 'past')
    filtered.sort((a, b) => {
      const dateA = parseLocalDate(a.date).getTime()
      const dateB = parseLocalDate(b.date).getTime()
      if (filter === 'past') {
        return dateB - dateA // Most recent past first
      }
      return dateA - dateB // Soonest upcoming first
    })

    return filtered
  }, [meetings, filter, typeFilter, searchQuery])

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

      const { data, error } = await supabase
        .from('meetings')
        .insert({
          slug,
          title: createForm.title.trim(),
          description: createForm.description.trim() || 'No description provided.',
          date: createForm.date,
          time: createForm.time.trim(),
          location: createForm.location.trim() || 'TBD',
          type: createForm.type,
          featured: createForm.featured,
          topics: topicsArray,
          secret_code: createForm.secret_code.trim() || null,
          announcements: [],
          photos: [],
          resources: []
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state and navigate to the new meeting
      setMeetings([data, ...meetings])
      setShowCreateModal(false)
      setCreateForm(defaultCreateForm)
      navigate(`/meetings/${data.slug}`)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center">
            <Spinner className="animate-spin h-6 w-6 text-matrix" />
            <span className="font-terminal text-lg">Loading meetings...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="terminal-window w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="terminal-header sticky top-0 z-10 bg-terminal-header">
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
            <div className="terminal-body space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-matrix">Create New Meeting</h2>
              </div>

              {createError && (
                <div className="p-3 rounded-lg bg-hack-red/10 border border-hack-red/50 text-hack-red text-sm">
                  {createError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 font-terminal mb-1">TITLE *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => handleCreateFormChange('title', e.target.value)}
                    className="input-hack w-full rounded-lg"
                    placeholder="Introduction to Ethical Hacking"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs text-gray-500 font-terminal mb-1">URL SLUG</label>
                  <input
                    type="text"
                    value={createForm.slug}
                    onChange={(e) => handleCreateFormChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="input-hack w-full rounded-lg"
                    placeholder="auto-generated-from-title"
                  />
                  <p className="text-xs text-gray-600 mt-1">/meetings/{createForm.slug || generateSlugFromTitle(createForm.title) || 'slug'}</p>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs text-gray-500 font-terminal mb-1">TYPE</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => handleCreateFormChange('type', e.target.value)}
                    className="input-hack w-full rounded-lg"
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
                  <label className="block text-xs text-gray-500 font-terminal mb-1">DATE *</label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => handleCreateFormChange('date', e.target.value)}
                    className="input-hack w-full rounded-lg"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs text-gray-500 font-terminal mb-1">TIME *</label>
                  <input
                    type="text"
                    value={createForm.time}
                    onChange={(e) => handleCreateFormChange('time', e.target.value)}
                    className="input-hack w-full rounded-lg"
                    placeholder="4:00 PM - 6:00 PM"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 font-terminal mb-1">LOCATION</label>
                  <input
                    type="text"
                    value={createForm.location}
                    onChange={(e) => handleCreateFormChange('location', e.target.value)}
                    className="input-hack w-full rounded-lg"
                    placeholder="S43 Room 120"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 font-terminal mb-1">DESCRIPTION</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => handleCreateFormChange('description', e.target.value)}
                    className="input-hack w-full rounded-lg min-h-[80px] resize-y"
                    placeholder="Describe the meeting..."
                  />
                </div>

                {/* Topics */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 font-terminal mb-1">TOPICS (comma-separated)</label>
                  <input
                    type="text"
                    value={createForm.topics}
                    onChange={(e) => handleCreateFormChange('topics', e.target.value)}
                    className="input-hack w-full rounded-lg"
                    placeholder="Security, Hacking, CTF"
                  />
                </div>

                {/* Secret Code */}
                <div>
                  <label className="block text-xs text-gray-500 font-terminal mb-1">ATTENDANCE CODE</label>
                  <input
                    type="text"
                    value={createForm.secret_code}
                    onChange={(e) => handleCreateFormChange('secret_code', e.target.value.toUpperCase())}
                    className="input-hack w-full rounded-lg font-mono"
                    placeholder="SECRETCODE"
                  />
                </div>

                {/* Featured */}
                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => handleCreateFormChange('featured', !createForm.featured)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${createForm.featured ? 'bg-matrix' : 'bg-gray-600'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${createForm.featured ? 'left-7' : 'left-1'}`} />
                  </button>
                  <label className="text-sm text-gray-400">Featured meeting</label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateForm(defaultCreateForm)
                    setCreateError('')
                  }}
                  disabled={creating}
                  className="px-4 py-2 text-sm font-terminal text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  onClick={createMeeting}
                  disabled={creating}
                  className="px-4 py-2 text-sm font-terminal bg-matrix/20 text-matrix border border-matrix rounded-lg hover:bg-matrix/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {creating && <Spinner className="animate-spin h-4 w-4" />}
                  {creating ? 'CREATING...' : 'CREATE MEETING'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <header className={`mb-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle">$</span>
            <span className="text-gray-400 font-terminal">cat /var/log/meetings.log</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-matrix neon-text mb-2">
                Club Meetings
              </h1>
              <p className="text-gray-500">
                Explore our upcoming events and past sessions
              </p>
            </div>
            {isOfficer && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-hack-filled px-4 py-2 flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-5 h-5" />
                New Meeting
              </button>
            )}
          </div>
        </header>

        {/* Featured Section */}
        {featuredMeetings.length > 0 && (
          <section className={`mb-12 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-400 font-terminal">./highlight --featured</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredMeetings.map((meeting) => (
                <Link
                  to={`/meetings/${meeting.slug}`}
                  key={meeting.id}
                  className="relative overflow-hidden rounded-xl border-2 border-matrix bg-gradient-to-br from-matrix/10 via-terminal-bg to-matrix/5 p-6 group hover:shadow-neon transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-terminal bg-matrix/20 text-matrix border border-matrix/50">
                      <Star className="w-3 h-3" />
                      FEATURED
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                      {TYPE_LABELS[meeting.type]}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-matrix mb-2 group-hover:neon-text-subtle transition-all">
                    {meeting.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {meeting.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4 text-matrix/70" />
                      {formatDate(meeting.date)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4 text-matrix/70" />
                      {meeting.time}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-4 h-4 text-matrix/70" />
                      {meeting.location}
                    </div>
                  </div>

                  {meeting.topics && meeting.topics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {meeting.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 rounded text-xs bg-terminal-alt border border-gray-700 text-gray-400"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search and Filter Section */}
        <section className={`mb-8 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">search_meetings</span>
            </div>
            <div className="terminal-body">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search meetings, topics, locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-hack w-full rounded-lg pl-10"
                    />
                  </div>

                  {/* Time Filter Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${filter === 'all'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                        }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setFilter('upcoming')}
                      className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${filter === 'upcoming'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                        }`}
                    >
                      UPCOMING
                    </button>
                    <button
                      onClick={() => setFilter('past')}
                      className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${filter === 'past'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                        }`}
                    >
                      PAST
                    </button>
                  </div>
                </div>

                {/* Type Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 font-terminal self-center mr-2">TYPE:</span>
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'all'
                      ? 'bg-matrix/20 text-matrix border border-matrix'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                      }`}
                  >
                    ALL TYPES
                  </button>
                  <button
                    onClick={() => setTypeFilter('workshop')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'workshop'
                      ? 'bg-hack-cyan/20 text-hack-cyan border border-hack-cyan'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-cyan/50'
                      }`}
                  >
                    WORKSHOP
                  </button>
                  <button
                    onClick={() => setTypeFilter('lecture')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'lecture'
                      ? 'bg-hack-yellow/20 text-hack-yellow border border-hack-yellow'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-yellow/50'
                      }`}
                  >
                    LECTURE
                  </button>
                  <button
                    onClick={() => setTypeFilter('ctf')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'ctf'
                      ? 'bg-hack-red/20 text-hack-red border border-hack-red'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-red/50'
                      }`}
                  >
                    CTF
                  </button>
                  <button
                    onClick={() => setTypeFilter('social')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'social'
                      ? 'bg-purple-400/20 text-purple-400 border border-purple-400'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-purple-400/50'
                      }`}
                  >
                    SOCIAL
                  </button>
                  <button
                    onClick={() => setTypeFilter('general')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'general'
                      ? 'bg-matrix/20 text-matrix border border-matrix'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                      }`}
                  >
                    GENERAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meetings List */}
        <section className={`mb-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">
              ls -la ./meetings/ {filter !== 'all' && `--filter=${filter}`}
              {typeFilter !== 'all' && ` --type=${typeFilter}`}
              {searchQuery && ` | grep "${searchQuery}"`}
            </span>
          </div>

          {filteredMeetings.length === 0 ? (
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">no_results</span>
              </div>
              <div className="terminal-body text-center py-8">
                <p className="text-gray-500 mb-2">
                  <span className="text-hack-yellow">[INFO]</span> No meetings found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilter('all')
                    setTypeFilter('all')
                  }}
                  className="text-matrix hover:neon-text-subtle transition-all text-sm"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => (
                <Link
                  to={`/meetings/${meeting.slug}`}
                  key={meeting.id}
                  className={`card-hack p-5 rounded-lg group transition-all block ${isPast(meeting.date) ? 'opacity-70' : ''
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className={`text-2xl font-bold font-terminal ${isPast(meeting.date) ? 'text-gray-500' : 'text-matrix'}`}>
                        {parseLocalDate(meeting.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {parseLocalDate(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xs text-gray-600">
                        {parseLocalDate(meeting.date).getFullYear()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                          {TYPE_LABELS[meeting.type]}
                        </span>
                        {isPast(meeting.date) && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-terminal border border-gray-600 text-gray-500">
                            COMPLETED
                          </span>
                        )}
                      </div>

                      <h3 className={`text-lg font-semibold mb-2 group-hover:neon-text-subtle transition-all ${isPast(meeting.date) ? 'text-gray-400' : 'text-matrix'
                        }`}>
                        {meeting.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        {meeting.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-matrix/50" />
                          {meeting.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-matrix/50" />
                          {meeting.location}
                        </div>
                      </div>

                      {meeting.topics && meeting.topics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {meeting.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded text-xs bg-terminal-alt border border-gray-700 text-gray-400"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-matrix neon-text-subtle">
                    {meetings.length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Total Meetings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-cyan">
                    {meetings.filter(m => parseLocalDate(m.date) >= today).length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Upcoming</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-yellow">
                    {meetings.filter(m => m.type === 'workshop').length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Workshops</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-red">
                    {meetings.filter(m => m.type === 'ctf').length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">CTF Events</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

export default Meetings
