import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import SignatureCanvas from 'react-signature-canvas'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface StudentForm {
  name: string
  studentId: string
  email: string
}

interface InstructorForm {
  name: string
  office: string
  phone: string
  email: string
}

function Petition() {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pdfExpanded, setPdfExpanded] = useState(false)
  const [isInstructor, setIsInstructor] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved !== null ? JSON.parse(saved) : true
  })
  const sigCanvas = useRef<SignatureCanvas>(null)

  const [studentForm, setStudentForm] = useState<StudentForm>({
    name: '',
    studentId: '',
    email: ''
  })

  const [instructorForm, setInstructorForm] = useState<InstructorForm>({
    name: '',
    office: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    const bgColor = darkMode ? '#09090b' : '#f4f4f5'
    document.documentElement.style.backgroundColor = bgColor
    document.body.style.backgroundColor = bgColor
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = darkMode ? 'rgb(24, 24, 27)' : 'rgb(244, 244, 245)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [darkMode])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const clearSignature = () => {
    sigCanvas.current?.clear()
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = darkMode ? 'rgb(24, 24, 27)' : 'rgb(244, 244, 245)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const handleStudentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value })
  }

  const handleInstructorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInstructorForm({ ...instructorForm, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (sigCanvas.current?.isEmpty()) {
      setError('Please provide your signature')
      return
    }

    const signatureData = sigCanvas.current?.toDataURL('image/png')

    setSubmitting(true)

    try {
      const collectionName = isInstructor ? 'instructor_signatures' : 'student_signatures'
      const formData = isInstructor ? instructorForm : studentForm

      await addDoc(collection(db, collectionName), {
        ...formData,
        signature: signatureData,
        timestamp: serverTimestamp()
      })

      setSubmitted(true)
      if (isInstructor) {
        setInstructorForm({ name: '', office: '', phone: '', email: '' })
      } else {
        setStudentForm({ name: '', studentId: '', email: '' })
      }
      clearSignature()
    } catch (err) {
      setError('Failed to submit. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`fixed top-6 right-6 z-40 p-2.5 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-12 ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400' : 'bg-white hover:bg-zinc-200 text-zinc-700 shadow-md'}`}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-cyber-500/20' : 'bg-cyber-100'}`}>
            <svg className={`w-8 h-8 ${darkMode ? 'text-cyber-400' : 'text-cyber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
          <p className={`mb-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Your signature has been recorded.</p>
          <a href="/"

            className="px-6 py-2 bg-cyber-600 hover:bg-cyber-500 text-white rounded-lg font-medium transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      <div className={`fixed inset-0 pointer-events-none transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-cyber-950/20 via-transparent to-cyan-950/20' : 'bg-gradient-to-br from-cyber-100/40 via-transparent to-cyan-100/40'}`} />

      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-6 right-6 z-40 p-2.5 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-12 ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400' : 'bg-white hover:bg-zinc-200 text-zinc-700 shadow-md'}`}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        <header className="mb-8">
          <a href="/" className={`inline-flex items-center gap-2 transition-colors mb-6 ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </a>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Club Petition</h1>
          <p className={darkMode ? 'text-zinc-400' : 'text-zinc-600'}>Sign the petition to help establish DACC as an official club.</p>
        </header>

        {/* PDF Viewer */}
        <div
          className={`relative mb-8 rounded-xl border overflow-hidden transition-all duration-500 ease-out ${
            darkMode ? 'border-zinc-800' : 'border-zinc-300'
          } ${pdfExpanded ? 'max-h-[600px]' : 'max-h-48'}`}
          onMouseEnter={() => setPdfExpanded(true)}
          onMouseLeave={() => setPdfExpanded(false)}
        >
          <div className={`absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none transition-opacity duration-300 ${pdfExpanded ? 'opacity-0' : 'opacity-100'} ${darkMode ? 'bg-gradient-to-t from-zinc-950 to-transparent' : 'bg-gradient-to-t from-zinc-100 to-transparent'}`} />

          {!pdfExpanded && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <span className={`px-4 py-2 rounded-lg text-sm border ${darkMode ? 'bg-zinc-900/90 text-zinc-400 border-zinc-700' : 'bg-white/90 text-zinc-600 border-zinc-300'}`}>
                Hover to expand
              </span>
            </div>
          )}

          <div className={`overflow-y-auto transition-all duration-500 ${pdfExpanded ? 'max-h-[600px]' : 'max-h-48'}`}>
            <Document
              file="/Petition-to-Organize-a-New-Club-Fillable (1)-1.pdf"
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className={`flex items-center justify-center h-48 ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Loading PDF...
                </div>
              }
              error={
                <div className="flex items-center justify-center h-48 text-red-400">
                  Failed to load PDF
                </div>
              }
            >
              {Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={800}
                  className="mx-auto"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              ))}
            </Document>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <span className={`text-sm font-medium transition-colors ${!isInstructor ? (darkMode ? 'text-cyber-400 cyber-text-glow' : 'text-cyber-600') : (darkMode ? 'text-zinc-500' : 'text-zinc-500')}`}>
            Student
          </span>
          <button
            type="button"
            onClick={() => setIsInstructor(!isInstructor)}
            className={`relative w-12 h-6 rounded-full transition-colors ${isInstructor ? 'bg-cyber-600' : (darkMode ? 'bg-zinc-700' : 'bg-zinc-300')}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                isInstructor ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isInstructor ? (darkMode ? 'text-cyber-400 cyber-text-glow' : 'text-cyber-600') : (darkMode ? 'text-zinc-500' : 'text-zinc-500')}`}>
            Instructor
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isInstructor ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={studentForm.name}
                  onChange={handleStudentChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  value={studentForm.studentId}
                  onChange={handleStudentChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                  placeholder="e.g. 12345678"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={studentForm.email}
                  onChange={handleStudentChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={instructorForm.name}
                  onChange={handleInstructorChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Office</label>
                <input
                  type="text"
                  name="office"
                  value={instructorForm.office}
                  onChange={handleInstructorChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                  placeholder="Office location"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={instructorForm.phone}
                  onChange={handleInstructorChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                  placeholder="(xxx) xxx-xxxx"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={instructorForm.email}
                  onChange={handleInstructorChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-600'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                  }`}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          )}

          {/* Signature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>E-Signature</label>
              <button
                type="button"
                onClick={clearSignature}
                className={`text-sm transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Clear
              </button>
            </div>
            <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-300 bg-zinc-100'}`}>
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  className: 'w-full h-32 cursor-crosshair',
                  style: { width: '100%', height: '128px' }
                }}
                backgroundColor={darkMode ? 'rgb(24, 24, 27)' : 'rgb(244, 244, 245)'}
                penColor={darkMode ? '#00baff' : '#008bbf'}
              />
            </div>
            <p className={`text-xs mt-2 ${darkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>Draw your signature above</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-8 py-3 bg-cyber-600 hover:bg-cyber-500 disabled:bg-cyber-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Signature'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Petition
