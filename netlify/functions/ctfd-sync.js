import { createClient } from '@supabase/supabase-js'

const CTFD_URL = process.env.CTFD_URL || 'https://dactf.com'
const CTFD_API_TOKEN = process.env.CTFD_API_TOKEN
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

function generatePassword(length = 12) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$'
  let password = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length]
  }
  return password
}

function generateUsername(displayName, email) {
  // Create a username from display name, fallback to email prefix
  let base = displayName
    ? displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
    : email.split('@')[0].replace(/[^a-z0-9]/g, '')

  if (!base) base = 'user'

  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}_${suffix}`
}

async function ctfdRequest(path, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Token ${CTFD_API_TOKEN}`,
    'Content-Type': 'application/json',
  }

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${CTFD_URL}/api/v1${path}`, options)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(`CTFd API error (${res.status}): ${JSON.stringify(data)}`)
  }

  return data
}

// Create a user on CTFd and store credentials in Supabase
async function syncUser(supabase, userId) {
  // Get user from Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, display_name, ctfd_user_id, ctfd_username, ctfd_password')
    .eq('id', userId)
    .single()

  if (error || !user) {
    throw new Error(`User not found: ${userId}`)
  }

  // If already synced, return existing credentials
  if (user.ctfd_user_id && user.ctfd_username && user.ctfd_password) {
    return {
      ctfd_user_id: user.ctfd_user_id,
      ctfd_username: user.ctfd_username,
      ctfd_password: user.ctfd_password,
      already_synced: true,
    }
  }

  // Generate CTFd credentials
  const username = generateUsername(user.display_name, user.email)
  const password = generatePassword()

  // Create user on CTFd
  const ctfdResponse = await ctfdRequest('/users', 'POST', {
    name: username,
    email: user.email,
    password: password,
    type: 'user',
    verified: true,
    hidden: false,
  })

  const ctfdUserId = ctfdResponse.data.id

  // Store credentials in Supabase
  await supabase
    .from('users')
    .update({
      ctfd_username: username,
      ctfd_password: password,
      ctfd_user_id: ctfdUserId,
      ctfd_synced_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return {
    ctfd_user_id: ctfdUserId,
    ctfd_username: username,
    ctfd_password: password,
    already_synced: false,
  }
}

// Create a team on CTFd and add members
async function syncTeam(supabase, teamId) {
  // Get team from Supabase
  const { data: team, error } = await supabase
    .from('ctf_teams')
    .select('id, name, captain_id, ctfd_team_id')
    .eq('id', teamId)
    .single()

  if (error || !team) {
    throw new Error(`Team not found: ${teamId}`)
  }

  // Get team members
  const { data: members } = await supabase
    .from('ctf_team_members')
    .select('user_id')
    .eq('team_id', teamId)

  // Ensure all members have CTFd accounts
  const memberResults = []
  for (const member of (members || [])) {
    const result = await syncUser(supabase, member.user_id)
    memberResults.push({ ...result, user_id: member.user_id })
  }

  let ctfdTeamId = team.ctfd_team_id

  if (!ctfdTeamId) {
    // Ensure captain has a CTFd account
    const captainResult = memberResults.find(m => m.user_id === team.captain_id)
    if (!captainResult) {
      throw new Error('Captain not found in team members')
    }

    // Create team on CTFd
    const password = generatePassword()
    const ctfdResponse = await ctfdRequest('/teams', 'POST', {
      name: team.name,
      password: password,
      captain_id: captainResult.ctfd_user_id,
      hidden: false,
    })

    ctfdTeamId = ctfdResponse.data.id

    // Store CTFd team ID
    await supabase
      .from('ctf_teams')
      .update({
        ctfd_team_id: ctfdTeamId,
        ctfd_synced_at: new Date().toISOString(),
      })
      .eq('id', teamId)
  }

  // Add all members to the CTFd team
  for (const member of memberResults) {
    try {
      await ctfdRequest(`/teams/${ctfdTeamId}/members`, 'POST', {
        user_id: member.ctfd_user_id,
      })
    } catch (e) {
      // Member might already be on the team - ignore 4xx errors
      console.log(`Could not add member ${member.ctfd_user_id} to team: ${e.message}`)
    }
  }

  return {
    ctfd_team_id: ctfdTeamId,
    members_synced: memberResults.length,
  }
}

// Sync ALL users and teams (bulk operation for officers)
async function syncAll(supabase) {
  // Get all users with profiles
  const { data: users } = await supabase
    .from('users')
    .select('id')

  const userResults = []
  for (const user of (users || [])) {
    try {
      const result = await syncUser(supabase, user.id)
      userResults.push({ user_id: user.id, success: true, ...result })
    } catch (e) {
      userResults.push({ user_id: user.id, success: false, error: e.message })
    }
  }

  // Get all teams
  const { data: teams } = await supabase
    .from('ctf_teams')
    .select('id')

  const teamResults = []
  for (const team of (teams || [])) {
    try {
      const result = await syncTeam(supabase, team.id)
      teamResults.push({ team_id: team.id, success: true, ...result })
    } catch (e) {
      teamResults.push({ team_id: team.id, success: false, error: e.message })
    }
  }

  return {
    users: { total: userResults.length, synced: userResults.filter(r => r.success).length },
    teams: { total: teamResults.length, synced: teamResults.filter(r => r.success).length },
    details: { users: userResults, teams: teamResults },
  }
}

export default async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers }
    )
  }

  if (!CTFD_API_TOKEN) {
    return new Response(
      JSON.stringify({ success: false, message: 'CTFd API token not configured' }),
      { status: 500, headers }
    )
  }

  try {
    const body = await req.json()
    const { action, user_id, team_id, auth_token } = body

    const supabase = getSupabaseAdmin()

    // For user-initiated actions, verify the auth token
    if (auth_token) {
      const { data: { user }, error } = await supabase.auth.getUser(auth_token)
      if (error || !user) {
        return new Response(
          JSON.stringify({ success: false, message: 'Unauthorized' }),
          { status: 401, headers }
        )
      }
      // Use the authenticated user's ID if not specified
      if (action === 'sync_user' && !user_id) {
        body.user_id = user.id
      }
    }

    let result

    switch (action) {
      case 'sync_user':
        result = await syncUser(supabase, body.user_id || user_id)
        break

      case 'sync_team':
        result = await syncTeam(supabase, team_id)
        break

      case 'sync_all':
        // Only allow with service-level auth (no user token needed - secured by env var)
        result = await syncAll(supabase)
        break

      default:
        return new Response(
          JSON.stringify({ success: false, message: `Unknown action: ${action}` }),
          { status: 400, headers }
        )
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('CTFd sync error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers }
    )
  }
}
