import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string
  display_name: string
  student_id: string | null
  photo_url: string | null
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithMagicLink: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (
    displayName: string,
    studentId: string,
    profilePicture?: File | null
  ) => Promise<void>
  deleteAccount: () => Promise<void>
  createProfile: (
    displayName: string,
    studentId: string,
    profilePicture?: File
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // User might not have a profile yet (first login)
        setUserProfile(null)
        return
      }
      setUserProfile(data)
    } catch {
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    if (error) throw error
  }

  const createProfile = async (
    displayName: string,
    studentId: string,
    profilePicture?: File
  ) => {
    if (!user) throw new Error('No user logged in')

    let photoUrl: string | null = null

    // Upload profile picture if provided
    if (profilePicture) {
      const fileExt = profilePicture.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, profilePicture, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)

      photoUrl = urlData.publicUrl
    }

    // Create user profile in database
    const { data, error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!.toLowerCase(),
        display_name: displayName,
        student_id: studentId || null,
        photo_url: photoUrl
      })
      .select()
      .single()

    if (profileError) throw profileError
    setUserProfile(data)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUserProfile(null)
  }

  const updateUserProfile = async (
    displayName: string,
    studentId: string,
    profilePicture?: File | null
  ) => {
    if (!user || !userProfile) throw new Error('No user logged in')

    let photoUrl = userProfile.photo_url

    // Handle profile picture update
    if (profilePicture) {
      const fileExt = profilePicture.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, profilePicture, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)

      photoUrl = urlData.publicUrl
    } else if (profilePicture === null && userProfile.photo_url) {
      // User wants to remove profile picture
      try {
        const { data: files } = await supabase.storage
          .from('profile-pictures')
          .list(user.id)

        if (files && files.length > 0) {
          const filesToRemove = files.map(f => `${user.id}/${f.name}`)
          await supabase.storage
            .from('profile-pictures')
            .remove(filesToRemove)
        }
      } catch {
        // Ignore storage errors
      }
      photoUrl = null
    }

    // Update database profile
    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: displayName,
        student_id: studentId || null,
        photo_url: photoUrl
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setUserProfile(data)
  }

  const deleteAccount = async () => {
    if (!user) throw new Error('No user logged in')

    // Delete profile picture from storage
    try {
      const { data: files } = await supabase.storage
        .from('profile-pictures')
        .list(user.id)

      if (files && files.length > 0) {
        const filesToRemove = files.map(f => `${user.id}/${f.name}`)
        await supabase.storage
          .from('profile-pictures')
          .remove(filesToRemove)
      }
    } catch {
      // Ignore storage errors
    }

    // Delete user profile from database (will cascade due to FK)
    await supabase.from('users').delete().eq('id', user.id)

    // Sign out the user
    await signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signInWithMagicLink,
        verifyOtp,
        signOut,
        updateUserProfile,
        deleteAccount,
        createProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
