import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Footer from './components/Footer'
import { MEETINGS_DATA, TYPE_COLORS, TYPE_LABELS } from './Meetings'

type TabType = 'announcements' | 'photos' | 'resources'

function MeetingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('announcements')
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    setLoaded(true)
  }, [])

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

  const meeting = MEETINGS_DATA.find(m => m.id === id)

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

  // Find related meetings (same type, excluding current)
  const relatedMeetings = MEETINGS_DATA
    .filter(m => m.id !== id && m.type === meeting?.type)
    .slice(0, 3)

  if (!meeting) {
    return (
      <div className="bg-terminal-bg text-matrix min-h-screen">
        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
          <header className="mb-12">
            <Link
              to="/meetings"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-matrix transition-colors mb-8"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Meetings
            </Link>

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
      <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/meetings"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-matrix transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Meetings
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle">$</span>
            <span className="text-gray-400 font-terminal">cat ./meetings/{meeting.id}/README.md</span>
          </div>
        </header>

        {/* Main Content */}
        <article className={`mb-12 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">{meeting.title.toLowerCase().replace(/\s+/g, '_')}</span>
            </div>
            <div className="terminal-body">
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
            </div>
          </div>
        </article>

        {/* Tabbed Content Section */}
        {(meeting.announcements?.length || meeting.photos?.length || meeting.resources?.length) && (
          <section className={`mb-12 transition-all duration-700 delay-150 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-400 font-terminal">ls ./meetings/{meeting.id}/</span>
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
                  to={`/meetings/${related.id}`}
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

        {/* Footer */}
        <Footer className={`transition-all duration-700 delay-300 border-matrix/20 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-600 font-terminal">
              <span className="text-matrix neon-text-subtle">$</span> cat ./meetings/{meeting.id}.md
            </p>
            <div className="text-xs text-gray-700 font-terminal">
              <span className="text-matrix/50">[</span>
              EVENT DETAILS
              <span className="text-matrix/50">]</span>
            </div>
          </div>
        </Footer>
      </div>
    </div>
  )
}

export default MeetingDetails
