import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface LinkedAccount {
  provider: string
  provider_account_id: string
  provider_email: string | null
  provider_username: string | null
  provider_avatar_url: string | null
  linked_at: string
}

export interface UserProfile {
  id: string
  email: string
  display_name: string
  student_id: string | null
  photo_url: string | null
  linked_accounts: LinkedAccount[]
  is_officer: boolean
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
  signInWithLinkedIn: () => Promise<void>
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
    profilePicture?: File,
    avatarUrl?: string
  ) => Promise<void>
  linkIdentity: (provider: 'github' | 'discord' | 'x' | 'linkedin_oidc') => Promise<void>
  unlinkIdentity: (provider: string) => Promise<void>
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
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id)

            // If we just linked an identity, sync it to the database
            if (event === 'USER_UPDATED' && session.user.identities && profile) {
              await syncIdentitiesToProfile(session.user.id, session.user.identities, profile)
            }
          }, 0)
        } else {
          setUserProfile(null)
          setLoading(false)
        }
      }
    )

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // User might not have a profile yet (first login)
        setUserProfile(null)
        return null
      }

      // Ensure linked_accounts is always an array
      let profile: UserProfile = {
        ...data,
        linked_accounts: data.linked_accounts || [],
        is_officer: data.is_officer || false
      }

      // Check if current auth identities need to be synced
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser?.identities && currentUser.identities.length > 0) {
        const existingProviders = new Set(profile.linked_accounts.map(a => a.provider))
        const missingIdentities = currentUser.identities.filter(i => !existingProviders.has(i.provider))

        if (missingIdentities.length > 0) {
          // Sync missing identities
          await syncIdentitiesToProfile(userId, currentUser.identities, profile)
          // Re-fetch to get updated data
          const { data: updatedData } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

          if (updatedData) {
            profile = {
              ...updatedData,
              linked_accounts: updatedData.linked_accounts || [],
              is_officer: updatedData.is_officer || false
            }
          }
        }
      }

      setUserProfile(profile)
      return profile
    } catch {
      setUserProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const syncIdentitiesToProfile = async (
    userId: string,
    identities: Array<{ provider: string; id: string; identity_data?: Record<string, unknown> }>,
    currentProfile: UserProfile
  ): Promise<void> => {
    const newLinkedAccounts: LinkedAccount[] = identities.map(identity => {
      const identityData = identity.identity_data || {}

      // Check if this provider already exists
      const existing = currentProfile.linked_accounts?.find(a => a.provider === identity.provider)

      return {
        provider: identity.provider,
        provider_account_id: identity.id,
        provider_email: (identityData.email as string) || null,
        provider_username: (identityData.user_name as string) ||
          (identityData.preferred_username as string) ||
          (identityData.name as string) || null,
        provider_avatar_url: (identityData.avatar_url as string) ||
          (identityData.picture as string) || null,
        linked_at: existing?.linked_at || new Date().toISOString()
      }
    })

    const { data, error } = await supabase
      .from('users')
      .update({ linked_accounts: newLinkedAccounts })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error syncing identities to profile:', error)
      return
    }

    setUserProfile({
      ...data,
      linked_accounts: data.linked_accounts || []
    })
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
      provider: 'x',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const signInWithLinkedIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const linkIdentity = async (provider: 'github' | 'discord' | 'x' | 'linkedin_oidc') => {
    // Store that we're linking so AuthCallback knows to redirect back to settings
    sessionStorage.setItem('linking_provider', provider)

    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/settings`
      }
    })
    if (error) throw error
  }

  const unlinkIdentity = async (provider: string) => {
    if (!user || !userProfile) throw new Error('No user logged in')

    // Get fresh user data to ensure we have current identities
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) throw new Error('Failed to get current user')

    // Find the identity to unlink
    const identity = currentUser.identities?.find(i => i.provider === provider)
    if (!identity) throw new Error('Identity not found')

    // Check we have more than one identity
    if ((currentUser.identities?.length || 0) <= 1) {
      throw new Error('Cannot unlink the only identity')
    }

    // Unlink from Supabase Auth - pass the identity object directly
    const { error } = await supabase.auth.unlinkIdentity(identity)
    if (error) throw error

    // Remove from linked_accounts in users table
    const updatedLinkedAccounts = (userProfile.linked_accounts || []).filter(
      a => a.provider !== provider
    )

    const { data, error: updateError } = await supabase
      .from('users')
      .update({ linked_accounts: updatedLinkedAccounts })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) throw updateError

    setUserProfile({
      ...data,
      linked_accounts: data.linked_accounts || []
    })
  }

  const createProfile = async (
    displayName: string,
    studentId: string,
    profilePicture?: File,
    avatarUrl?: string
  ) => {
    if (!user) throw new Error('No user logged in')

    let photoUrl: string | null = null

    // Use OAuth avatar URL if provided and no custom picture
    if (avatarUrl && !profilePicture) {
      photoUrl = avatarUrl
    }

    // Upload profile picture if provided (overrides OAuth avatar)
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

    // Build initial linked accounts from identities
    const initialLinkedAccounts: LinkedAccount[] = (user.identities || []).map(identity => {
      const identityData = identity.identity_data || {}
      return {
        provider: identity.provider,
        provider_account_id: identity.id,
        provider_email: (identityData.email as string) || null,
        provider_username: (identityData.user_name as string) ||
          (identityData.preferred_username as string) ||
          (identityData.name as string) || null,
        provider_avatar_url: (identityData.avatar_url as string) ||
          (identityData.picture as string) || null,
        linked_at: new Date().toISOString()
      }
    })

    // Create user profile in database
    const { data, error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!.toLowerCase(),
        display_name: displayName,
        student_id: studentId || null,
        photo_url: photoUrl,
        linked_accounts: initialLinkedAccounts
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

    setUserProfile({
      ...data,
      linked_accounts: data.linked_accounts || []
    })
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
        signInWithLinkedIn,
        signOut,
        updateUserProfile,
        deleteAccount,
        createProfile,
        linkIdentity,
        unlinkIdentity
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
