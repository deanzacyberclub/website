-- ============================================================
-- PERFORMANCE OPTIMIZATION: Consolidated RPCs for fast data loading
-- Date: 2026-06-02
--
-- Goals:
--   - Reduce roundtrips from 3-6+ per page load to 1-2
--   - Keep security: all privileged paths use SECURITY DEFINER + explicit officer check
--   - Regular users only ever see what RLS + these functions allow (no emails/student_ids etc)
--
-- Apply this migration on existing databases via Supabase SQL editor or CLI.
-- Fresh installs: setup.sql already includes equivalent definitions at the bottom.
-- ============================================================

-- ============================================================
-- 1. get_my_dashboard_data()
--    Used by Dashboard.tsx
--    Returns meetings (public fields) + current user's registration status + attendance count
--    in a single roundtrip. Massive win for first paint of the most common authed page.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_meetings jsonb;
  v_attendance_count bigint := 0;
BEGIN
  -- Build meetings array with optional my_registration embedded (only for authenticated)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'slug', m.slug,
      'title', m.title,
      'description', m.description,
      'date', m.date,
      'time', m."time",
      'location', m.location,
      'type', m.type,
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

  -- Attendance count (only meaningful for logged-in users)
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
-- Anon can call too (returns public data + zeros)
GRANT EXECUTE ON FUNCTION public.get_my_dashboard_data() TO anon;

COMMENT ON FUNCTION public.get_my_dashboard_data() IS
  'High-performance single-roundtrip fetch for Dashboard. Embeds caller''s registration status per meeting.';

-- ============================================================
-- 2. get_meeting_page_data(p_slug text)
--    The big one for MeetingDetails.tsx
--    Returns in ONE call:
--      - The meeting (public fields, or with secrets if caller is officer)
--      - Current user's registration (if any)
--      - registered + waitlist counts
--      - Up to 3 related meetings of same type
--      - For past events: list of attendees with public profile info (display_name, photo_url)
--    Security: officer-only fields (secret_code, invite_code) are only populated when the
--    SECURITY DEFINER function confirms the caller is an officer.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_meeting_page_data(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Determine officer status once using the canonical helper (used to decide whether to expose secrets)
  IF v_user_id IS NOT NULL THEN
    SELECT public.is_officer(v_user_id) INTO v_is_officer;
  END IF;

  -- Load the core meeting row (officers get secrets via the full meetings table path)
  IF v_is_officer THEN
    SELECT * INTO v_meeting_row
    FROM meetings
    WHERE slug = p_slug
    LIMIT 1;
  ELSE
    -- Non-officers (and anon) get the public projection
    SELECT
      id, slug, title, description, date, "time", location, type,
      featured, topics, resources, created_at, updated_at,
      registration_type, registration_capacity, invite_form_url,
      null::text as secret_code,   -- always hidden
      null::text as invite_code    -- always hidden
    INTO v_meeting_row
    FROM meetings
    WHERE slug = p_slug
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  v_meeting_date := v_meeting_row.date;

  -- Build meeting json (include secrets only for officers)
  v_meeting := jsonb_build_object(
    'id', v_meeting_row.id,
    'slug', v_meeting_row.slug,
    'title', v_meeting_row.title,
    'description', v_meeting_row.description,
    'date', v_meeting_row.date,
    'time', v_meeting_row."time",
    'location', v_meeting_row.location,
    'type', v_meeting_row.type,
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

  -- My registration (only for authenticated users)
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

  -- Counts (publicly useful numbers)
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

  -- Related meetings (same type, exclude self) — public projection is fine
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id, 'slug', slug, 'title', title, 'date', date,
      'time', "time", 'location', location, 'type', type, 'featured', featured
    )
    ORDER BY date DESC
  ), '[]'::jsonb)
  INTO v_related
  FROM meetings
  WHERE type = v_meeting_row.type
    AND slug <> p_slug
  LIMIT 3;

  -- Attendees with public profile info (only expose for past events)
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

COMMENT ON FUNCTION public.get_meeting_page_data(text) IS
  'Single-call meeting detail payload. Officers automatically receive secret_code/invite_code.';

-- ============================================================
-- 3. get_officer_dashboard_stats()
--    Used by Officer.tsx
--    Returns all the stat counts + the 10 most recent registrations
--    with embedded public user + meeting info.
--    Still does officer check for defense-in-depth (even though route is protected).
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_officer_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_officer boolean;
  v_today date := CURRENT_DATE;
  v_stats jsonb;
  v_recent jsonb;
BEGIN
  -- Explicit guard (belt + suspenders)
  SELECT is_officer INTO v_is_officer FROM users WHERE id = v_user_id;
  IF NOT COALESCE(v_is_officer, false) THEN
    RAISE EXCEPTION 'Access denied: officer role required';
  END IF;

  -- Stats in one shot using parallel-friendly subqueries
  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM users),
    'totalMeetings', (SELECT count(*) FROM meetings),
    'upcomingMeetings', (SELECT count(*) FROM meetings WHERE date >= v_today),
    'totalRegistrations', (SELECT count(*) FROM registrations),
    'totalOfficers', (SELECT count(*) FROM users WHERE is_officer = true),
    -- Note: ctf_teams / ctf_team_members removed in 2026; returning 0 for compatibility
    'totalTeams', 0
  ) INTO v_stats;

  -- Recent 10 registrations with embedded minimal public data (no emails here)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'user_id', r.user_id,
      'meeting_id', r.meeting_id,
      'status', r.status,
      'registered_at', r.registered_at,
      'user', jsonb_build_object(
        'display_name', u.display_name,
        'photo_url', u.photo_url
      ),
      'meeting', jsonb_build_object(
        'title', m.title,
        'slug', m.slug,
        'date', m.date
      )
    )
    ORDER BY r.registered_at DESC
  ), '[]'::jsonb)
  INTO v_recent
  FROM registrations r
  JOIN users u ON u.id = r.user_id
  JOIN meetings m ON m.id = r.meeting_id
  LIMIT 10;

  RETURN jsonb_build_object(
    'stats', v_stats,
    'recentRegistrations', v_recent
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_officer_dashboard_stats() TO authenticated;

COMMENT ON FUNCTION public.get_officer_dashboard_stats() IS
  'Fast officer dashboard stats + recent activity. Returns 0 for legacy team counts (feature removed).';

-- ============================================================
-- 4. Lightweight helper: get_my_profile()
--    Can be used by AuthContext in the future for a single clean fetch.
--    Currently AuthContext does direct table select which is also fine due to RLS.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN null;
  END IF;

  SELECT to_jsonb(u.*) - 'email' || jsonb_build_object('email', email) -- keep email for owner
  INTO v_profile
  FROM users u
  WHERE id = v_user_id;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- End of performance migration