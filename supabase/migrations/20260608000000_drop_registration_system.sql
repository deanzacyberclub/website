-- ============================================================
-- MIGRATION: Drop registration system + featured column
-- Date: 2026-06-08
--
-- Changes:
--   1. Drop `registrations` table
--   2. Drop `featured`, `registration_type`, `registration_capacity`,
--      `invite_code`, `invite_form_url` columns from `meetings`
--   3. Recreate `meetings_public` view without those columns
--   4. Update `verify_meeting_secret_code` to enforce 7-day check-in window
--   5. Update `get_meeting_page_data` — attendees now from `attendance` table
--   6. Update `get_my_dashboard_data` — remove registration data, add has_checked_in
--   7. Update `get_officer_dashboard_stats` — replace registration counts with attendance
--   8. Rebuild officer RPCs without featured / registration params
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Drop functions that reference registrations or featured
--    (CASCADE clears grants + cached plans)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_my_dashboard_data() CASCADE;
DROP FUNCTION IF EXISTS public.get_meeting_page_data(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_officer_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_meetings_for_officers() CASCADE;
DROP FUNCTION IF EXISTS public.get_meeting_with_secrets(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_meeting_for_officers(
  TEXT, TEXT, TEXT, DATE, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, JSONB, TEXT, INTEGER, TEXT, TEXT
) CASCADE;
DROP FUNCTION IF EXISTS public.officer_update_meeting(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB
) CASCADE;
DROP FUNCTION IF EXISTS public.verify_meeting_secret_code(TEXT) CASCADE;

-- ============================================================
-- 2. Drop the public view (depends on meetings columns)
-- ============================================================
DROP VIEW IF EXISTS public.meetings_public;

-- ============================================================
-- 3. Drop the registrations table
-- ============================================================
DROP TABLE IF EXISTS public.registrations CASCADE;

-- ============================================================
-- 4. Drop columns no longer needed on meetings
-- ============================================================
ALTER TABLE public.meetings
  DROP COLUMN IF EXISTS featured,
  DROP COLUMN IF EXISTS registration_type,
  DROP COLUMN IF EXISTS registration_capacity,
  DROP COLUMN IF EXISTS invite_code,
  DROP COLUMN IF EXISTS invite_form_url;

-- ============================================================
-- 5. Recreate meetings_public view (no registration/featured fields)
-- ============================================================
CREATE VIEW public.meetings_public
WITH (security_invoker = false)
AS
SELECT
  id, slug, title, description, date, "time", location,
  topics, resources, created_at, updated_at
FROM public.meetings;

GRANT SELECT ON public.meetings_public TO anon;
GRANT SELECT ON public.meetings_public TO authenticated;

COMMENT ON VIEW public.meetings_public IS
  'Public meeting data. Excludes secret_code. Registration system removed 2026-06-08.';

-- ============================================================
-- 6. verify_meeting_secret_code — now enforces a 7-day window
--    (event date must be within the last 7 days or today)
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_meeting_secret_code(secret_code_input TEXT)
RETURNS TABLE (
  meeting_id   UUID,
  meeting_title    TEXT,
  meeting_date     DATE,
  meeting_time     TEXT,
  meeting_location TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id            AS meeting_id,
    m.title         AS meeting_title,
    m.date          AS meeting_date,
    m."time"        AS meeting_time,
    m.location      AS meeting_location
  FROM meetings m
  WHERE m.secret_code = upper(trim(secret_code_input))
    AND m.date >= CURRENT_DATE - INTERVAL '7 days'
    AND m.date <= CURRENT_DATE + INTERVAL '1 day'
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_meeting_secret_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_meeting_secret_code(TEXT) TO anon;

COMMENT ON FUNCTION public.verify_meeting_secret_code(TEXT) IS
  'Returns meeting info if secret code matches and event is within a 7-day check-in window.';

-- ============================================================
-- 7. get_meeting_page_data — attendees from attendance table,
--    my_attendance replaces my_registration
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_meeting_page_data(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid    := auth.uid();
  v_is_officer   boolean := false;
  v_meeting_row  record;
  v_meeting      jsonb;
  v_my_attendance jsonb   := null;
  v_attendees    jsonb   := '[]'::jsonb;
BEGIN
  IF v_user_id IS NOT NULL THEN
    SELECT public.is_officer(v_user_id) INTO v_is_officer;
  END IF;

  -- Officers see secret_code; everyone else gets null for it
  IF v_is_officer THEN
    SELECT * INTO v_meeting_row FROM meetings WHERE slug = p_slug LIMIT 1;
  ELSE
    SELECT
      id, slug, title, description, date, "time", location,
      topics, resources, created_at, updated_at,
      null::text AS secret_code
    INTO v_meeting_row
    FROM meetings
    WHERE slug = p_slug
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  v_meeting := jsonb_build_object(
    'id',          v_meeting_row.id,
    'slug',        v_meeting_row.slug,
    'title',       v_meeting_row.title,
    'description', v_meeting_row.description,
    'date',        v_meeting_row.date,
    'time',        v_meeting_row."time",
    'location',    v_meeting_row.location,
    'topics',      v_meeting_row.topics,
    'resources',   v_meeting_row.resources,
    'created_at',  v_meeting_row.created_at,
    'updated_at',  v_meeting_row.updated_at,
    'secret_code', CASE WHEN v_is_officer THEN v_meeting_row.secret_code ELSE null END
  );

  -- Current user's check-in record (if any)
  IF v_user_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id',           a.id,
      'checked_in_at', a.checked_in_at
    )
    INTO v_my_attendance
    FROM attendance a
    WHERE a.meeting_id = v_meeting_row.id AND a.user_id = v_user_id
    LIMIT 1;
  END IF;

  -- All attendees with public profile info
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',            a.id,
      'user_id',       a.user_id,
      'checked_in_at', a.checked_in_at,
      'user', jsonb_build_object(
        'id',           u.id,
        'display_name', u.display_name,
        'photo_url',    u.photo_url
      )
    )
    ORDER BY a.checked_in_at DESC
  ), '[]'::jsonb)
  INTO v_attendees
  FROM attendance a
  JOIN users u ON u.id = a.user_id
  WHERE a.meeting_id = v_meeting_row.id;

  RETURN jsonb_build_object(
    'meeting',       v_meeting,
    'my_attendance', v_my_attendance,
    'attendees',     v_attendees,
    'is_officer_view', v_is_officer
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_meeting_page_data(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_meeting_page_data(text) TO anon;

COMMENT ON FUNCTION public.get_meeting_page_data(text) IS
  'Single-call meeting detail payload. Officers receive secret_code. Attendees from attendance table.';

-- ============================================================
-- 8. get_my_dashboard_data — has_checked_in replaces my_registration
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        uuid   := auth.uid();
  v_meetings       jsonb;
  v_attendance_count bigint := 0;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',          m.id,
      'slug',        m.slug,
      'title',       m.title,
      'description', m.description,
      'date',        m.date,
      'time',        m."time",
      'location',    m.location,
      'topics',      m.topics,
      'resources',   m.resources,
      'created_at',  m.created_at,
      'updated_at',  m.updated_at,
      'has_checked_in', CASE
        WHEN v_user_id IS NOT NULL THEN
          EXISTS (SELECT 1 FROM attendance a WHERE a.meeting_id = m.id AND a.user_id = v_user_id)
        ELSE false
      END
    )
    ORDER BY m.date ASC
  ), '[]'::jsonb)
  INTO v_meetings
  FROM meetings m;

  IF v_user_id IS NOT NULL THEN
    SELECT count(*) INTO v_attendance_count
    FROM attendance
    WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'meetings',        v_meetings,
    'attendance_count', v_attendance_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_dashboard_data() TO anon;

