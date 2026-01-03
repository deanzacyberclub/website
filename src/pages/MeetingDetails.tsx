import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { TYPE_COLORS, TYPE_LABELS } from './Meetings'
import { useAuth } from '@/contexts/AuthContext'
import type { Meeting, MeetingType, Announcement, Photo, Resource } from '@/types/database.types'

type TabType = 'announcements' | 'photos' | 'resources'

interface EditForm {
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
  announcements: Announcement[]
  photos: Photo[]
  resources: Resource[]
}

function MeetingDetails() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('announcements')
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [relatedMeetings, setRelatedMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [codeRevealed, setCodeRevealed] = useState(false)
  const [codeFullscreen, setCodeFullscreen] = useState(false)
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const isOfficer = userProfile?.is_officer ?? false

  useEffect(() => {
    async function fetchMeeting() {
      if (!slug) return

      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('slug', slug)
          .single()

        if (error) throw error
        setMeeting(data)

        // Fetch related meetings of the same type
        if (data) {
          const { data: related } = await supabase
            .from('meetings')
            .select('*')
            .eq('type', data.type)
            .neq('slug', slug)
            .limit(3)

          setRelatedMeetings(related || [])
        }
      } catch (err) {
        console.error('Error fetching meeting:', err)
        setMeeting(null)
      } finally {
        setLoading(false)
        setLoaded(true)
      }
    }

    fetchMeeting()
  }, [slug])

  // ESC key to close fullscreen code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && codeFullscreen) {
        setCodeFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [codeFullscreen])

  const tabs: TabType[] = ['announcements', 'photos', 'resources']

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      const currentIndex = tabs.indexOf(activeTab)
      if (diff > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1])
      } else if (diff < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1])
      }
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < today
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const startEditing = () => {
    if (!meeting) return
    setEditForm({
      slug: meeting.slug,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location,
      type: meeting.type,
      featured: meeting.featured,
      topics: meeting.topics?.join(', ') || '',
      secret_code: meeting.secret_code || '',
      announcements: meeting.announcements ? [...meeting.announcements] : [],
      photos: meeting.photos ? [...meeting.photos] : [],
      resources: meeting.resources ? [...meeting.resources] : []
    })
    setEditError('')
    setIsEditing(true)
  }

  const generateId = () => crypto.randomUUID()

  // Announcement handlers
  const addAnnouncement = () => {
    if (!editForm) return
    const newAnnouncement: Announcement = {
      id: generateId(),
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0]
    }
    setEditForm({ ...editForm, announcements: [...editForm.announcements, newAnnouncement] })
  }

  const updateAnnouncement = (id: string, field: keyof Announcement, value: string) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      announcements: editForm.announcements.map(a =>
        a.id === id ? { ...a, [field]: value } : a
      )
    })
  }

  const deleteAnnouncement = (id: string) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      announcements: editForm.announcements.filter(a => a.id !== id)
    })
  }

  // Photo handlers
  const addPhoto = () => {
    if (!editForm) return
    const newPhoto: Photo = {
      id: generateId(),
      url: '',
      caption: ''
    }
    setEditForm({ ...editForm, photos: [...editForm.photos, newPhoto] })
  }

  const updatePhoto = (id: string, field: keyof Photo, value: string) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      photos: editForm.photos.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    })
  }

  const deletePhoto = (id: string) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      photos: editForm.photos.filter(p => p.id !== id)
    })
  }

  // Resource handlers
  const addResource = () => {
    if (!editForm) return
    const newResource: Resource = {
      id: generateId(),
      title: '',
      url: '',
      type: 'link'
    }
    setEditForm({ ...editForm, resources: [...editForm.resources, newResource] })
  }

  const updateResource = (id: string, field: keyof Resource, value: string) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      resources: editForm.resources.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      )
    })
  }

  const deleteResource = (id: string) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      resources: editForm.resources.filter(r => r.id !== id)
    })
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm(null)
    setEditError('')
  }

  const handleEditChange = (field: keyof EditForm, value: string | boolean) => {
    if (!editForm) return
    setEditForm({ ...editForm, [field]: value })
  }

  const saveChanges = async () => {
    if (!meeting || !editForm) return

    // Validate slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(editForm.slug)) {
      setEditError('Slug must be lowercase letters, numbers, and hyphens only (e.g., "my-meeting")')
      return
    }

    setSaving(true)
    setEditError('')

    try {
      const topicsArray = editForm.topics
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      // Filter out empty announcements, photos, and resources
      const validAnnouncements = editForm.announcements.filter(a => a.title.trim() && a.content.trim())
      const validPhotos = editForm.photos.filter(p => p.url.trim())
      const validResources = editForm.resources.filter(r => r.title.trim() && r.url.trim())

      const { data, error } = await supabase
        .from('meetings')
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
          announcements: validAnnouncements,
          photos: validPhotos,
          resources: validResources,
          updated_at: new Date().toISOString()
        })
        .eq('id', meeting.id)
        .select()
        .single()

      if (error) throw error

      setMeeting(data)
      setIsEditing(false)
      setEditForm(null)

      // If slug changed, navigate to new URL
      if (editForm.slug !== slug) {
        navigate(`/meetings/${editForm.slug}`, { replace: true })
      }
    } catch (err) {
      console.error('Error saving meeting:', err)
      if (err instanceof Error && err.message.includes('duplicate')) {
        setEditError('This slug is already in use. Please choose a different one.')
      } else {
        setEditError('Failed to save changes. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center">
            <svg className="animate-spin h-6 w-6 text-matrix" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-terminal text-lg">Loading meeting...</span>
          </div>
        </div>
      </div>
    )
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
                <span className="ml-4 text-xs text-gray-500 font-terminal">error</span>
              </div>
              <div className="terminal-body text-center py-12">
                <div className="text-4xl mb-4 text-hack-red">404</div>
                <p className="text-gray-500 mb-2">
                  <span className="text-hack-red">[ERROR]</span> Meeting not found
                </p>
                <p className="text-gray-600 text-sm mb-6">
                  The meeting you're looking for doesn't exist or has been removed.
                </p>
                <button
                  onClick={() => navigate('/meetings')}
                  className="btn-hack px-6 py-2"
                >
                  Browse All Meetings
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
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
              e.stopPropagation()
              setCodeFullscreen(false)
            }}
            className="absolute top-6 right-6 p-3 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle">$</span>
            <span className="text-gray-400 font-terminal">cat ./meetings/{slug}/README.md</span>
          </div>
        </header>

        {/* Main Content */}
        <article className={`mb-12 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                {isEditing ? 'edit_meeting.sh' : meeting.title.toLowerCase().replace(/\s+/g, '_')}
              </span>
              {isOfficer && !isEditing && (
                <button
                  onClick={startEditing}
                  className="ml-auto text-xs text-hack-cyan hover:text-hack-cyan/80 font-terminal flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  EDIT
                </button>
              )}
            </div>
            <div className="terminal-body">
              {isEditing && editForm ? (
                /* Edit Mode */
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-matrix">Edit Meeting</h2>
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
                        {saving && (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {saving ? 'SAVING...' : 'SAVE'}
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
                      <label className="block text-xs text-gray-500 font-terminal mb-1">URL SLUG</label>
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => handleEditChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="input-hack w-full rounded-lg"
                        placeholder="my-meeting"
                      />
                      <p className="text-xs text-gray-600 mt-1">/meetings/{editForm.slug}</p>
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">TYPE</label>
                      <select
                        value={editForm.type}
                        onChange={(e) => handleEditChange('type', e.target.value)}
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
                    <label className="block text-xs text-gray-500 font-terminal mb-1">TITLE</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => handleEditChange('title', e.target.value)}
                      className="input-hack w-full rounded-lg"
                      placeholder="Meeting title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-gray-500 font-terminal mb-1">DESCRIPTION</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      className="input-hack w-full rounded-lg min-h-[100px] resize-y"
                      placeholder="Meeting description"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Date */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">DATE</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => handleEditChange('date', e.target.value)}
                        className="input-hack w-full rounded-lg"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">TIME</label>
                      <input
                        type="text"
                        value={editForm.time}
                        onChange={(e) => handleEditChange('time', e.target.value)}
                        className="input-hack w-full rounded-lg"
                        placeholder="4:00 PM - 6:00 PM"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs text-gray-500 font-terminal mb-1">LOCATION</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => handleEditChange('location', e.target.value)}
                      className="input-hack w-full rounded-lg"
                      placeholder="S43 Room 120"
                    />
                  </div>

                  {/* Topics */}
                  <div>
                    <label className="block text-xs text-gray-500 font-terminal mb-1">TOPICS (comma-separated)</label>
                    <input
                      type="text"
                      value={editForm.topics}
                      onChange={(e) => handleEditChange('topics', e.target.value)}
                      className="input-hack w-full rounded-lg"
                      placeholder="Security, Hacking, CTF"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Secret Code */}
                    <div>
                      <label className="block text-xs text-gray-500 font-terminal mb-1">ATTENDANCE CODE</label>
                      <input
                        type="text"
                        value={editForm.secret_code}
                        onChange={(e) => handleEditChange('secret_code', e.target.value.toUpperCase())}
                        className="input-hack w-full rounded-lg font-mono"
                        placeholder="SECRETCODE"
                      />
                      <p className="text-xs text-gray-600 mt-1">Code for attendance check-in</p>
                    </div>

                    {/* Featured */}
                    <div className="flex items-center gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => handleEditChange('featured', !editForm.featured)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${editForm.featured ? 'bg-matrix' : 'bg-gray-600'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${editForm.featured ? 'left-7' : 'left-1'}`} />
                      </button>
                      <label className="text-sm text-gray-400">Featured meeting</label>
                    </div>
                  </div>

                  {/* Announcements Editor */}
                  <div className="border-t border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-matrix">Announcements</h3>
                      <button
                        type="button"
                        onClick={addAnnouncement}
                        className="text-xs font-terminal text-hack-cyan hover:text-hack-cyan/80 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        ADD
                      </button>
                    </div>
                    {editForm.announcements.length === 0 ? (
                      <p className="text-gray-500 text-sm">No announcements yet</p>
                    ) : (
                      <div className="space-y-4">
                        {editForm.announcements.map((announcement) => (
                          <div key={announcement.id} className="p-4 rounded-lg bg-terminal-alt border border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                              <input
                                type="text"
                                value={announcement.title}
                                onChange={(e) => updateAnnouncement(announcement.id, 'title', e.target.value)}
                                className="input-hack flex-1 rounded-lg text-sm"
                                placeholder="Announcement title"
                              />
                              <button
                                type="button"
                                onClick={() => deleteAnnouncement(announcement.id)}
                                className="ml-2 p-1 text-gray-500 hover:text-hack-red transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <textarea
                              value={announcement.content}
                              onChange={(e) => updateAnnouncement(announcement.id, 'content', e.target.value)}
                              className="input-hack w-full rounded-lg text-sm min-h-[60px] resize-y mb-2"
                              placeholder="Announcement content"
                            />
                            <input
                              type="date"
                              value={announcement.date}
                              onChange={(e) => updateAnnouncement(announcement.id, 'date', e.target.value)}
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
                      <h3 className="text-lg font-semibold text-hack-cyan">Photos</h3>
                      <button
                        type="button"
                        onClick={addPhoto}
                        className="text-xs font-terminal text-hack-cyan hover:text-hack-cyan/80 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        ADD
                      </button>
                    </div>
                    {editForm.photos.length === 0 ? (
                      <p className="text-gray-500 text-sm">No photos yet</p>
                    ) : (
                      <div className="space-y-4">
                        {editForm.photos.map((photo) => (
                          <div key={photo.id} className="p-4 rounded-lg bg-terminal-alt border border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                              <input
                                type="url"
                                value={photo.url}
                                onChange={(e) => updatePhoto(photo.id, 'url', e.target.value)}
                                className="input-hack flex-1 rounded-lg text-sm"
                                placeholder="https://example.com/image.jpg"
                              />
                              <button
                                type="button"
                                onClick={() => deletePhoto(photo.id)}
                                className="ml-2 p-1 text-gray-500 hover:text-hack-red transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={photo.caption || ''}
                              onChange={(e) => updatePhoto(photo.id, 'caption', e.target.value)}
                              className="input-hack w-full rounded-lg text-sm"
                              placeholder="Caption (optional)"
                            />
                            {photo.url && (
                              <div className="mt-3">
                                <img
                                  src={photo.url}
                                  alt="Preview"
                                  className="max-h-32 rounded-lg border border-gray-700"
                                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
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
                      <h3 className="text-lg font-semibold text-hack-yellow">Resources</h3>
                      <button
                        type="button"
                        onClick={addResource}
                        className="text-xs font-terminal text-hack-yellow hover:text-hack-yellow/80 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        ADD
                      </button>
                    </div>
                    {editForm.resources.length === 0 ? (
                      <p className="text-gray-500 text-sm">No resources yet</p>
                    ) : (
                      <div className="space-y-4">
                        {editForm.resources.map((resource) => (
                          <div key={resource.id} className="p-4 rounded-lg bg-terminal-alt border border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                              <input
                                type="text"
                                value={resource.title}
                                onChange={(e) => updateResource(resource.id, 'title', e.target.value)}
                                className="input-hack flex-1 rounded-lg text-sm"
                                placeholder="Resource title"
                              />
                              <button
                                type="button"
                                onClick={() => deleteResource(resource.id)}
                                className="ml-2 p-1 text-gray-500 hover:text-hack-red transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                type="url"
                                value={resource.url}
                                onChange={(e) => updateResource(resource.id, 'url', e.target.value)}
                                className="input-hack w-full rounded-lg text-sm"
                                placeholder="https://example.com/resource"
                              />
                              <select
                                value={resource.type}
                                onChange={(e) => updateResource(resource.id, 'type', e.target.value)}
                                className="input-hack w-full rounded-lg text-sm"
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
              ) : (
                /* View Mode */
                <>
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                      {TYPE_LABELS[meeting.type]}
                    </span>
                    {meeting.featured && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-terminal bg-matrix/20 text-matrix border border-matrix/50">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
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
                  <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${isPast(meeting.date) ? 'text-gray-400' : 'text-matrix neon-text'}`}>
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
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-terminal mb-1">Date</div>
                        <div className={`font-semibold ${isPast(meeting.date) ? 'text-gray-400' : 'text-matrix'}`}>
                          {formatDate(meeting.date)}
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-terminal-alt border border-gray-800">
                      <div className="p-2 rounded-lg bg-matrix/10 text-matrix">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-terminal mb-1">Time</div>
                        <div className="text-white font-semibold">{meeting.time}</div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-terminal-alt border border-gray-800 md:col-span-2">
                      <div className="p-2 rounded-lg bg-matrix/10 text-matrix">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-terminal mb-1">Location</div>
                        <div className="text-white font-semibold">{meeting.location}</div>
                      </div>
                    </div>

                    {/* Secret Attendance Code - Officers Only */}
                    {isOfficer && meeting.secret_code && (
                      <div className="relative flex items-start gap-4 p-4 rounded-lg bg-hack-purple/10 border border-hack-purple/50 md:col-span-2">
                        <div className="p-2 rounded-lg bg-hack-purple/20 text-hack-purple">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-hack-purple uppercase font-terminal mb-1">Attendance Code</div>
                          <div
                            className={`text-2xl font-bold font-mono text-hack-purple tracking-widest transition-all ${!codeRevealed ? 'blur-sm select-none' : ''}`}
                          >
                            {codeRevealed ? meeting.secret_code : 'SAMPLECODE'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCodeRevealed(!codeRevealed)}
                            className="p-2 rounded-lg bg-hack-purple/20 text-hack-purple hover:bg-hack-purple/30 transition-colors"
                            title={codeRevealed ? 'Hide code' : 'Reveal code'}
                          >
                            {codeRevealed ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setCodeRevealed(true)
                              setCodeFullscreen(true)
                            }}
                            className="p-2 rounded-lg bg-hack-purple/20 text-hack-purple hover:bg-hack-purple/30 transition-colors"
                            title="Fullscreen"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Topics */}
                  {meeting.topics && meeting.topics.length > 0 && (
                    <div className="mb-8">
                      <div className="text-xs text-gray-500 uppercase font-terminal mb-3">Topics Covered</div>
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

                  {/* CTA */}
                  {!isPast(meeting.date) && (
                    <div className="pt-6 border-t border-gray-800">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a
                          href="https://discord.gg/P6JSY6DcFn"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-hack-filled px-6 py-3 text-center"
                        >
                          Join Our Discord for Updates
                        </a>
                        <Link
                          to="/meetings"
                          className="btn-hack px-6 py-3 text-center"
                        >
                          View All Meetings
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </article>

        {/* Tabbed Content Section */}
        {(meeting.announcements?.length || meeting.photos?.length || meeting.resources?.length) && (
          <section className={`mb-12 transition-all duration-700 delay-150 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-400 font-terminal">ls ./meetings/{slug}/</span>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'announcements'
                  ? 'bg-matrix/20 text-matrix border border-matrix'
                  : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                ANNOUNCEMENTS
                {meeting.announcements?.length ? (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-matrix/30">{meeting.announcements.length}</span>
                ) : null}
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'photos'
                  ? 'bg-hack-cyan/20 text-hack-cyan border border-hack-cyan'
                  : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-cyan/50'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                PHOTOS
                {meeting.photos?.length ? (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-hack-cyan/30">{meeting.photos.length}</span>
                ) : null}
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'resources'
                  ? 'bg-hack-yellow/20 text-hack-yellow border border-hack-yellow'
                  : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-yellow/50'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                RESOURCES
                {meeting.resources?.length ? (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-hack-yellow/30">{meeting.resources.length}</span>
                ) : null}
              </button>
            </div>

            {/* Swipe indicator */}
            <div className="flex justify-center gap-2 mb-4 md:hidden">
              {tabs.map((tab) => (
                <div
                  key={tab}
                  className={`w-2 h-2 rounded-full transition-all ${activeTab === tab ? 'bg-matrix w-4' : 'bg-gray-600'
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
                <span className="ml-4 text-xs text-gray-500 font-terminal">{activeTab}</span>
              </div>
              <div className="terminal-body min-h-[200px]">
                {/* Announcements Tab */}
                {activeTab === 'announcements' && (
                  <div className="space-y-4">
                    {meeting.announcements && meeting.announcements.length > 0 ? (
                      meeting.announcements.map((announcement) => (
                        <div key={announcement.id} className="p-4 rounded-lg bg-terminal-alt border border-gray-800">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-semibold text-matrix">{announcement.title}</h4>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">{announcement.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        <p className="text-gray-500 text-sm">No announcements yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Photos Tab */}
                {activeTab === 'photos' && (
                  <div>
                    {meeting.photos && meeting.photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {meeting.photos.map((photo) => (
                          <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-terminal-alt border border-gray-800">
                            <img
                              src={photo.url}
                              alt={photo.caption || 'Event photo'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23374151" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
                              }}
                            />
                            {photo.caption && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs">{photo.caption}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">No photos yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Resources Tab */}
                {activeTab === 'resources' && (
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
                            {resource.type === 'slides' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            )}
                            {resource.type === 'video' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {resource.type === 'link' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            )}
                            {resource.type === 'file' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-200 group-hover:text-hack-yellow transition-colors">{resource.title}</h4>
                            <p className="text-xs text-gray-500 uppercase">{resource.type}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-hack-yellow group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">No resources yet</p>
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
          <section className={`mb-16 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-400 font-terminal">ls ./meetings/ --type={meeting.type} | head -3</span>
            </div>

            <h2 className="text-xl font-bold text-matrix mb-4">Related {TYPE_LABELS[meeting.type]} Events</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedMeetings.map((related) => (
                <Link
                  key={related.id}
                  to={`/meetings/${related.slug}`}
                  className={`card-hack p-4 rounded-lg group transition-all ${isPast(related.date) ? 'opacity-70' : ''
                    }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[related.type]}`}>
                      {TYPE_LABELS[related.type]}
                    </span>
                    {isPast(related.date) && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-terminal border border-gray-600 text-gray-500">
                        PAST
                      </span>
                    )}
                  </div>
                  <h3 className={`font-semibold mb-2 group-hover:neon-text-subtle transition-all line-clamp-2 ${isPast(related.date) ? 'text-gray-400' : 'text-matrix'
                    }`}>
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
  )
}

export default MeetingDetails
