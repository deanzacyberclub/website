-- Allow unauthenticated (anon) users to read the meetings table,
-- but hide secret_code and invite_code via column-level privileges.

-- 1. Add SELECT policy for anon: read-only access to all rows
CREATE POLICY "Public can view meetings" ON public.meetings
FOR SELECT
TO anon
USING (true);

-- 2. Revoke broad table-level SELECT from anon, then re-grant only safe columns.
--    This ensures secret_code and invite_code are never returned to unauthenticated users.
REVOKE SELECT ON public.meetings FROM anon;

GRANT SELECT (
    id, slug, title, description, date, "time", location, type,
    featured, topics, announcements, photos, resources,
    created_at, updated_at, registration_type, registration_capacity, invite_form_url
) ON public.meetings TO anon;
