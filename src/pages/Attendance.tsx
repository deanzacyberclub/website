import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Footer from '@/components/Footer'
import { MEETINGS_DATA, TYPE_COLORS, TYPE_LABELS } from './Meetings'

interface AttendanceForm {
  meetingId: string
  secretCode: string
}

function Attendance() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const navigate = useNavigate()
  const { user, userProfile, loading } = useAuth()

  const [form, setForm] = useState<AttendanceForm>({
    meetingId: '',
    secretCode: ''
  })

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!form.meetingId) {
      setError('[ERROR] Please select a meeting')
      return
    }

    if (!form.secretCode.trim()) {
      setError('[ERROR] Secret code is required')
      return
    }

    if (!userProfile?.student_id) {
      setError('[ERROR] Student ID not found. Please update your profile.')
      return
    }

    setSubmitting(true)

    try {
      // TODO: Implement Supabase attendance tracking
      // const selectedMeeting = MEETINGS_DATA.find(m => m.id === form.meetingId)
      // await supabase.from('attendance').insert({
      //   meeting_id: form.meetingId,
      //   meeting_title: selectedMeeting?.title || 'Unknown',
      //   meeting_date: selectedMeeting?.date || 'Unknown',
      //   secret_code: form.secretCode,
      //   student_id: userProfile.student_id,
      //   user_id: user?.id || null
      // })

      setSubmitted(true)
      setForm({ meetingId: '', secretCode: '' })
    } catch (err) {
      setError('[ERROR] Transmission failed. Retry.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedMeeting = MEETINGS_DATA.find(m => m.id === form.meetingId)

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="flex items-center gap-3 justify-center">
            <svg className="animate-spin h-6 w-6 text-matrix" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-terminal text-lg neon-pulse">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center p-6">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center mx-auto mb-6 neon-box">
            <svg className="w-10 h-10 text-matrix" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="terminal-window max-w-md mx-auto">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">success</span>
            </div>
            <div className="terminal-body text-left">
              <p className="text-matrix mb-2">
                <span className="text-hack-cyan">[SUCCESS]</span> Attendance recorded
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Your attendance has been verified and logged in the system.
              </p>
              <div className="text-xs text-gray-600 mb-4">
                <span className="text-matrix">STATUS:</span> CONFIRMED |
                <span className="text-matrix ml-2">ID:</span> {userProfile.student_id}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button
              onClick={() => setSubmitted(false)}
              className="btn-hack rounded-lg inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              CHECK IN AGAIN
            </button>
            <Link
              to="/dashboard"
              className="btn-hack-filled rounded-lg inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              BACK TO DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-matrix transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-terminal text-sm">cd ../dashboard</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">./attendance --check-in</span>
          </div>

          <h1 className="text-3xl font-bold neon-text tracking-tight mb-2">ATTENDANCE CHECK-IN</h1>
          <p className="text-gray-500">
            <span className="text-hack-cyan">[INFO]</span> Verify your attendance at club meetings
          </p>
        </header>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`space-y-6 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          {/* User Identity Section - Now at the top */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">user_session.sh</span>
              <span className="ml-auto text-xs text-hack-cyan font-terminal">AUTHENTICATED</span>
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
                    <svg className="w-7 h-7 text-matrix/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-matrix font-semibold text-lg truncate">
                    {userProfile.display_name}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 font-terminal">
                      <span className="text-matrix">ID:</span> {userProfile.student_id}
                    </span>
                    <span className="text-gray-600 truncate">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Selection */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">select_meeting.sh</span>
            </div>
            <div className="terminal-body">
              <label className="block text-sm mb-2 text-gray-500 font-terminal">--meeting</label>
              <select
                name="meetingId"
                value={form.meetingId}
                onChange={handleChange}
                required
                className="input-hack w-full rounded-lg cursor-pointer"
              >
                <option value="">Select a meeting...</option>
                {MEETINGS_DATA.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.title} ({new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                  </option>
                ))}
              </select>

              {/* Selected Meeting Preview */}
              {selectedMeeting && (
                <div className="mt-4 p-4 rounded-lg border border-matrix/30 bg-matrix/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[selectedMeeting.type]}`}>
                      {TYPE_LABELS[selectedMeeting.type]}
                    </span>
                  </div>
                  <h3 className="text-matrix font-semibold mb-1">{selectedMeeting.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-matrix/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(selectedMeeting.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-matrix/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {selectedMeeting.location}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secret Code */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">verify_code.sh</span>
            </div>
            <div className="terminal-body">
              <label className="block text-sm mb-2 text-gray-500 font-terminal">--secret-code</label>
              <input
                type="text"
                name="secretCode"
                value={form.secretCode}
                onChange={handleChange}
                required
                className="input-hack w-full rounded-lg"
                placeholder="Enter code from meeting"
                autoComplete="off"
              />
              <p className="text-xs mt-2 text-gray-600 font-terminal">
                <span className="text-matrix">&gt;</span> Enter the secret code provided during the meeting
              </p>
            </div>
          </div>

          {error && (
            <div className="text-hack-red text-sm font-terminal">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-hack-filled rounded-lg w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                VERIFYING...
              </span>
            ) : (
              'CHECK IN'
            )}
          </button>
        </form>

        <Footer />
      </div>
    </div>
  )
}

export default Attendance
