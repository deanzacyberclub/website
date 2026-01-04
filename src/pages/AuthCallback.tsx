import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/lib/cyberIcon'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
        navigate('/auth?error=callback_failed')
        return
      }

      // Check if we were linking an account
      const linkingProvider = sessionStorage.getItem('linking_provider')
      if (linkingProvider) {
        sessionStorage.removeItem('linking_provider')

        // Check for linking errors in URL (Supabase returns errors as hash params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const errorDescription = hashParams.get('error_description')

        if (errorDescription) {
          // Identity is already linked to another account
          if (errorDescription.includes('already linked') ||
              errorDescription.includes('Identity is already linked')) {
            navigate('/settings?error=already_linked')
          } else {
            navigate(`/settings?error=${encodeURIComponent(errorDescription)}`)
          }
          return
        }

        if (!session) {
          navigate('/settings?error=linking_failed')
          return
        }

        // Sync the new identity to the database before redirecting
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile && session.user.identities) {
          const existingProviders = new Set(
            (profile.linked_accounts || []).map((a: { provider: string }) => a.provider)
          )
          const hasNewIdentity = session.user.identities.some(
            i => !existingProviders.has(i.provider)
          )

          if (hasNewIdentity) {
            // Build updated linked accounts from all identities
            const newLinkedAccounts = session.user.identities.map(identity => {
              const identityData = identity.identity_data || {}
              const existing = (profile.linked_accounts || []).find(
                (a: { provider: string }) => a.provider === identity.provider
              )
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

            await supabase
              .from('users')
              .update({ linked_accounts: newLinkedAccounts })
              .eq('id', session.user.id)
          }
        }

        navigate('/settings')
        return
      }

      if (session) {

        // Check if user profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!profile) {
          // New user - redirect to profile setup
          navigate('/auth?step=profile')
        } else {
          // Get the return URL from the 'to' parameter
          const returnTo = searchParams.get('to') || '/dashboard'
          navigate(returnTo)
        }
      } else {
        navigate('/auth')
      }
    }

    handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
      <div className="crt-overlay" />
      <div className="text-center relative z-10">
        <div className="flex items-center gap-3 justify-center">
          <Spinner className="animate-spin h-6 w-6 text-matrix" />
          <span className="font-terminal text-lg neon-pulse">Verifying...</span>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback
