import { supabase } from './supabase'

const CTFD_SYNC_URL = '/api/ctfd/sync'

export async function syncUserToCtfd(): Promise<{
  ctfd_username: string
  ctfd_password: string
  already_synced: boolean
}> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(CTFD_SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'sync_user',
      auth_token: session.access_token,
    }),
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export async function syncTeamToCtfd(teamId: string): Promise<{
  ctfd_team_id: number
  members_synced: number
}> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(CTFD_SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'sync_team',
      team_id: teamId,
      auth_token: session.access_token,
    }),
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export async function getCtfdCredentials(): Promise<{
  ctfd_username: string | null
  ctfd_password: string | null
} | null> {
  const { data, error } = await supabase.rpc('get_my_ctfd_credentials')
  if (error || !data || data.length === 0) return null
  const row = Array.isArray(data) ? data[0] : data
  return {
    ctfd_username: row.ctfd_username,
    ctfd_password: row.ctfd_password,
  }
}

/**
 * Auto-sync the current user and their team to CTFd.
 * Called on every login. Non-blocking - failures are silently logged.
 */
export async function autoSyncToCtfd(): Promise<void> {
  try {
    // Sync user first
    await syncUserToCtfd()

    // Check if user is in a team, and sync that too
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: membership } = await supabase
      .from('ctf_team_members')
      .select('team_id')
      .eq('user_id', session.user.id)
      .single()

    if (membership) {
      await syncTeamToCtfd(membership.team_id)
    }
  } catch (err) {
    console.warn('CTFd auto-sync failed:', err)
  }
}
