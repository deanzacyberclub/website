-- ============================================================
-- Backfill: Standardize all meeting times to 2:30 PM - 4:00 PM
-- Date: 2026-06-03
--
-- This accompanies the UI change in Meetings.tsx / MeetingDetails.tsx
-- which replaces the single free-text "time" input with dedicated
-- Start Time / End Time pickers (<input type="time">). The combined
-- display string is still stored in the existing `time` TEXT column
-- (e.g. "2:30 PM - 4:00 PM") for backward compatibility with all
-- existing queries, RPCs, public views, and display code.
--
-- All *new* meetings created after this will use the picker-driven
-- format and default to the club standard 2:30 PM – 4:00 PM slot.
--
-- Apply via Supabase SQL editor or `supabase db push` / migration.
-- Safe to run multiple times (idempotent for the target value).
-- ============================================================

BEGIN;

-- Backfill every existing row (past, present, future) to the canonical slot.
UPDATE public.meetings
SET
  "time" = '2:30 PM - 4:00 PM',
  updated_at = NOW()
WHERE "time" IS DISTINCT FROM '2:30 PM - 4:00 PM';

-- Optional: if you want to also ensure future meetings that somehow had
-- other values get the standard (the WHERE already covers all):
-- No further action needed.

COMMIT;

-- Post-apply verification (run manually if desired):
-- SELECT id, slug, title, date, "time" FROM public.meetings ORDER BY date DESC;