COMMENT ON FUNCTION public.get_my_dashboard_data() IS
  'Dashboard payload: meetings with has_checked_in flag + total attendance count.';

-- ============================================================
-- 9. get_officer_dashboard_stats — replace registration with attendance
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_officer_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_is_officer boolean;
  v_today      date := CURRENT_DATE;
  v_stats      jsonb;
  v_recent     jsonb;
BEGIN
  SELECT is_officer INTO v_is_officer FROM users WHERE id = v_user_id;
  IF NOT COALESCE(v_is_officer, false) THEN
    RAISE EXCEPTION 'Access denied: officer role required';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers',       (SELECT count(*) FROM users),
    'totalMeetings',    (SELECT count(*) FROM meetings),
    'upcomingMeetings', (SELECT count(*) FROM meetings WHERE date >= v_today),
    'totalAttendance',  (SELECT count(*) FROM attendance),
    'totalOfficers',    (SELECT count(*) FROM users WHERE is_officer = true),
    'totalTeams',       0
  ) INTO v_stats;

  -- 10 most recent check-ins with embedded public user + meeting info
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',            a.id,
      'user_id',       a.user_id,
      'meeting_id',    a.meeting_id,
      'checked_in_at', a.checked_in_at,
      'user',    jsonb_build_object('display_name', u.display_name, 'photo_url', u.photo_url),
      'meeting', jsonb_build_object('title', m.title, 'slug', m.slug, 'date', m.date)
    )
    ORDER BY a.checked_in_at DESC
  ), '[]'::jsonb)
  INTO v_recent
  FROM attendance a
  JOIN users u ON u.id = a.user_id
  JOIN meetings m ON m.id = a.meeting_id
  LIMIT 10;

  RETURN jsonb_build_object(
    'stats',            v_stats,
    'recentAttendance', v_recent
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_officer_dashboard_stats() TO authenticated;

COMMENT ON FUNCTION public.get_officer_dashboard_stats() IS
  'Officer dashboard stats. Registration counts replaced by attendance counts.';

-- ============================================================
-- 10. Officer meeting RPCs — rebuilt without featured / registration
-- ============================================================

-- get_all_meetings_for_officers
CREATE OR REPLACE FUNCTION public.get_all_meetings_for_officers()
RETURNS TABLE (
  id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
  "time" TEXT, location TEXT,
  topics TEXT[], resources JSONB,
  secret_code TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
    RAISE EXCEPTION 'Access denied: User is not an officer';
  END IF;
  RETURN QUERY
  SELECT m.id, m.slug, m.title, m.description, m.date, m.time, m.location,
         m.topics, m.resources, m.secret_code, m.created_at, m.updated_at
  FROM meetings m ORDER BY m.date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_meetings_for_officers() TO authenticated;

-- get_meeting_with_secrets
CREATE OR REPLACE FUNCTION public.get_meeting_with_secrets(meeting_slug TEXT)
RETURNS TABLE (
  id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
  "time" TEXT, location TEXT,
  topics TEXT[], resources JSONB,
  secret_code TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
    RAISE EXCEPTION 'Access denied: User is not an officer';
  END IF;
  RETURN QUERY
  SELECT m.id, m.slug, m.title, m.description, m.date, m.time, m.location,
         m.topics, m.resources, m.secret_code, m.created_at, m.updated_at
  FROM meetings m WHERE m.slug = meeting_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_meeting_with_secrets(TEXT) TO authenticated;

-- create_meeting_for_officers (no featured, no registration params)
CREATE OR REPLACE FUNCTION public.create_meeting_for_officers(
  p_slug        TEXT,
  p_title       TEXT,
  p_description TEXT,
  p_date        DATE,
  p_time        TEXT,
  p_location    TEXT,
  p_topics      TEXT[],
  p_secret_code TEXT,
  p_resources   JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
  "time" TEXT, location TEXT,
  topics TEXT[], resources JSONB,
  secret_code TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
    RAISE EXCEPTION 'Access denied: User is not an officer';
  END IF;
  RETURN QUERY
  INSERT INTO meetings (slug, title, description, date, time, location, topics, secret_code, resources)
  VALUES (p_slug, p_title, p_description, p_date, p_time, p_location, p_topics, p_secret_code, p_resources)
  RETURNING
    meetings.id, meetings.slug, meetings.title, meetings.description, meetings.date,
    meetings.time, meetings.location,
    meetings.topics, meetings.resources,
    meetings.secret_code,
    meetings.created_at, meetings.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_meeting_for_officers(
  TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT[], TEXT, JSONB
) TO authenticated;

-- officer_update_meeting (no featured, no registration params)
CREATE OR REPLACE FUNCTION public.officer_update_meeting(
  meeting_id    uuid,
  p_slug        text,
  p_title       text,
  p_description text,
  p_date        text,
  p_time        text,
  p_location    text,
  p_topics      text[],
  p_secret_code text,
  p_resources   jsonb
)
RETURNS SETOF meetings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
    RAISE EXCEPTION 'Access denied: User is not an officer';
  END IF;
  RETURN QUERY
  UPDATE meetings SET
    slug        = p_slug,
    title       = p_title,
    description = p_description,
    date        = p_date::date,
    time        = p_time,
    location    = p_location,
    topics      = p_topics,
    secret_code = p_secret_code,
    resources   = p_resources,
    updated_at  = now()
  WHERE id = meeting_id
  RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION public.officer_update_meeting(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, JSONB
) TO authenticated;

COMMIT;
