import { useState, useEffect } from 'react'
import { fetchLessonMeeting } from '@/lib/study'
import type { Lesson, Meeting } from '@/types/database.types'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

interface WorkshopLinkProps {
  lesson: Lesson
  onComplete: () => void
}

function WorkshopLink({ lesson, onComplete }: WorkshopLinkProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMeeting() {
      if (lesson.meeting_id) {
        try {
          const meetingData = await fetchLessonMeeting(lesson.meeting_id)
          setMeeting(meetingData)
        } catch (error) {
          console.error('Failed to load meeting:', error)
        }
      }
      setLoading(false)
    }

    loadMeeting()
  }, [lesson.meeting_id])

  return (
    <div className="space-y-6">
      {/* Workshop Description */}
      {lesson.content?.markdown && (
        <div className="p-6 bg-terminal-alt rounded-lg border border-matrix/30">
          <p className="text-gray-300 font-terminal text-sm whitespace-pre-wrap">
            {lesson.content.markdown}
          </p>
        </div>
      )}

      {/* Meeting Link (if available) */}
      {loading && (
        <div className="text-center py-6 text-gray-500 font-terminal text-sm">
          Loading meeting details...
        </div>
      )}

      {!loading && meeting && (
        <div className="p-6 bg-terminal-alt rounded-lg border border-matrix/30">
          <h3 className="text-lg font-bold text-matrix mb-4">Attend Club Meeting</h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm font-terminal">
              <Calendar className="w-4 h-4 text-hack-cyan" />
              <span className="text-gray-300">{meeting.date}</span>
            </div>

            <div className="flex items-center gap-3 text-sm font-terminal">
              <Clock className="w-4 h-4 text-hack-cyan" />
              <span className="text-gray-300">{meeting.time}</span>
            </div>

            <div className="flex items-center gap-3 text-sm font-terminal">
              <MapPin className="w-4 h-4 text-hack-cyan" />
              <span className="text-gray-300">{meeting.location}</span>
            </div>

            {meeting.type && (
              <div className="flex items-center gap-3 text-sm font-terminal">
                <Users className="w-4 h-4 text-hack-cyan" />
                <span className="px-2 py-0.5 rounded text-xs border border-matrix/50 bg-matrix/20 text-matrix">
                  {meeting.type}
                </span>
              </div>
            )}
          </div>

          <a
            href={`/meetings/${meeting.slug}`}
            className="btn-hack-filled inline-block px-6 py-2 text-sm font-terminal text-center w-full"
          >
            View Meeting Details
          </a>
        </div>
      )}

      {/* Self-Paced Option */}
      {lesson.is_self_paced && (
        <div className="p-6 bg-terminal-alt rounded-lg border border-matrix/30">
          <h3 className="text-lg font-bold text-hack-cyan mb-3">Self-Paced Learning</h3>
          <p className="text-gray-300 font-terminal text-sm mb-4">
            This workshop can also be completed at your own pace. Review the materials and practice
            the concepts on your own time.
          </p>

          {lesson.content?.resources && lesson.content.resources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-terminal text-gray-500 mb-2">Materials:</p>
              {lesson.content.resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-terminal-bg rounded border border-gray-800 hover:border-matrix transition-colors group"
                >
                  <span className="text-xs px-2 py-1 bg-terminal-alt rounded font-terminal text-gray-500 group-hover:text-matrix">
                    {resource.type}
                  </span>
                  <span className="text-sm font-terminal text-gray-300 group-hover:text-matrix">
                    {resource.title}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Close Button */}
      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button
          onClick={onComplete}
          className="btn-hack-filled px-6 py-2 text-sm font-terminal"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default WorkshopLink
