import { useState, useEffect, ChangeEvent, FormEvent, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { TYPE_COLORS, TYPE_LABELS } from './Meetings'
import type { Meeting } from '@/types/database.types'
import { Spinner, Check, Plus, ArrowLeft, User, Calendar } from '@/lib/cyberIcon'
import CustomSelect from '@/components/CustomSelect'

interface AttendanceForm {
  meetingId: string
  secretCode: string
  studentId: string
}

function Attendance() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const [attendanceCount, setAttendanceCount] = useState(0)

  const { user, userProfile, loading } = useAuth()
  const studentIdRefs = useRef<(HTMLInputElement | null)[]>([])
  const meetingSelectRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<AttendanceForm>({
    meetingId: '',
    secretCode: '',
    studentId: ''
  })

  // Helper function to parse meeting time and check if it's currently active
  const selectDefaultMeeting = (allMeetings: Meeting[]): Meeting | null => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 1. Check for currently active meetings (happening right now)
    const activeMeetings = allMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.date)
      const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate())

      // Only check meetings happening today
      if (meetingDateOnly.getTime() !== today.getTime()) return false

      // Parse time range (e.g., "4:00 PM - 6:00 PM")
      const timeMatch = meeting.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      if (!timeMatch) return false

      const [_, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch

      // Convert to 24-hour format
      let start24Hour = parseInt(startHour)
      if (startPeriod.toUpperCase() === 'PM' && start24Hour !== 12) start24Hour += 12
      if (startPeriod.toUpperCase() === 'AM' && start24Hour === 12) start24Hour = 0

      let end24Hour = parseInt(endHour)
      if (endPeriod.toUpperCase() === 'PM' && end24Hour !== 12) end24Hour += 12
      if (endPeriod.toUpperCase() === 'AM' && end24Hour === 12) end24Hour = 0

      const startTime = new Date(now)
      startTime.setHours(start24Hour, parseInt(startMin), 0, 0)

      const endTime = new Date(now)
      endTime.setHours(end24Hour, parseInt(endMin), 0, 0)

      // Check if current time is between start and end
      return now >= startTime && now <= endTime
    })

    if (activeMeetings.length > 0) {
      return activeMeetings[0] // Return the first active meeting
    }

    // 2. Check for meetings that happened earlier today
    const todayPastMeetings = allMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.date)
      const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate())
      return meetingDateOnly.getTime() === today.getTime()
    })

    if (todayPastMeetings.length > 0) {
      return todayPastMeetings[0] // Return the most recent meeting today
    }

    // 3. Check for next future meeting
    const futureMeetings = allMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.date)
      const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate())
      return meetingDateOnly.getTime() > today.getTime()
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (futureMeetings.length > 0) {
      return futureMeetings[0] // Return the next upcoming meeting
    }

    // 4. No meetings available
    return null
  }

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error
        setMeetings(data || [])

        // Auto-select the most appropriate meeting
        if (data && data.length > 0) {
          const selectedMeeting = selectDefaultMeeting(data)
          if (selectedMeeting) {
            setForm(prev => ({ ...prev, meetingId: selectedMeeting.id }))
          }
        }
      } catch (err) {
        console.error('Error fetching meetings:', err)
      } finally {
        setLoadingMeetings(false)
      }
    }

    fetchMeetings()
  }, [])

  // Pre-fill student ID if user is logged in and has a profile
  useEffect(() => {
    if (userProfile?.student_id) {
      setForm(prev => ({ ...prev, studentId: userProfile.student_id || '' }))
    }
  }, [userProfile])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Filter out non-numeric characters for student ID
    if (name === 'studentId') {
      const numericValue = value.replace(/\D/g, '').slice(0, 8)
      setForm({ ...form, [name]: numericValue })
    } else if (name === 'secretCode') {
      // Only allow alphanumeric characters and convert to uppercase
      const alphanumericValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      setForm({ ...form, [name]: alphanumericValue })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleMeetingChange = (value: string) => {
    setForm({ ...form, meetingId: value })
  }

  const handleMeetingDropdownClick = () => {
    // Scroll to position the dropdown so both the select and options are visible
    if (meetingSelectRef.current) {
      const element = meetingSelectRef.current
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      // Calculate target scroll position
      // Position the element near the top with some padding (80px for header space)
      const targetPosition = rect.top + scrollTop - 80

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
      })
    }
  }

  const handleStudentIdDigitChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const newId = form.studentId.split('')

    // Pad with empty strings if needed
    while (newId.length < 8) newId.push('')

    newId[index] = digit
    setForm({ ...form, studentId: newId.join('') })

    // Move to next input if digit entered
    if (digit && index < 7) {
      studentIdRefs.current[index + 1]?.focus()
    }
  }

  const handleStudentIdKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!form.studentId[index] && index > 0) {
        // If current box is empty, move to previous and clear it
        e.preventDefault()
        const newId = form.studentId.split('')
        while (newId.length < 8) newId.push('')
        newId[index - 1] = ''
        setForm({ ...form, studentId: newId.join('') })
        studentIdRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      studentIdRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 7) {
      e.preventDefault()
      studentIdRefs.current[index + 1]?.focus()
    }
  }

  const handleStudentIdPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (pastedData) {
      setForm({ ...form, studentId: pastedData })
      // Focus on the last filled input or the next empty one
      const focusIndex = Math.min(pastedData.length, 7)
      studentIdRefs.current[focusIndex]?.focus()
    }
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

    // Get student ID from profile or form input
    const studentIdToUse = userProfile?.student_id || form.studentId.trim()

    if (!studentIdToUse) {
      setError('[ERROR] Student ID is required')
      return
    }

    if (studentIdToUse.length !== 8 || !/^\d+$/.test(studentIdToUse)) {
      setError('[ERROR] Student ID must be 8 digits')
      return
    }

    setSubmitting(true)

    try {
      // Find the selected meeting and verify the secret code
      const selectedMeeting = meetings.find(m => m.id === form.meetingId)

      if (!selectedMeeting) {
        setError('[ERROR] Meeting not found')
        return
      }

      // Verify secret code (case-insensitive)
      if (selectedMeeting.secret_code?.toLowerCase() !== form.secretCode.trim().toLowerCase()) {
        setError('[ERROR] Invalid secret code')
        return
      }

      // Check if already checked in (by user_id if logged in, or by student_id if not)
      let existingAttendance
      if (user) {
        const { data } = await supabase
          .from('attendance')
          .select('id')
          .eq('meeting_id', form.meetingId)
          .eq('user_id', user.id)
          .single()
        existingAttendance = data
      } else {
        const { data } = await supabase
          .from('attendance')
          .select('id')
          .eq('meeting_id', form.meetingId)
          .eq('student_id', studentIdToUse)
          .single()
        existingAttendance = data
      }

      if (existingAttendance) {
        setError('[ERROR] You have already checked in to this meeting')
        return
      }

      // Record attendance
      const { error: insertError } = await supabase.from('attendance').insert({
        meeting_id: form.meetingId,
        user_id: user?.id || null,
        student_id: studentIdToUse
      })

      if (insertError) throw insertError

      // Fetch updated attendance count for signed-in users
      if (user) {
        const { count } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        setAttendanceCount(count || 0)
      }

      setSubmitted(true)
      setForm({ meetingId: '', secretCode: '', studentId: userProfile?.student_id || '' })
    } catch (err) {
      setError('[ERROR] Transmission failed. Retry.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedMeeting = meetings.find(m => m.id === form.meetingId)

  // Show loading only for auth, not required anymore
  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="flex items-center gap-3 justify-center">
            <Spinner className="animate-spin h-6 w-6 text-matrix" />
            <span className="font-terminal text-lg neon-pulse">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center p-6">
        <div className="crt-overlay" />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 rounded-lg bg-matrix/10 border border-matrix/30 flex items-center justify-center mx-auto mb-6 neon-box">
            <Check className="w-10 h-10 text-matrix" />
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
                <span className="text-matrix ml-2">ID:</span> {userProfile?.student_id || form.studentId}
              </div>

              {/* User Profile Section or Sign In Prompt */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                {user && userProfile ? (
                  /* Signed-in user: Show profile and stats */
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      {userProfile.photo_url ? (
                        <img
                          src={userProfile.photo_url}
                          alt="Profile"
                          className="w-16 h-16 rounded-lg border border-matrix/40"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-matrix/10 border border-matrix/40 flex items-center justify-center">
                          <User className="w-8 h-8 text-matrix/50" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-matrix font-semibold text-lg">
                          {userProfile.display_name}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-matrix/5 border border-matrix/20">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-matrix mb-1">
                          {attendanceCount}
                        </div>
                        <div className="text-xs text-gray-500 font-terminal uppercase">
                          Total Meetings Attended
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Not signed in: Encourage sign in */
                  <div className="p-4 rounded-lg bg-hack-cyan/5 border border-hack-cyan/30 text-center">
                    <p className="text-hack-cyan text-sm mb-3">
                      Want to track your attendance across all meetings?
                    </p>
                    <Link
                      to="/auth"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-hack-cyan/20 border border-hack-cyan text-hack-cyan hover:bg-hack-cyan/30 transition-colors text-sm font-terminal"
                    >
                      SIGN IN TO SAVE PROGRESS
                    </Link>
                    <p className="text-gray-600 text-xs mt-3">
                      Track stats, register for events, and more
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <button
              onClick={() => setSubmitted(false)}
              className="btn-hack rounded-lg inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              CHECK IN AGAIN
            </button>
            {user && userProfile ? (
              <Link
                to="/dashboard"
                className="btn-hack-filled rounded-lg inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                BACK TO DASHBOARD
              </Link>
            ) : (
              <Link
                to="/meetings"
                className="btn-hack-filled rounded-lg inline-flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                MORE EVENTS
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <header className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
          {/* User Identity Section */}
          {user && userProfile ? (
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
                      <User className="w-7 h-7 text-matrix/50" />
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
          ) : (
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">student_id.sh</span>
              </div>
              <div className="terminal-body">
                <label className="block text-sm mb-2 text-gray-500 font-terminal">--student-id *</label>
                {/* 8 separate boxes for larger screens */}
                <div className="hidden sm:flex gap-2 mb-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                    <input
                      key={index}
                      ref={(el) => { studentIdRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={form.studentId[index] || ''}
                      onChange={(e) => handleStudentIdDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleStudentIdKeyDown(index, e)}
                      onPaste={handleStudentIdPaste}
                      className="w-10 h-12 text-center text-lg font-terminal bg-terminal-bg border border-matrix/30 rounded-lg text-matrix focus:border-matrix focus:neon-box outline-none transition-all"
                    />
                  ))}
                </div>
                {/* Single input for mobile */}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                  placeholder="8-digit De Anza ID"
                  className="sm:hidden input-hack w-full rounded-lg mb-2"
                />
                <p className="text-xs text-gray-600 font-terminal">
                  <span className="text-matrix">&gt;</span> De Anza Student ID
                </p>
                <p className="text-xs mt-2 text-gray-500 font-terminal">
                  <Link to="/auth" className="text-hack-cyan hover:underline">Sign in</Link> to save your info for future check-ins
                </p>
              </div>
            </div>
          )}

          {/* Meeting Selection */}
          <div ref={meetingSelectRef} className="terminal-window overflow-visible">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">select_meeting.sh</span>
            </div>
            <div className="terminal-body overflow-visible">
              <label className="block text-sm mb-3 text-gray-500 font-terminal">--meeting</label>
              {!loadingMeetings && meetings.length === 0 ? (
                <div className="p-4 rounded-lg bg-hack-yellow/10 border border-hack-yellow/50">
                  <p className="text-hack-yellow text-sm">
                    <span className="text-hack-yellow">[WARNING]</span> No meetings at this time.
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Check back later or contact a club officer.
                  </p>
                </div>
              ) : (
                <div onClick={handleMeetingDropdownClick}>
                  <CustomSelect
                    options={meetings.map((meeting) => ({
                      value: meeting.id,
                      label: meeting.title,
                      badge: {
                        text: TYPE_LABELS[meeting.type],
                        color: TYPE_COLORS[meeting.type]
                      },
                      metadata: new Date(meeting.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) + ' • ' + meeting.location
                    }))}
                    value={form.meetingId}
                    onChange={handleMeetingChange}
                    placeholder={loadingMeetings ? 'Loading meetings...' : 'Select a meeting...'}
                    disabled={loadingMeetings}
                  />
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
                className="input-hack w-full rounded-lg font-mono uppercase"
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
            disabled={submitting || meetings.length === 0}
            className="btn-hack-filled rounded-lg w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="animate-spin h-4 w-4" />
                VERIFYING...
              </span>
            ) : (
              'CHECK IN'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Attendance
