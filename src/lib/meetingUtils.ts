import type { MeetingType, Resource } from '@/types/database.types';

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
  type: MeetingType;
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
  type: 'general',
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

export const TYPE_COLORS: Record<MeetingType, string> = {
  workshop: 'text-hack-cyan border-hack-cyan/50',
  lecture: 'text-hack-yellow border-hack-yellow/50',
  ctf: 'text-hack-red border-hack-red/50',
  social: 'text-purple-400 border-purple-400/50',
  general: 'text-matrix border-matrix/50'
};

export const TYPE_LABELS: Record<MeetingType, string> = {
  workshop: 'WORKSHOP',
  lecture: 'LECTURE',
  ctf: 'CTF',
  social: 'SOCIAL',
  general: 'GENERAL'
};
