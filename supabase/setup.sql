-- ============================================================
-- DE ANZA CYBERSECURITY CLUB - DATABASE SETUP (CONSOLIDATED)
-- ============================================================
-- This file is the single source of truth for the complete database schema.
--
-- All historical migrations have been folded directly into this file.
-- The supabase/migrations/ folder has been removed.
--
-- Run order for a fresh database:
--   1. supabase/setup.sql
--   2. supabase/seed.sql
--   3. supabase/curriculum.sql
--
-- Last consolidated: 2026 (migrations up to 20260427 + notification + security lockdown)
-- ============================================================

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    student_id TEXT,
    photo_url TEXT,
    linked_accounts JSONB DEFAULT '[]'::jsonb,
    is_officer BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Locked-down UPDATE policy: users cannot promote/demote themselves as officers
-- (from 20260209_lockdown_meetings_security.sql)
CREATE POLICY "Users can update own profile (not officer status)" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    is_officer = (SELECT is_officer FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Users can delete own profile" ON public.users FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- STORAGE BUCKET FOR PROFILE PICTURES
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view profile pictures" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');
CREATE POLICY "Users can upload own profile picture" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own profile picture" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own profile picture" ON storage.objects FOR DELETE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- MEETINGS TABLE (with final locked-down security model)
-- ============================================================
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('workshop', 'lecture', 'ctf', 'social', 'general')),
    featured BOOLEAN DEFAULT false,
    topics TEXT[] DEFAULT '{}',
    resources JSONB DEFAULT '[]'::jsonb,
    secret_code TEXT,
    registration_type TEXT NOT NULL DEFAULT 'open' CHECK (registration_type IN ('open', 'invite_only', 'closed')),
    registration_capacity INTEGER,
    invite_code TEXT,
    invite_form_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX meetings_slug_idx ON public.meetings(slug);
CREATE INDEX IF NOT EXISTS meetings_secret_code_idx ON public.meetings(secret_code);

-- Unique constraint on secret_code (from 20240203_unique_secret_code.sql)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meetings_secret_code_unique' 
          AND conrelid = 'public.meetings'::regclass
    ) THEN
        ALTER TABLE public.meetings
        ADD CONSTRAINT meetings_secret_code_unique UNIQUE (secret_code);
    END IF;
END $$;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- FINAL SECURITY MODEL (from 20260209_lockdown + 20260427):
-- - Officers can only SELECT directly (no INSERT/UPDATE/DELETE on the table).
-- - All modifications MUST go through SECURITY DEFINER RPC functions.
-- - Public (anon) can read via limited column privileges (secret_code and invite_code hidden).

-- Officers can view meetings (contains secret_code)
CREATE POLICY "Officers can view meetings" ON public.meetings
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

-- Public read-only access (anon) — combined with column-level GRANT below to hide secrets
CREATE POLICY "Public can view meetings" ON public.meetings
FOR SELECT TO anon USING (true);

-- Revoke broad SELECT from anon, then grant only safe columns (hides secret_code/invite_code)
REVOKE SELECT ON public.meetings FROM anon;
GRANT SELECT (
    id, slug, title, description, date, "time", location, type,
    featured, topics, announcements, photos, resources,
    created_at, updated_at, registration_type, registration_capacity, invite_form_url
) ON public.meetings TO anon;

-- ============================================================
-- MEETINGS PUBLIC VIEW (excludes secret_code and invite_code)
-- ============================================================
CREATE OR REPLACE VIEW public.meetings_public
WITH (security_invoker = false)
AS
SELECT
    id, slug, title, description, date, "time", location, type,
    featured, topics, resources,
    created_at, updated_at, registration_type, registration_capacity, invite_form_url
FROM public.meetings;

GRANT SELECT ON public.meetings_public TO anon;
GRANT SELECT ON public.meetings_public TO authenticated;

