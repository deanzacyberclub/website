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
  signInWithGitHub: () => Promise<void>
  signInWithDiscord: () => Promise<void>
  signInWithTwitter: () => Promise<void>
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock issues
          setTimeout(() => {
            fetchUserProfile(session.user.id)
          }, 0)
        } else {
          setUserProfile(null)
          setLoading(false)
        }
      }
    )

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

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

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const signInWithTwitter = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
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

    if (profileError) {
      // Check for common setup issues
      if (profileError.code === '42P01' || profileError.message?.includes('does not exist')) {
        throw new Error('Database not configured. Please run supabase/setup.sql')
      }
      throw profileError
    }
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
        signInWithGitHub,
        signInWithDiscord,
        signInWithTwitter,
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
