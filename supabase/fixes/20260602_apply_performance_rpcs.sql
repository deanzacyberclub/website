-- ============================================================
-- APPLY THIS ON EXISTING DATABASES
-- Performance RPCs for dramatically faster data loading
--
-- Run the entire contents of this file in the Supabase SQL Editor
-- (or via `supabase db push` / migration tool).
--
-- Safe to run multiple times (uses CREATE OR REPLACE).
-- After running:
--   1. Hard refresh your app (Cmd/Ctrl + Shift + R)
--   2. Test Dashboard, a Meeting detail page, and Officer dashboard
-- ============================================================

-- 1. get_my_dashboard_data (used by Dashboard for members)
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
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', m.id, 'slug', m.slug, 'title', m.title, 'description', m.description,
      'date', m.date, 'time', m."time", 'location', m.location, 'type', m.type,
      'featured', m.featured, 'topics', m.topics, 'resources', m.resources,
      'registration_type', m.registration_type, 'registration_capacity', m.registration_capacity,
      'invite_form_url', m.invite_form_url, 'created_at', m.created_at, 'updated_at', m.updated_at,
      'my_registration', (
        SELECT jsonb_build_object('id', r.id, 'status', r.status, 'registered_at', r.registered_at)
        FROM registrations r WHERE r.meeting_id = m.id AND r.user_id = v_user_id LIMIT 1
      )
    ) ORDER BY m.date ASC
  ), '[]'::jsonb) INTO v_meetings FROM meetings m;

  IF v_user_id IS NOT NULL THEN
    SELECT count(*) INTO v_attendance_count FROM attendance WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object('meetings', v_meetings, 'attendance_count', v_attendance_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_dashboard_data() TO authenticated, anon;

-- 2. get_meeting_page_data (the big win for MeetingDetails)
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
  IF v_user_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND is_officer = true) INTO v_is_officer;
  END IF;

  IF v_is_officer THEN
    SELECT * INTO v_meeting_row FROM meetings WHERE slug = p_slug LIMIT 1;
  ELSE
    SELECT id, slug, title, description, date, "time", location, type, featured, topics, resources,
           created_at, updated_at, registration_type, registration_capacity, invite_form_url,
           null::text as secret_code, null::text as invite_code
    INTO v_meeting_row FROM meetings WHERE slug = p_slug LIMIT 1;
  END IF;

  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  v_meeting_date := v_meeting_row.date;

  v_meeting := jsonb_build_object(
    'id', v_meeting_row.id, 'slug', v_meeting_row.slug, 'title', v_meeting_row.title,
    'description', v_meeting_row.description, 'date', v_meeting_row.date, 'time', v_meeting_row."time",
    'location', v_meeting_row.location, 'type', v_meeting_row.type, 'featured', v_meeting_row.featured,
    'topics', v_meeting_row.topics, 'resources', v_meeting_row.resources,
    'registration_type', v_meeting_row.registration_type, 'registration_capacity', v_meeting_row.registration_capacity,
    'invite_form_url', v_meeting_row.invite_form_url, 'created_at', v_meeting_row.created_at, 'updated_at', v_meeting_row.updated_at,
    'secret_code', CASE WHEN v_is_officer THEN v_meeting_row.secret_code ELSE null END,
    'invite_code', CASE WHEN v_is_officer THEN v_meeting_row.invite_code ELSE null END
  );

  IF v_user_id IS NOT NULL THEN
    SELECT jsonb_build_object('id', id, 'status', status, 'registered_at', registered_at, 'invite_code_used', invite_code_used)
    INTO v_my_reg FROM registrations WHERE meeting_id = v_meeting_row.id AND user_id = v_user_id LIMIT 1;
  END IF;

  SELECT count(*)::int INTO v_reg_count FROM registrations WHERE meeting_id = v_meeting_row.id AND status IN ('registered','attended');
  SELECT count(*)::int INTO v_waitlist_count FROM registrations WHERE meeting_id = v_meeting_row.id AND status = 'waitlist';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'slug',slug,'title',title,'date',date,'time',"time",'location',location,'type',type,'featured',featured) ORDER BY date DESC), '[]'::jsonb)
  INTO v_related FROM meetings WHERE type = v_meeting_row.type AND slug <> p_slug LIMIT 3;

  IF v_meeting_date < CURRENT_DATE THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id',r.id,'user_id',r.user_id,'status',r.status,'registered_at',r.registered_at,'user',jsonb_build_object('id',u.id,'display_name',u.display_name,'photo_url',u.photo_url)) ORDER BY r.registered_at DESC), '[]'::jsonb)
    INTO v_attendees FROM registrations r JOIN users u ON u.id = r.user_id
    WHERE r.meeting_id = v_meeting_row.id AND r.status = 'attended';
  END IF;

  RETURN jsonb_build_object(
    'meeting', v_meeting, 'my_registration', v_my_reg,
    'registration_count', v_reg_count, 'waitlist_count', v_waitlist_count,
    'related_meetings', v_related, 'attendees', v_attendees, 'is_officer_view', v_is_officer
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_meeting_page_data(text) TO authenticated, anon;

-- 3. get_officer_dashboard_stats
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
  SELECT is_officer INTO v_is_officer FROM users WHERE id = v_user_id;
  IF NOT COALESCE(v_is_officer, false) THEN
    RAISE EXCEPTION 'Access denied: officer role required';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM users),
    'totalMeetings', (SELECT count(*) FROM meetings),
    'upcomingMeetings', (SELECT count(*) FROM meetings WHERE date >= v_today),
    'totalRegistrations', (SELECT count(*) FROM registrations),
    'totalOfficers', (SELECT count(*) FROM users WHERE is_officer = true),
    'totalTeams', 0
  ) INTO v_stats;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id, 'user_id', r.user_id, 'meeting_id', r.meeting_id, 'status', r.status, 'registered_at', r.registered_at,
    'user', jsonb_build_object('display_name', u.display_name, 'photo_url', u.photo_url),
    'meeting', jsonb_build_object('title', m.title, 'slug', m.slug, 'date', m.date)
  ) ORDER BY r.registered_at DESC), '[]'::jsonb)
  INTO v_recent FROM registrations r JOIN users u ON u.id = r.user_id JOIN meetings m ON m.id = r.meeting_id LIMIT 10;

  RETURN jsonb_build_object('stats', v_stats, 'recentRegistrations', v_recent);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_officer_dashboard_stats() TO authenticated;

-- 4. (Optional) lightweight profile helper
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); BEGIN
  IF v_user_id IS NULL THEN RETURN null; END IF;
  RETURN (SELECT to_jsonb(u) FROM users u WHERE id = v_user_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Done. Verify with:
--   SELECT proname FROM pg_proc WHERE proname LIKE 'get_%dashboard%' OR proname LIKE 'get_meeting_page%';
-- Then hard-refresh the app.