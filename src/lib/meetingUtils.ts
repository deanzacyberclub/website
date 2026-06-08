import type { Meeting, Resource } from '@/types/database.types';

// Discord is the canonical announcement channel.
// We always ensure this resource exists on every meeting.
export const DISCORD_RESOURCE: Resource = {
  id: "discord-default",
  title: "Join Discord",
  url: "https://discord.gg/v5JWDrZVNp",
  type: "link",
};

export function ensureDiscordResource(resources: Resource[]): Resource[] {
  const hasDiscord = resources.some((r) =>
    r.url.includes("discord.gg/v5JWDrZVNp")
  );
  if (hasDiscord) return resources;
  return [DISCORD_RESOURCE, ...resources];
}

export interface CreateMeetingForm {
  slug: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  featured: boolean;
  topics: string;
  secret_code: string;
}

export const defaultCreateForm: CreateMeetingForm = {
  slug: '',
  title: '',
  description: '',
  date: '',
  startTime: '14:30',
  endTime: '16:00',
  location: 'ATC 205',
  featured: false,
  topics: '',
  secret_code: ''
};

// Parse date string as local timezone (not UTC)
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Time range helpers: use 24h for <input type="time">, store as pretty 12h range string "2:30 PM - 4:00 PM"
const formatTo12h = (time24: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

export const formatTimeRange = (start24: string, end24: string): string => {
  if (!start24 || !end24) return '';
  return `${formatTo12h(start24)} - ${formatTo12h(end24)}`;
};

// Helpers for comma-separated topics input + autocomplete from existing tags
export const getCurrentTopicsList = (topicsStr: string): string[] =>
  topicsStr
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

export const getLastTopicPartial = (topicsStr: string): string => {
  const parts = topicsStr.split(',');
  return parts[parts.length - 1].trim().toLowerCase();
};

// ─── Live / time helpers (centralized, used by landing + dashboard for "LIVE" indicators and attendance prompts) ───

/** Parse "2:30 PM - 4:00 PM" (or variants) from meeting.time and return whether now is during the window (with small post-end grace). */
export function isMeetingLive(
  meeting: Pick<Meeting, 'date' | 'time'>,
  now: Date = new Date()
): boolean {
  const eventDate = parseLocalDate(meeting.date);

  // Same calendar day check (robust)
  if (
    eventDate.getFullYear() !== now.getFullYear() ||
    eventDate.getMonth() !== now.getMonth() ||
    eventDate.getDate() !== now.getDate()
  ) {
    return false;
  }

  const timeStr = (meeting.time || '').trim();
  if (!timeStr) return false;

  // Normalize: remove extra spaces, handle common dash variants
  const normalized = timeStr.replace(/\s*[-–—]\s*/g, ' - ').replace(/\s+/g, ' ');

  const parts = normalized.split(' - ');
  if (parts.length !== 2) return false;

  const parseTimeToMinutes = (t: string): number | null => {
    let str = t.trim();
    // Handle common cases like "2:30PM" by inserting space before AM/PM if missing
    str = str.replace(/(\d)(AM|PM)$/i, '$1 $2');
    const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const per = m[3]?.toUpperCase();
    if (per === 'PM' && hh < 12) hh += 12;
    if (per === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  };

  const startMin = parseTimeToMinutes(parts[0]);
  const endMin = parseTimeToMinutes(parts[1]);
  if (startMin === null || endMin === null) return false;

  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Small grace period after end for "just wrapping up"
  return nowMin >= startMin && nowMin <= endMin + 10;
}

/** Returns true if the meeting has fully ended (past date, or same day but past end+grace). */
export function isMeetingPast(
  meeting: Pick<Meeting, 'date' | 'time'>,
  now: Date = new Date()
): boolean {
  const eventDate = parseLocalDate(meeting.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (eventDate < today) return true;
  if (eventDate > today) return false;

  // Same day: check if we're past the event's end time + grace
  const timeStr = (meeting.time || '').trim();
  if (!timeStr) return true; // if no time, treat same-day as not "past" yet? but conservative: allow check-in window

  const normalized = timeStr.replace(/\s*[-–—]\s*/g, ' - ').replace(/\s+/g, ' ');
  const parts = normalized.split(' - ');
  if (parts.length !== 2) return true;

  const parseTimeToMinutes = (t: string): number | null => {
    let str = t.trim();
    str = str.replace(/(\d)(AM|PM)$/i, '$1 $2');
    const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const per = m[3]?.toUpperCase();
    if (per === 'PM' && hh < 12) hh += 12;
    if (per === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  };

  const endMin = parseTimeToMinutes(parts[1]);
  if (endMin === null) return true;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin > endMin + 10;
}
