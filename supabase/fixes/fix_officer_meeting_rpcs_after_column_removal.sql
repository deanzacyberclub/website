-- ============================================================
-- ONE-TIME FIX: Recreate all officer meeting RPCs after
-- removing announcements + photos columns from meetings.
--
-- The previous column removal migration + view fix only repaired
-- the public path. The officer RPCs (SECURITY DEFINER functions)
-- still had the old column references in their bodies or signatures,
-- causing "Meeting not found" (or RPC errors) for signed-in officers.
--
-- Run this entire script in the Supabase SQL Editor (once).
-- It is safe to run multiple times.
-- ============================================================

-- 1. Drop the stale officer meeting functions (CASCADE removes any
--    dependent objects like grants or cached plans).
DROP FUNCTION IF EXISTS public.get_meeting_with_secrets(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.officer_update_meeting(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.create_meeting_for_officers(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, JSONB, TEXT, INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_meetings_for_officers() CASCADE;
DROP FUNCTION IF EXISTS public.delete_meeting_for_officers(UUID) CASCADE;

-- ============================================================
-- 2. Recreate the functions with the CURRENT schema
--    (only resources JSONB remains; no announcements/photos).
--    These definitions are copied from the consolidated setup.sql.
-- ============================================================

-- get_all_meetings_for_officers (used by officer meeting list)
CREATE OR REPLACE FUNCTION get_all_meetings_for_officers()
RETURNS TABLE (
    id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
    "time" TEXT, location TEXT, type TEXT, featured BOOLEAN,
    topics TEXT[], resources JSONB,
    secret_code TEXT, invite_code TEXT,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
    registration_type TEXT, registration_capacity INTEGER, invite_form_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY
    SELECT m.id, m.slug, m.title, m.description, m.date, m.time, m.location,
           m.type, m.featured, m.topics, m.resources,
           m.secret_code, m.invite_code, m.created_at, m.updated_at,
           m.registration_type, m.registration_capacity, m.invite_form_url
    FROM meetings m ORDER BY m.date DESC;
END;
$$;

-- get_meeting_with_secrets (the one called by MeetingDetails when signed in as officer)
CREATE OR REPLACE FUNCTION get_meeting_with_secrets(meeting_slug TEXT)
RETURNS TABLE (
    id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
    "time" TEXT, location TEXT, type TEXT, featured BOOLEAN,
    topics TEXT[], resources JSONB,
    secret_code TEXT, invite_code TEXT,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
    registration_type TEXT, registration_capacity INTEGER, invite_form_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY
    SELECT m.id, m.slug, m.title, m.description, m.date, m.time, m.location,
           m.type, m.featured, m.topics, m.resources,
           m.secret_code, m.invite_code, m.created_at, m.updated_at,
           m.registration_type, m.registration_capacity, m.invite_form_url
    FROM meetings m WHERE m.slug = meeting_slug;
END;
$$;

-- create_meeting_for_officers (used by Meetings.tsx create flow)
CREATE OR REPLACE FUNCTION create_meeting_for_officers(
    p_slug TEXT,
    p_title TEXT,
    p_description TEXT,
    p_date DATE,
    p_time TEXT,
    p_location TEXT,
    p_type TEXT,
    p_featured BOOLEAN,
    p_topics TEXT[],
    p_secret_code TEXT,
    p_resources JSONB DEFAULT '[]'::jsonb,
    p_registration_type TEXT DEFAULT 'open',
    p_registration_capacity INTEGER DEFAULT NULL,
    p_invite_code TEXT DEFAULT NULL,
    p_invite_form_url TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
    "time" TEXT, location TEXT, type TEXT, featured BOOLEAN,
    topics TEXT[], resources JSONB,
    secret_code TEXT, invite_code TEXT,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
    registration_type TEXT, registration_capacity INTEGER, invite_form_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;

    RETURN QUERY
    INSERT INTO meetings (
        slug, title, description, date, time, location, type, featured,
        topics, secret_code, resources,
        registration_type, registration_capacity, invite_code, invite_form_url
    )
    VALUES (
        p_slug, p_title, p_description, p_date, p_time, p_location, p_type, p_featured,
        p_topics, p_secret_code, p_resources,
        p_registration_type, p_registration_capacity, p_invite_code, p_invite_form_url
    )
    RETURNING
        meetings.id, meetings.slug, meetings.title, meetings.description, meetings.date,
        meetings.time, meetings.location, meetings.type, meetings.featured,
        meetings.topics, meetings.resources,
        meetings.secret_code, meetings.invite_code,
        meetings.created_at, meetings.updated_at,
        meetings.registration_type, meetings.registration_capacity, meetings.invite_form_url;
END;
$$;

-- officer_update_meeting (the save path from MeetingDetails edit mode)
CREATE OR REPLACE FUNCTION officer_update_meeting(
  meeting_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_date text,
  p_time text,
  p_location text,
  p_type text,
  p_featured boolean,
  p_topics text[],
  p_secret_code text,
  p_registration_type text,
  p_registration_capacity integer,
  p_invite_code text,
  p_invite_form_url text,
  p_resources jsonb
)
RETURNS SETOF meetings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
    RAISE EXCEPTION 'Access denied: User is not an officer';
  END IF;

  RETURN QUERY
  UPDATE meetings SET
    slug = p_slug,
    title = p_title,
    description = p_description,
    date = p_date::date,
    time = p_time,
    location = p_location,
    type = p_type,
    featured = p_featured,
    topics = p_topics,
    secret_code = p_secret_code,
    registration_type = p_registration_type,
    registration_capacity = p_registration_capacity,
    invite_code = p_invite_code,
    invite_form_url = p_invite_form_url,
    resources = p_resources,
    updated_at = now()
  WHERE id = meeting_id
  RETURNING *;
END;
$$;

-- delete_meeting_for_officers (used from officer meeting list)
CREATE OR REPLACE FUNCTION delete_meeting_for_officers(p_meeting_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;

    DELETE FROM meetings WHERE id = p_meeting_id;
    RETURN FOUND;
END;
$$;

-- ============================================================
-- 3. Re-grant execute rights (the DROP ... CASCADE removes grants)
-- ============================================================

GRANT EXECUTE ON FUNCTION get_all_meetings_for_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_meeting_with_secrets(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_meeting_for_officers(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, JSONB, TEXT, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION officer_update_meeting(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_meeting_for_officers(UUID) TO authenticated;

-- ============================================================
-- After running this script:
--   1. Hard refresh the browser (Cmd/Ctrl + Shift + R)
--   2. Sign in as an officer
--   3. Navigate to a meeting detail page
--   4. The "Meeting not found" error should be gone
--
-- You can also verify with:
--   SELECT proname FROM pg_proc WHERE proname LIKE '%meeting%officer%' OR proname LIKE '%meeting%secret%';
-- ============================================================