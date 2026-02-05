-- ============================================================
-- DE ANZA CYBERSECURITY CLUB - DATABASE SETUP
-- ============================================================
-- This file contains all database schema definitions including:
-- - Tables, columns, constraints
-- - Indexes
-- - Row Level Security policies
-- - Functions and triggers
-- - Views
--
-- Run this file first, then seed.sql for sample data.
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
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
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
-- MEETINGS TABLE
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
    announcements JSONB DEFAULT '[]'::jsonb,
    photos JSONB DEFAULT '[]'::jsonb,
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

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Only officers can query the meetings table directly (which contains secret_code).
-- Regular users must use the meetings_public view instead.
CREATE POLICY "Officers can view meetings" ON public.meetings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);
CREATE POLICY "Officers can insert meetings" ON public.meetings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);
CREATE POLICY "Officers can update meetings" ON public.meetings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);
CREATE POLICY "Officers can delete meetings" ON public.meetings FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

-- ============================================================
-- MEETINGS PUBLIC VIEW (excludes secret_code and invite_code)
-- ============================================================
-- security_invoker=false means this view runs as the view owner,
-- bypassing RLS on the meetings table. This is safe because the
-- view explicitly excludes sensitive columns (secret_code, invite_code).
CREATE OR REPLACE VIEW public.meetings_public
WITH (security_invoker = false)
AS
SELECT
    id, slug, title, description, date, "time", location, type,
    featured, topics, announcements, photos, resources,
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

CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Officers can view all attendance" ON public.attendance FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);
CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
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

-- Function to update updated_at timestamp
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

-- Function to mark registration as attended when attendance is recorded
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
-- LESSONS TABLE (for Security+ course)
-- ============================================================
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('course', 'workshop', 'ctf', 'quiz', 'flashcard')) NOT NULL,
    order_index INTEGER NOT NULL,
    content JSONB,
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    is_self_paced BOOLEAN DEFAULT true,
    quiz_data JSONB,
    flashcard_data JSONB,
    estimated_minutes INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced')),
    topics TEXT[],
    resources JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_type ON public.lessons(type);
CREATE INDEX idx_lessons_order ON public.lessons(order_index);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Officers can manage lessons" ON public.lessons FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION update_lessons_updated_at();

-- ============================================================
-- CTF TEAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ctf_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    captain_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_expires_at TIMESTAMPTZ DEFAULT NULL,
    invite_max_uses INTEGER DEFAULT NULL,
    invite_uses_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ctf_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone" ON ctf_teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON ctf_teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "Captains can update their teams" ON ctf_teams FOR UPDATE USING (auth.uid() = captain_id);
CREATE POLICY "Captains can delete their teams" ON ctf_teams FOR DELETE USING (auth.uid() = captain_id);

-- ============================================================
-- CTF TEAM MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ctf_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES ctf_teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_ctf_team_members_team_id ON ctf_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_ctf_team_members_user_id ON ctf_team_members(user_id);

ALTER TABLE ctf_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by everyone" ON ctf_team_members FOR SELECT USING (true);
CREATE POLICY "Users can join teams" ON ctf_team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON ctf_team_members FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- CTF SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ctf_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES ctf_teams(id) ON DELETE CASCADE,
    challenge_id VARCHAR(50) NOT NULL,
    submitted_flag TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ctf_submissions_team_id ON ctf_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_challenge_id ON ctf_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ctf_submissions_is_correct ON ctf_submissions(is_correct);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_correct_submission ON ctf_submissions(team_id, challenge_id) WHERE is_correct = TRUE;

ALTER TABLE ctf_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submissions are viewable by everyone" ON ctf_submissions FOR SELECT USING (true);
CREATE POLICY "Team members can submit flags" ON ctf_submissions FOR INSERT WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (SELECT 1 FROM ctf_team_members WHERE team_id = ctf_submissions.team_id AND user_id = auth.uid())
);

-- Function to check team size before adding members
CREATE OR REPLACE FUNCTION check_team_size()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM ctf_team_members WHERE team_id = NEW.team_id) >= 4 THEN
        RAISE EXCEPTION 'Team is already at maximum capacity (4 members)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_team_size ON ctf_team_members;
CREATE TRIGGER enforce_team_size
BEFORE INSERT ON ctf_team_members
FOR EACH ROW
EXECUTE FUNCTION check_team_size();

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(12) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result VARCHAR(12) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CTF SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ctf_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

ALTER TABLE ctf_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read CTF settings" ON ctf_settings FOR SELECT USING (true);
CREATE POLICY "Officers can update CTF settings" ON ctf_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true)
);
CREATE POLICY "Officers can insert CTF settings" ON ctf_settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true)
);

