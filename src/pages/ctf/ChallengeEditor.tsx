import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useOfficerVerification } from '@/hooks/useOfficerVerification'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Plus, Trash, AlertTriangle } from '@/lib/cyberIcon'
import { categoryInfo, difficultyInfo, type Challenge, type CTFCategory, type CTFDifficulty } from './types'

function ChallengeEditor() {
  const { id } = useParams<{ id: string }>()
  const { user, userProfile } = useAuth()
  const { isVerifiedOfficer, isLoading: verifyingOfficer } = useOfficerVerification()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CTFCategory>('web')
  const [difficulty, setDifficulty] = useState<CTFDifficulty>('easy')
  const [points, setPoints] = useState(100)
  const [hint, setHint] = useState('')
  const [flag, setFlag] = useState('')
  const [solution, setSolution] = useState('')
  const [author, setAuthor] = useState('')
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])

  // Use server-verified officer status instead of client-side state
  const isOfficer = isVerifiedOfficer ?? false

  useEffect(() => {
    setLoaded(true)
    if (isEditing) {
      fetchChallenge()
    }
  }, [id])

  const fetchChallenge = async () => {
    if (!id) return

    try {
      const { data, error } = await supabase
        .from('ctf_challenges')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Challenge not found')
        return
      }

      setTitle(data.title)
      setDescription(data.description)
      setCategory(data.category as CTFCategory)
      setDifficulty(data.difficulty as CTFDifficulty)
      setPoints(data.points)
      setHint(data.hint || '')
      setFlag(data.flag)
      setSolution(data.solution || '')
      setAuthor(data.author || '')
      setFiles(data.files || [])
    } catch (err) {
      console.error('Error fetching challenge:', err)
      setError('Failed to load challenge')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOfficer || !user) return

    // Validate
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    if (!flag.trim()) {
      setError('Flag is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const challengeData = {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        points,
        hint: hint.trim() || null,
        flag: flag.trim(),
        solution: solution.trim() || null,
        author: author.trim() || null,
        files: files.length > 0 ? files : [],
        is_active: true,
        created_by: user.id,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('ctf_challenges')
          .update(challengeData)
          .eq('id', id)

        if (error) throw error
        navigate(`/ctf/challenge/${id}`)
      } else {
        const { data, error } = await supabase
          .from('ctf_challenges')
          .insert(challengeData)
          .select()
          .single()

        if (error) throw error
        navigate(`/ctf/challenge/${data.id}`)
      }
    } catch (err: any) {
      console.error('Error saving challenge:', err)
      setError(err.message || 'Failed to save challenge')
    } finally {
      setSaving(false)
    }
  }

  const addFile = () => {
    setFiles([...files, { name: '', url: '' }])
  }

  const updateFile = (index: number, field: 'name' | 'url', value: string) => {
    const newFiles = [...files]
    newFiles[index][field] = value
    setFiles(newFiles)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  // Access control
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-hack-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You must be logged in to access this page.</p>
          <Link to="/auth" className="cli-btn-filled  px-6 py-3">
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (!isOfficer) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-hack-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Only officers can create or edit challenges.</p>
          <Link to="/ctf/challenges" className="cli-btn-filled  px-6 py-3">
            Back to Challenges
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix flex items-center justify-center">
        <div className="text-center">
          <div className="font-terminal text-lg text-blue-600 dark:neon-pulse dark:text-matrix">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to={isEditing ? `/ctf/challenge/${id}` : '/ctf/challenges'}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-matrix transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-terminal text-sm">
              {isEditing ? 'Back to Challenge' : 'Back to Challenges'}
            </span>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'Create'}</span>{' '}
            <span className="neon-text">Challenge</span>
          </h1>
        </div>

        {/* Form */}
        <div className={`transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <form onSubmit={handleSubmit}>
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">
                  {isEditing ? 'edit_challenge.sh' : 'create_challenge.sh'}
                </span>
              </div>
              <div className="terminal-body space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                    TITLE *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Challenge title..."
                    className="w-full input-hack "
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                    DESCRIPTION *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Challenge description... (supports **bold** and `code` formatting)"
                    rows={8}
                    className="w-full input-hack  resize-y"
                    required
                  />
                </div>

                {/* Category & Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                      CATEGORY *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CTFCategory)}
                      className="w-full input-hack "
                    >
                      {(Object.keys(categoryInfo) as CTFCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {categoryInfo[cat].name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                      DIFFICULTY *
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => {
                        const diff = e.target.value as CTFDifficulty
                        setDifficulty(diff)
                        setPoints(difficultyInfo[diff].basePoints)
                      }}
                      className="w-full input-hack "
                    >
                      {(Object.keys(difficultyInfo) as CTFDifficulty[]).map((diff) => (
                        <option key={diff} value={diff}>
                          {difficultyInfo[diff].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Points & Author */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                      POINTS
                    </label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                      min={0}
                      step={50}
                      className="w-full input-hack "
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                      AUTHOR
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Challenge author..."
                      className="w-full input-hack "
                    />
                  </div>
                </div>

                {/* Flag */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                    FLAG * <span className="text-gray-500 dark:text-gray-600">(case-insensitive)</span>
                  </label>
                  <input
                    type="text"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="DACC{your_flag_here}"
                    className="w-full input-hack  font-mono"
                    required
                  />
                </div>

                {/* Hint */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                    HINT <span className="text-gray-500 dark:text-gray-600">(optional)</span>
                  </label>
                  <textarea
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    placeholder="Optional hint for players..."
                    rows={3}
                    className="w-full input-hack  resize-y"
                  />
                </div>

                {/* Solution */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-terminal">
                    SOLUTION <span className="text-gray-500 dark:text-gray-600">(officers only - step-by-step walkthrough)</span>
                  </label>
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Step-by-step solution walkthrough...&#10;&#10;1. First, examine the source code...&#10;2. Notice the vulnerability in...&#10;3. Exploit by..."
                    rows={10}
                    className="w-full input-hack  resize-y font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-600 mt-2">
                    Use numbered steps (1. 2. 3.), `code blocks`, and **bold** for formatting.
                  </p>
                </div>

                {/* Files */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400 font-terminal">
                      ATTACHMENTS <span className="text-gray-500 dark:text-gray-600">(optional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={addFile}
                      className="text-blue-600 dark:text-matrix hover:text-blue-700 dark:hover:text-matrix/80 text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add File
                    </button>
                  </div>
                  {files.length > 0 && (
                    <div className="space-y-3">
                      {files.map((file, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="text"
                            value={file.name}
                            onChange={(e) => updateFile(index, 'name', e.target.value)}
                            placeholder="File name..."
                            className="flex-1 input-hack  text-sm"
                          />
                          <input
                            type="text"
                            value={file.url}
                            onChange={(e) => updateFile(index, 'url', e.target.value)}
                            placeholder="File URL..."
                            className="flex-[2] input-hack  text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10  transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4  bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 cli-btn-filled  py-3 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Challenge'}
                  </button>
                  <Link
                    to={isEditing ? `/ctf/challenge/${id}` : '/ctf/challenges'}
                    className="cli-btn-dashed px-6 py-3"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChallengeEditor
