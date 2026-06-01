-- ============================================================
-- ONE-TIME FIX: Repair meetings_public view after removing
-- announcements + photos columns
-- ============================================================
-- Run this entire script in the Supabase SQL Editor if you are
-- seeing "Meeting not found" after the column removal migration.
--
-- This script is idempotent and safe to run multiple times.
-- ============================================================

-- 1. Drop any leftover trigger that references the old columns
DROP TRIGGER IF EXISTS notify_meeting_announcement ON public.meetings;

-- 2. Drop the old announcement notification function (no longer used)
DROP FUNCTION IF EXISTS public.on_meeting_announcement() CASCADE;

-- 3. Force-recreate the public view with ONLY the current columns
DROP VIEW IF EXISTS public.meetings_public;

CREATE VIEW public.meetings_public
WITH (security_invoker = false)
AS
SELECT
    id,
    slug,
    title,
    description,
    date,
    "time",
    location,
    type,
    featured,
    topics,
    resources,                    -- only resources remain
    created_at,
    updated_at,
    registration_type,
    registration_capacity,
    invite_form_url
FROM public.meetings;

-- Re-grant access
GRANT SELECT ON public.meetings_public TO anon;
GRANT SELECT ON public.meetings_public TO authenticated;

COMMENT ON VIEW public.meetings_public IS 
  'Public-facing meetings data. Excludes secret_code and invite_code. (Updated after announcements/photos removal)';

-- 4. Ensure the columns are actually gone (safe if already dropped)
ALTER TABLE public.meetings
  DROP COLUMN IF EXISTS announcements,
  DROP COLUMN IF EXISTS photos;

-- 5. (Optional) Verify the current shape of the view
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'meetings_public' 
-- ORDER BY ordinal_position;

-- ============================================================
-- After running this:
--   - Hard refresh your browser (Cmd/Ctrl + Shift + R)
--   - Try loading a meeting page again
--   - The "Meeting not found" error should be resolved
-- ============================================================