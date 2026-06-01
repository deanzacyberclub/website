-- ============================================================
-- FIX: Properly remove announcements & photos columns from meetings
-- ============================================================
-- This migration fixes the previous failed attempt that could not drop
-- the columns because of dependent objects (view + trigger).
--
-- Run this migration to clean up the live database.
-- ============================================================

-- 1. Drop the trigger that watches the announcements column
DROP TRIGGER IF EXISTS notify_meeting_announcement ON public.meetings;

-- 2. Drop the function that the trigger depended on
DROP FUNCTION IF EXISTS public.on_meeting_announcement() CASCADE;

-- 3. Recreate the meetings_public view WITHOUT the removed columns
--    (this removes the view's dependency on the columns)
DROP VIEW IF EXISTS public.meetings_public;

CREATE VIEW public.meetings_public
WITH (security_invoker = false)
AS
SELECT
    id, slug, title, description, date, "time", location, type,
    featured, topics, resources,
    created_at, updated_at, registration_type, registration_capacity, invite_form_url
FROM public.meetings;

GRANT SELECT ON public.meetings_public TO anon;
GRANT SELECT ON public.meetings_public TO authenticated;

COMMENT ON VIEW public.meetings_public IS 'Public-facing meetings data (excludes secret_code and invite_code).';

-- 4. Now it is safe to drop the columns
ALTER TABLE public.meetings
  DROP COLUMN IF EXISTS announcements,
  DROP COLUMN IF EXISTS photos;

-- 5. (Optional but recommended) Clean up the old notification function if it still exists
--    from earlier migrations. The one above should have caught it.
DROP FUNCTION IF EXISTS public.on_meeting_announcement() CASCADE;

-- ============================================================
-- After running this migration:
--   - announcements and photos columns are gone
--   - meetings_public view is updated
--   - The announcement notification trigger is removed
--
-- You can now safely re-run or mark the previous migration
-- (20260601200000_remove_meeting_announcements_and_photos.sql) as applied
-- if Supabase migration tracking is complaining.
-- ============================================================