COMMENT ON VIEW public.meetings_public IS 'Public-facing meetings data that excludes secret_code and invite_code.';

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, user_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Final attendance policies (from 20260209_fix_attendance_permissions + APPLY_THIS_FIX)
CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Officers can view all attendance" ON public.attendance FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance" ON public.attendance FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- REGISTRATIONS TABLE
-- ============================================================
CREATE TABLE public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('registered', 'waitlist', 'invited', 'attended', 'cancelled')),
    invite_code_used TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_registrations_meeting_id ON public.registrations(meeting_id);
CREATE INDEX idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations" ON public.registrations FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);
CREATE POLICY "Users can insert own registrations" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own registrations" ON public.registrations FOR UPDATE USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);
CREATE POLICY "Users can delete own registrations" ON public.registrations FOR DELETE USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION update_registrations_updated_at();

-- Trigger to mark registration attended when attendance is recorded
CREATE OR REPLACE FUNCTION mark_registration_attended()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.registrations
    SET status = 'attended', updated_at = NOW()
    WHERE meeting_id = NEW.meeting_id
      AND user_id = NEW.user_id
      AND status IN ('registered', 'waitlist', 'invited');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_marks_registration_attended
AFTER INSERT ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION mark_registration_attended();

-- ============================================================
-- PUBLIC PROFILES VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, display_name, photo_url
FROM public.users;

GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

COMMENT ON VIEW public.public_profiles IS 'Public-facing user profile data for leaderboards and registration displays';

-- ============================================================
-- CTF CHALLENGES (from 20260205_ctf_challenges_rls.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS ctf_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 100,
    hint TEXT,
    flag TEXT NOT NULL,
    solution TEXT,
    author TEXT,
    files JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ctf_challenges ENABLE ROW LEVEL SECURITY;

-- Officer-only RLS (challenges contain flags/solutions)
CREATE POLICY "Officers can view all challenges" ON ctf_challenges FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true)
);
CREATE POLICY "Officers can insert challenges" ON ctf_challenges FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true)
);
CREATE POLICY "Officers can update challenges" ON ctf_challenges FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true)
);
CREATE POLICY "Officers can delete challenges" ON ctf_challenges FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true)
);

-- Public view that excludes sensitive fields
DROP VIEW IF EXISTS ctf_challenges_public;
CREATE VIEW ctf_challenges_public AS
SELECT id, title, description, category, difficulty, points, hint, author, files, is_active, created_at, updated_at
FROM ctf_challenges
WHERE is_active = true;

GRANT SELECT ON ctf_challenges_public TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_ctf_challenges_category ON ctf_challenges(category);
CREATE INDEX IF NOT EXISTS idx_ctf_challenges_difficulty ON ctf_challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_ctf_challenges_is_active ON ctf_challenges(is_active);

-- ============================================================
-- MEETING AUDIT LOG + TRIGGER (from 20260209_lockdown_meetings_security.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB
);

ALTER TABLE meeting_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can view audit logs" ON meeting_audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true)
);