-- Insert default leaderboard_freeze setting
INSERT INTO ctf_settings (key, value)
VALUES ('leaderboard_freeze', '{"is_frozen": false, "frozen_at": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Function for officers to toggle leaderboard freeze
CREATE OR REPLACE FUNCTION toggle_leaderboard_freeze(should_freeze BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_value JSONB;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;

    IF should_freeze THEN
        new_value := jsonb_build_object('is_frozen', true, 'frozen_at', NOW());
    ELSE
        new_value := jsonb_build_object('is_frozen', false, 'frozen_at', NULL);
    END IF;

    INSERT INTO ctf_settings (key, value, updated_at, updated_by)
    VALUES ('leaderboard_freeze', new_value, NOW(), auth.uid())
    ON CONFLICT (key) DO UPDATE
    SET value = new_value, updated_at = NOW(), updated_by = auth.uid();

    RETURN new_value;
END;
$$;

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
-- OFFICER FUNCTIONS
-- ============================================================

-- Function for officers to get user profiles with email
CREATE OR REPLACE FUNCTION get_user_profiles_for_officers(user_ids UUID[])
RETURNS TABLE (id UUID, display_name TEXT, photo_url TEXT, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.photo_url, u.email FROM users u WHERE u.id = ANY(user_ids);
END;
$$;

-- Function for officers to get all users
CREATE OR REPLACE FUNCTION get_all_users_for_officers()
RETURNS TABLE (id UUID, display_name TEXT, email TEXT, photo_url TEXT, is_officer BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.email, u.photo_url, u.is_officer, u.created_at FROM users u ORDER BY u.created_at DESC;
END;
$$;

-- Function for officers to toggle another user's officer status
CREATE OR REPLACE FUNCTION toggle_officer_status(target_user_id UUID, new_status BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Function for officers to get detailed user info
CREATE OR REPLACE FUNCTION get_user_details_for_officers(target_user_id UUID)
RETURNS TABLE (id UUID, display_name TEXT, email TEXT, photo_url TEXT, student_id TEXT, is_officer BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.email, u.photo_url, u.student_id, u.is_officer, u.created_at FROM users u WHERE u.id = target_user_id;
END;
$$;

-- ============================================================
-- MEETING FUNCTIONS
-- ============================================================

-- Function for officers to get all meetings including secret_code
CREATE OR REPLACE FUNCTION get_all_meetings_for_officers()
RETURNS TABLE (
    id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
    "time" TEXT, location TEXT, type TEXT, featured BOOLEAN,
    topics TEXT[], announcements JSONB, photos JSONB, resources JSONB,
    secret_code TEXT, invite_code TEXT,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
    registration_type TEXT, registration_capacity INTEGER, invite_form_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY
    SELECT m.id, m.slug, m.title, m.description, m.date, m.time, m.location,
           m.type, m.featured, m.topics, m.announcements, m.photos, m.resources,
           m.secret_code, m.invite_code, m.created_at, m.updated_at,
           m.registration_type, m.registration_capacity, m.invite_form_url
    FROM meetings m ORDER BY m.date DESC;
END;
$$;

-- Function for officers to get a single meeting including secret_code
CREATE OR REPLACE FUNCTION get_meeting_with_secrets(meeting_slug TEXT)
RETURNS TABLE (
    id UUID, slug TEXT, title TEXT, description TEXT, date DATE,
    "time" TEXT, location TEXT, type TEXT, featured BOOLEAN,
    topics TEXT[], announcements JSONB, photos JSONB, resources JSONB,
    secret_code TEXT, invite_code TEXT,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
    registration_type TEXT, registration_capacity INTEGER, invite_form_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY
    SELECT m.id, m.slug, m.title, m.description, m.date, m.time, m.location,
           m.type, m.featured, m.topics, m.announcements, m.photos, m.resources,
           m.secret_code, m.invite_code, m.created_at, m.updated_at,
           m.registration_type, m.registration_capacity, m.invite_form_url
    FROM meetings m WHERE m.slug = meeting_slug;
END;
$$;

-- Function for attendance check-in: verifies a secret code without exposing it
CREATE OR REPLACE FUNCTION verify_meeting_secret_code(secret_code_input TEXT)
RETURNS TABLE (meeting_id UUID, meeting_title TEXT, meeting_date DATE, meeting_time TEXT, meeting_location TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT id, title, date, time, location
    FROM meetings
    WHERE UPPER(secret_code) = UPPER(secret_code_input)
      AND secret_code IS NOT NULL
    LIMIT 1;
END;
$$;
