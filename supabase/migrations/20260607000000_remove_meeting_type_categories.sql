-- ============================================================
-- MIGRATION: Remove meeting type / category system
-- Date: 2026-06-07
--
-- Meetings no longer have a "type" (workshop / lecture / ctf /
-- social / general). This migration removes:
--   - meetings.type column (+ its CHECK constraint)
--   - notification_preferences.category_subscriptions (category-
--     based push subscriptions are meaningless without types)
-- and rebuilds every DB object that referenced meetings.type:
--   - meetings_public view
--   - on_new_meeting() notification trigger function
--   - get_my_dashboard_data()        (jsonb)
--   - get_meeting_page_data(text)     (jsonb)
--   - get_all_meetings_for_officers()
--   - get_meeting_with_secrets(text)
--   - create_meeting_for_officers(...)  (drops p_type param)
--   - officer_update_meeting(...)       (drops p_type param)
--
-- Idempotent and safe to run multiple times.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Drop the public view (hard dependency on meetings.type)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS public.meetings_public;

-- ------------------------------------------------------------
-- 2. Drop the officer RPCs whose signatures / return shapes
--    reference type (CASCADE clears grants + cached plans).
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_all_meetings_for_officers() CASCADE;
DROP FUNCTION IF EXISTS public.get_meeting_with_secrets(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_meeting_for_officers(
  TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, JSONB, TEXT, INTEGER, TEXT, TEXT
) CASCADE;
DROP FUNCTION IF EXISTS public.officer_update_meeting(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB
) CASCADE;

-- ------------------------------------------------------------
-- 3. Drop the columns
-- ------------------------------------------------------------
ALTER TABLE public.meetings
  DROP COLUMN IF EXISTS type;

ALTER TABLE public.notification_preferences
  DROP COLUMN IF EXISTS category_subscriptions;

-- ------------------------------------------------------------
-- 4. Recreate the public view without type
-- ------------------------------------------------------------
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
    featured,
    topics,
    resources,
    created_at,
    updated_at,
    registration_type,
    registration_capacity,
    invite_form_url
FROM public.meetings;

GRANT SELECT ON public.meetings_public TO anon;
GRANT SELECT ON public.meetings_public TO authenticated;

COMMENT ON VIEW public.meetings_public IS
  'Public-facing meetings data. Excludes secret_code and invite_code. (type/category removed 2026-06-07)';

-- ------------------------------------------------------------
-- 5. New-meeting push notification trigger (no type)
--    Previously matched on category_subscriptions / titled by type.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_new_meeting()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients UUID[];
BEGIN
  SELECT array_agg(DISTINCT np.user_id) INTO v_recipients
  FROM public.notification_preferences np
  WHERE
    np.any_events = true
    OR EXISTS (
      SELECT 1 FROM unnest(np.keyword_subscriptions) AS kw
      WHERE NEW.title ILIKE '%' || kw || '%'
         OR NEW.description ILIKE '%' || kw || '%'
         OR EXISTS (SELECT 1 FROM unnest(NEW.topics) AS topic WHERE topic ILIKE '%' || kw || '%')
    );

  IF v_recipients IS NOT NULL THEN
    PERFORM public.invoke_send_push_notification(
      v_recipients,
      'New Meeting: ' || NEW.title,
      NEW.date || ' · ' || NEW.location,
      jsonb_build_object('meetingId', NEW.id::text, 'type', 'new_meeting')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_new_meeting ON public.meetings;
CREATE TRIGGER notify_new_meeting AFTER INSERT ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.on_new_meeting();

-- ------------------------------------------------------------
-- 6. get_my_dashboard_data() — drop the 'type' key
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_meetings jsonb;
  v_attendance_count bigint := 0;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'slug', m.slug,
      'title', m.title,
      'description', m.description,
      'date', m.date,
      'time', m."time",
      'location', m.location,
      'featured', m.featured,
      'topics', m.topics,
      'resources', m.resources,
      'registration_type', m.registration_type,
      'registration_capacity', m.registration_capacity,
      'invite_form_url', m.invite_form_url,
      'created_at', m.created_at,
      'updated_at', m.updated_at,
      'my_registration', (
        SELECT jsonb_build_object(
          'id', r.id,
          'status', r.status,
          'registered_at', r.registered_at
        )
        FROM registrations r
        WHERE r.meeting_id = m.id AND r.user_id = v_user_id
        LIMIT 1
      )
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
    'meetings', v_meetings,
    'attendance_count', v_attendance_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_dashboard_data() TO anon;

-- ------------------------------------------------------------
-- 7. get_meeting_page_data(text) — drop 'type'; related events
--    are now the most recent other meetings (no type matching).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_meeting_page_data(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_officer boolean := false;
  v_meeting_row record;
  v_meeting jsonb;
  v_my_reg jsonb := null;
  v_reg_count int := 0;
  v_waitlist_count int := 0;
  v_related jsonb := '[]'::jsonb;
  v_attendees jsonb := '[]'::jsonb;
  v_meeting_date date;
BEGIN
  IF v_user_id IS NOT NULL THEN
    SELECT public.is_officer(v_user_id) INTO v_is_officer;
  END IF;

  IF v_is_officer THEN
    SELECT * INTO v_meeting_row
    FROM meetings
    WHERE slug = p_slug
    LIMIT 1;
  ELSE
    SELECT
      id, slug, title, description, date, "time", location,
      featured, topics, resources, created_at, updated_at,
      registration_type, registration_capacity, invite_form_url,
      null::text as secret_code,
      null::text as invite_code
    INTO v_meeting_row
    FROM meetings
    WHERE slug = p_slug
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  v_meeting_date := v_meeting_row.date;

  v_meeting := jsonb_build_object(
    'id', v_meeting_row.id,
    'slug', v_meeting_row.slug,
    'title', v_meeting_row.title,
    'description', v_meeting_row.description,
    'date', v_meeting_row.date,
    'time', v_meeting_row."time",
    'location', v_meeting_row.location,
    'featured', v_meeting_row.featured,
    'topics', v_meeting_row.topics,
    'resources', v_meeting_row.resources,
    'registration_type', v_meeting_row.registration_type,
    'registration_capacity', v_meeting_row.registration_capacity,
    'invite_form_url', v_meeting_row.invite_form_url,
    'created_at', v_meeting_row.created_at,
    'updated_at', v_meeting_row.updated_at,
    'secret_code', CASE WHEN v_is_officer THEN v_meeting_row.secret_code ELSE null END,
    'invite_code', CASE WHEN v_is_officer THEN v_meeting_row.invite_code ELSE null END
  );

  IF v_user_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', id,
      'status', status,
      'registered_at', registered_at,
      'invite_code_used', invite_code_used
    )
    INTO v_my_reg
    FROM registrations
    WHERE meeting_id = v_meeting_row.id AND user_id = v_user_id
    LIMIT 1;
  END IF;

  SELECT count(*)::int
  INTO v_reg_count
  FROM registrations
  WHERE meeting_id = v_meeting_row.id
    AND status IN ('registered', 'attended');

  SELECT count(*)::int
  INTO v_waitlist_count
  FROM registrations
  WHERE meeting_id = v_meeting_row.id
    AND status = 'waitlist';

  -- Related meetings: most recent other meetings (type matching removed)
  SELECT COALESCE(jsonb_agg(rel ORDER BY rel_date DESC), '[]'::jsonb)
  INTO v_related
  FROM (
    SELECT
      jsonb_build_object(
        'id', id, 'slug', slug, 'title', title, 'date', date,
        'time', "time", 'location', location, 'featured', featured
      ) AS rel,
      date AS rel_date
    FROM meetings
    WHERE slug <> p_slug
    ORDER BY date DESC
    LIMIT 3
  ) sub;

  IF v_meeting_date < CURRENT_DATE THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'user_id', r.user_id,
        'status', r.status,
        'registered_at', r.registered_at,
        'user', jsonb_build_object(
          'id', u.id,
          'display_name', u.display_name,
          'photo_url', u.photo_url
        )
      )
      ORDER BY r.registered_at DESC
    ), '[]'::jsonb)
    INTO v_attendees
    FROM registrations r
    JOIN users u ON u.id = r.user_id
    WHERE r.meeting_id = v_meeting_row.id
      AND r.status = 'attended';
  END IF;

  RETURN jsonb_build_object(
    'meeting', v_meeting,
    'my_registration', v_my_reg,
    'registration_count', v_reg_count,
    'waitlist_count', v_waitlist_count,
    'related_meetings', v_related,
    'attendees', v_attendees,
    'is_officer_view', v_is_officer
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_meeting_page_data(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_meeting_page_data(text) TO anon;

-- ------------------------------------------------------------
-- 8. Officer meeting RPCs (rebuilt without type)
-- ------------------------------------------------------------

-- get_all_meetings_for_officers
CREATE OR REPLACE FUNCTION public.get_all_meetings_for_officers()
RETURNS TABLE (
    id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
    "time" TEXT, location TEXT, featured BOOLEAN,
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
           m.featured, m.topics, m.resources,
           m.secret_code, m.invite_code, m.created_at, m.updated_at,
           m.registration_type, m.registration_capacity, m.invite_form_url
    FROM meetings m ORDER BY m.date DESC;
END;
$$;

-- get_meeting_with_secrets
CREATE OR REPLACE FUNCTION public.get_meeting_with_secrets(meeting_slug TEXT)
RETURNS TABLE (
    id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
    "time" TEXT, location TEXT, featured BOOLEAN,
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
           m.featured, m.topics, m.resources,
           m.secret_code, m.invite_code, m.created_at, m.updated_at,
           m.registration_type, m.registration_capacity, m.invite_form_url
    FROM meetings m WHERE m.slug = meeting_slug;
END;
$$;

-- create_meeting_for_officers (p_type removed)
CREATE OR REPLACE FUNCTION public.create_meeting_for_officers(
    p_slug TEXT,
    p_title TEXT,
    p_description TEXT,
    p_date DATE,
    p_time TEXT,
    p_location TEXT,
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
    "time" TEXT, location TEXT, featured BOOLEAN,
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
        slug, title, description, date, time, location, featured,
        topics, secret_code, resources,
        registration_type, registration_capacity, invite_code, invite_form_url
    )
    VALUES (
        p_slug, p_title, p_description, p_date, p_time, p_location, p_featured,
        p_topics, p_secret_code, p_resources,
        p_registration_type, p_registration_capacity, p_invite_code, p_invite_form_url
    )
    RETURNING
        meetings.id, meetings.slug, meetings.title, meetings.description, meetings.date,
        meetings.time, meetings.location, meetings.featured,
        meetings.topics, meetings.resources,
        meetings.secret_code, meetings.invite_code,
        meetings.created_at, meetings.updated_at,
        meetings.registration_type, meetings.registration_capacity, meetings.invite_form_url;
END;
$$;

-- officer_update_meeting (p_type removed)
CREATE OR REPLACE FUNCTION public.officer_update_meeting(
  meeting_id uuid,
  p_slug text,
  p_title text,
  p_description text,
  p_date text,
  p_time text,
  p_location text,
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

-- Re-grant execute (DROP ... CASCADE removed the old grants)
GRANT EXECUTE ON FUNCTION public.get_all_meetings_for_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_meeting_with_secrets(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_meeting_for_officers(
  TEXT, TEXT, TEXT, DATE, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, JSONB, TEXT, INTEGER, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.officer_update_meeting(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB
) TO authenticated;

COMMIT;