CREATE OR REPLACE FUNCTION log_meeting_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO meeting_audit_log (meeting_id, action, changed_by, new_data)
        VALUES (NEW.id, 'created', auth.uid(), to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO meeting_audit_log (meeting_id, action, changed_by, old_data, new_data)
        VALUES (NEW.id, 'updated', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO meeting_audit_log (meeting_id, action, changed_by, old_data)
        VALUES (OLD.id, 'deleted', auth.uid(), to_jsonb(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS meeting_audit_trigger ON meetings;
CREATE TRIGGER meeting_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON meetings
FOR EACH ROW EXECUTE FUNCTION log_meeting_changes();

-- ============================================================
-- NOTIFICATIONS INFRASTRUCTURE (from 20260408 + 20260409 + 20260411)
-- ============================================================

-- device_tokens
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_tokens: users manage own" ON public.device_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "device_tokens: officers read all" ON public.device_tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

-- notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                     UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  any_events             BOOLEAN     NOT NULL DEFAULT false,
  category_subscriptions TEXT[]      NOT NULL DEFAULT '{}',
  keyword_subscriptions  TEXT[]      NOT NULL DEFAULT '{}',
  event_announcements    BOOLEAN     NOT NULL DEFAULT true,
  registration_updates   BOOLEAN     NOT NULL DEFAULT true,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences: users manage own" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notifications (inbox records)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'new_meeting',
  meeting_id UUID        REFERENCES public.meetings(id) ON DELETE SET NULL,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx  ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx     ON public.notifications (user_id, read) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: users read own"   ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications: users mark read"  ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications: users delete own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Helper: updated_at trigger function (used by device_tokens + notification_preferences)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER device_tokens_updated_at BEFORE UPDATE ON public.device_tokens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- club_announcements
CREATE TABLE public.club_announcements (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT        NOT NULL,
    body        TEXT        NOT NULL,
    severity    TEXT        NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_by  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ
);

CREATE INDEX idx_club_announcements_active  ON public.club_announcements(is_active);
CREATE INDEX idx_club_announcements_created ON public.club_announcements(created_at DESC);

ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements" ON public.club_announcements FOR SELECT TO anon, authenticated USING (
    is_active = true AND (expires_at IS NULL OR expires_at > NOW())
);

CREATE POLICY "Officers can manage announcements" ON public.club_announcements FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

GRANT SELECT ON public.club_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_announcements TO authenticated;

-- ============================================================
-- OFFICER RPC FUNCTIONS (consolidated from original + migrations)
-- ============================================================

-- Core officer lookup functions (already present, kept for completeness)
CREATE OR REPLACE FUNCTION get_user_profiles_for_officers(user_ids UUID[])
RETURNS TABLE (id UUID, display_name TEXT, photo_url TEXT, email TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.photo_url, u.email FROM users u WHERE u.id = ANY(user_ids);
END;
$$;

CREATE OR REPLACE FUNCTION get_all_users_for_officers()
RETURNS TABLE (id UUID, display_name TEXT, email TEXT, photo_url TEXT, is_officer BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.email, u.photo_url, u.is_officer, u.created_at FROM users u ORDER BY u.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION toggle_officer_status(target_user_id UUID, new_status BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    IF target_user_id = auth.uid() AND new_status = false THEN
        RAISE EXCEPTION 'Cannot remove your own officer status';
    END IF;
    UPDATE users SET is_officer = new_status WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_details_for_officers(target_user_id UUID)
RETURNS TABLE (id UUID, display_name TEXT, email TEXT, photo_url TEXT, student_id TEXT, is_officer BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.email, u.photo_url, u.student_id, u.is_officer, u.created_at FROM users u WHERE u.id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION verify_officer_status()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true);
END;
$$;

-- Meeting RPCs (from 20260209 migrations + 20260427)
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

-- Actively used create function (called from Meetings.tsx)
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

-- Actively used update function (called from MeetingDetails.tsx as officer_update_meeting)
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

-- Secure delete (from lockdown migration)
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

-- Attendance secret code verifier (used by check-in flow)
CREATE OR REPLACE FUNCTION verify_meeting_secret_code(secret_code_input TEXT)
RETURNS TABLE (meeting_id UUID, meeting_title TEXT, meeting_date DATE, meeting_time TEXT, meeting_location TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT id, title, date, time, location
    FROM meetings
    WHERE UPPER(secret_code) = UPPER(secret_code_input)
      AND secret_code IS NOT NULL
    LIMIT 1;
END;
$$;

-- ============================================================
-- NOTIFICATION TRIGGER FUNCTIONS + INVOKER (from 20260408)
-- ============================================================
CREATE OR REPLACE FUNCTION public.invoke_send_push_notification(
  p_user_ids UUID[],
  p_title    TEXT,
  p_body     TEXT,
  p_data     JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_service_key TEXT;
  v_url         TEXT := 'https://yhwpaclstjhylrphdrae.supabase.co/functions/v1/send-push-notification';
BEGIN
  IF array_length(p_user_ids, 1) IS NULL THEN RETURN; END IF;

  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_service_role_key'
  LIMIT 1;

  IF v_service_key IS NULL THEN RETURN; END IF;

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body    := jsonb_build_object(
      'userIds', to_jsonb(p_user_ids),
      'title',   p_title,
      'body',    p_body,
      'data',    p_data
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.on_new_meeting()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients UUID[];
BEGIN
  SELECT array_agg(DISTINCT np.user_id) INTO v_recipients
  FROM public.notification_preferences np
  WHERE
    np.any_events = true
    OR NEW.type = ANY(np.category_subscriptions)
    OR EXISTS (
      SELECT 1 FROM unnest(np.keyword_subscriptions) AS kw
      WHERE NEW.title ILIKE '%' || kw || '%'
         OR NEW.description ILIKE '%' || kw || '%'
         OR EXISTS (SELECT 1 FROM unnest(NEW.topics) AS topic WHERE topic ILIKE '%' || kw || '%')
    );

  IF v_recipients IS NOT NULL THEN
    PERFORM public.invoke_send_push_notification(
      v_recipients,
      'New ' || initcap(NEW.type) || ': ' || NEW.title,
      NEW.date || ' · ' || NEW.location,
      jsonb_build_object('meetingId', NEW.id::text, 'type', 'new_meeting')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_new_meeting ON public.meetings;
CREATE TRIGGER notify_new_meeting AFTER INSERT ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.on_new_meeting();

CREATE OR REPLACE FUNCTION public.on_registration_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_meeting public.meetings%ROWTYPE; v_prefs public.notification_preferences%ROWTYPE; v_title TEXT; v_body TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('registered', 'invited') THEN RETURN NEW; END IF;

  SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = NEW.user_id;
  IF NOT FOUND OR NOT v_prefs.registration_updates THEN RETURN NEW; END IF;

  SELECT * INTO v_meeting FROM public.meetings WHERE id = NEW.meeting_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.status = 'registered' AND OLD.status = 'waitlist' THEN
    v_title := 'You''re in! 🎉';
    v_body  := 'Your waitlist spot for "' || v_meeting.title || '" is now confirmed.';
  ELSIF NEW.status = 'invited' THEN
    v_title := 'You''ve been invited!';
    v_body  := 'You received a special invite to "' || v_meeting.title || '".';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.invoke_send_push_notification(
    ARRAY[NEW.user_id],
    v_title, v_body,
    jsonb_build_object('meetingId', NEW.meeting_id::text, 'type', 'registration_update')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_registration_status ON public.registrations;
CREATE TRIGGER notify_registration_status AFTER UPDATE OF status ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.on_registration_status_change();

-- ============================================================
-- FINAL GRANTS FOR RPC FUNCTIONS
-- ============================================================
-- These allow the frontend (authenticated users + anon where appropriate) to call the functions.
-- Authorization logic lives inside each SECURITY DEFINER function.

GRANT EXECUTE ON FUNCTION verify_meeting_secret_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_meeting_secret_code(TEXT) TO anon;

GRANT EXECUTE ON FUNCTION verify_officer_status() TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_details_for_officers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_for_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profiles_for_officers(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_officer_status(UUID, BOOLEAN) TO authenticated;

GRANT EXECUTE ON FUNCTION get_all_meetings_for_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_meeting_with_secrets(TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION create_meeting_for_officers(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, JSONB, TEXT, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION officer_update_meeting(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_meeting_for_officers(UUID) TO authenticated;

-- ============================================================
-- PERFORMANCE RPCs (added 2026-06-02)
-- Single-roundtrip data loading functions for Dashboard, MeetingDetails, Officer pages.
-- See supabase/migrations/20260602000000_performance_optimized_data_loading.sql
-- for full comments and rationale.
-- ============================================================

-- get_my_dashboard_data
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

-- get_meeting_page_data
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

-- get_officer_dashboard_stats
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

-- get_my_profile (lightweight)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); BEGIN
  IF v_user_id IS NULL THEN RETURN null; END IF;
  RETURN (SELECT to_jsonb(u) FROM users u WHERE id = v_user_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- ============================================================
-- END OF CONSOLIDATED SETUP
-- ============================================================