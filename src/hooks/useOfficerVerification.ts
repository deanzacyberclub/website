import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook to verify officer status server-side
 * This prevents client-side tampering of the is_officer flag
 */
export function useOfficerVerification() {
  const [isVerifiedOfficer, setIsVerifiedOfficer] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    verifyOfficerStatus()
  }, [])

  const verifyOfficerStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('verify_officer_status')

      if (error) {
        console.error('Error verifying officer status:', error)
        setIsVerifiedOfficer(false)
      } else {
        setIsVerifiedOfficer(data === true)
      }
    } catch (err) {
      console.error('Error verifying officer status:', err)
      setIsVerifiedOfficer(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isVerifiedOfficer, isLoading, refetch: verifyOfficerStatus }
}
