import type { Lesson } from '@/types/database.types'
import ReactMarkdown from 'react-markdown'

interface CourseContentProps {
  lesson: Lesson
  onComplete: () => void
}

function CourseContent({ lesson, onComplete }: CourseContentProps) {
  const content = lesson.content

  return (
    <div className="space-y-6">
      {/* Video (if available) */}
      {content?.video_url && (
        <div className="aspect-video bg-black rounded-lg overflow-hidden border border-matrix/30">
          <iframe
            src={content.video_url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={lesson.title}
          />
        </div>
      )}

      {/* Markdown Content */}
      {content?.markdown && (
        <div className="prose prose-invert prose-terminal max-w-none">
          <div className="p-6 bg-terminal-alt rounded-lg border border-matrix/30">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-matrix mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold text-matrix mb-3 mt-6">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-bold text-hack-cyan mb-2 mt-4">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-300 font-terminal text-sm mb-3 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-gray-300 font-terminal text-sm space-y-1 mb-3">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-gray-300 font-terminal text-sm space-y-1 mb-3">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-300 font-terminal text-sm">{children}</li>
                ),
                code: ({ children, className }) => {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 bg-terminal-bg text-matrix rounded font-mono text-xs">
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className="block p-4 bg-terminal-bg text-matrix rounded font-mono text-xs overflow-x-auto">
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <pre className="mb-3">{children}</pre>,
                strong: ({ children }) => (
                  <strong className="font-bold text-matrix">{children}</strong>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-hack-cyan hover:text-hack-cyan/80 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                )
              }}
            >
              {content.markdown}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Resources */}
      {content?.resources && content.resources.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-matrix mb-3">Resources</h3>
          <div className="grid gap-2">
            {content.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-terminal-alt rounded border border-matrix/30 hover:border-matrix transition-colors group"
              >
                <span className="text-xs px-2 py-1 bg-terminal-bg rounded font-terminal text-gray-500 group-hover:text-matrix">
                  {resource.type}
                </span>
                <span className="text-sm font-terminal text-gray-300 group-hover:text-matrix">
                  {resource.title}
                </span>
              </a>
            ))}
          </div>
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

export default CourseContent
