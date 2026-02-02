import { supabase } from './supabase'
import type { Meeting, Registration, RegistrationStatus } from '@/types/database.types'

export interface RegistrationResult {
  success: boolean
  message: string
  registration?: Registration
  error?: string
}

/**
 * Get registration count for a meeting
 */
export async function getRegistrationCount(meetingId: string): Promise<number> {
  const { count } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', meetingId)
    .in('status', ['registered', 'attended'])

  return count || 0
}

/**
 * Get waitlist count for a meeting
 */
export async function getWaitlistCount(meetingId: string): Promise<number> {
  const { count } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', meetingId)
    .eq('status', 'waitlist')

  return count || 0
}

/**
 * Get user's registration for a meeting
 */
export async function getUserRegistration(
  meetingId: string,
  userId: string
): Promise<Registration | null> {
  const { data } = await supabase
    .from('registrations')
    .select('*')
    .eq('meeting_id', meetingId)
    .eq('user_id', userId)
    .single()

  return data
}

/**
 * Check if meeting is at capacity
 */
export async function isMeetingAtCapacity(meeting: Meeting): Promise<boolean> {
  if (!meeting.registration_capacity) return false

  const count = await getRegistrationCount(meeting.id)
  return count >= meeting.registration_capacity
}

/**
 * Register user for a meeting
 */
export async function registerForMeeting(
  meetingId: string,
  userId: string,
  meeting: Meeting,
  inviteCode?: string
): Promise<RegistrationResult> {
  try {
    // Check if user is already registered
    const existing = await getUserRegistration(meetingId, userId)
    if (existing && existing.status !== 'cancelled') {
      return {
        success: false,
        message: 'You are already registered for this event',
        registration: existing,
      }
    }

    // Check if event is invite-only and validate invite code
    if (meeting.registration_type === 'invite_only') {
      if (!inviteCode) {
        return {
          success: false,
          message: 'This event requires an invite code',
        }
      }

      if (inviteCode.toLowerCase() !== meeting.invite_code?.toLowerCase()) {
        return {
          success: false,
          message: 'Invalid invite code',
        }
      }
    }

    // Check if event is closed
    if (meeting.registration_type === 'closed') {
      return {
        success: false,
        message: 'Registration is closed for this event',
      }
    }

    // Check if meeting is in the past (parse date as local timezone)
    const [year, month, day] = meeting.date.split('-').map(Number)
    const meetingDate = new Date(year, month - 1, day)
    meetingDate.setHours(23, 59, 59, 999) // Allow registration until end of day
    const isPast = meetingDate < new Date()
    if (isPast) {
      return {
        success: false,
        message: 'Cannot register for past events',
      }
    }

    // Check capacity and determine status
    const atCapacity = await isMeetingAtCapacity(meeting)
    const status: RegistrationStatus = atCapacity ? 'waitlist' : 'registered'

    // If user had a previous cancelled registration, update it instead of creating new one
    if (existing && existing.status === 'cancelled') {
      const { data, error } = await supabase
        .from('registrations')
        .update({
          status,
          invite_code_used: inviteCode || null,
          registered_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          message: 'Failed to register for event',
          error: error.message,
        }
      }

      return {
        success: true,
        message:
          status === 'waitlist'
            ? 'You have been added to the waitlist'
            : 'Successfully registered for event',
        registration: data,
      }
    }

    // Create new registration
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        meeting_id: meetingId,
        user_id: userId,
        status,
        invite_code_used: inviteCode || null,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        message: 'Failed to register for event',
        error: error.message,
      }
    }

    return {
      success: true,
      message:
        status === 'waitlist'
          ? 'You have been added to the waitlist'
          : 'Successfully registered for event',
      registration: data,
    }
  } catch (err) {
    return {
      success: false,
      message: 'An error occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Cancel registration for a meeting
 */
export async function cancelRegistration(
  meetingId: string,
  userId: string
): Promise<RegistrationResult> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('meeting_id', meetingId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        message: 'Failed to cancel registration',
        error: error.message,
      }
    }

    // If user was on waitlist and cancelled, promote next person from waitlist
    if (data.status === 'waitlist') {
      await promoteFromWaitlist(meetingId)
    }

    return {
      success: true,
      message: 'Registration cancelled',
      registration: data,
    }
  } catch (err) {
    return {
      success: false,
      message: 'An error occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Promote next person from waitlist to registered
 */
async function promoteFromWaitlist(meetingId: string): Promise<void> {
  // Get the first person on the waitlist
  const { data: waitlistUser } = await supabase
    .from('registrations')
    .select('*')
    .eq('meeting_id', meetingId)
    .eq('status', 'waitlist')
    .order('registered_at', { ascending: true })
    .limit(1)
    .single()

  if (waitlistUser) {
    await supabase
      .from('registrations')
      .update({ status: 'registered' })
      .eq('id', waitlistUser.id)
  }
}

/**
 * Create invite for user (officers only)
 */
export async function createInvite(
  meetingId: string,
  userId: string
): Promise<RegistrationResult> {
  try {
    // Check if user is already registered
    const existing = await getUserRegistration(meetingId, userId)
    if (existing) {
      return {
        success: false,
        message: 'User already has a registration',
        registration: existing,
      }
    }

    const { data, error } = await supabase
      .from('registrations')
      .insert({
        meeting_id: meetingId,
        user_id: userId,
        status: 'invited',
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        message: 'Failed to create invite',
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Invite created',
      registration: data,
    }
  } catch (err) {
    return {
      success: false,
      message: 'An error occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
