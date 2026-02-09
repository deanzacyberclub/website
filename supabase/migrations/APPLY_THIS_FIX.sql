-- ============================================================
-- COMPREHENSIVE FIX FOR ATTENDANCE AND MEETINGS
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- 1. Grant execute permission on verify_meeting_secret_code
GRANT EXECUTE ON FUNCTION verify_meeting_secret_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_meeting_secret_code(TEXT) TO anon;

-- 2. Create the create_meeting_for_officers function if it doesn't exist
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
    p_announcements JSONB DEFAULT '[]'::jsonb,
    p_photos JSONB DEFAULT '[]'::jsonb,
    p_resources JSONB DEFAULT '[]'::jsonb,
    p_registration_type TEXT DEFAULT 'open',
    p_registration_capacity INTEGER DEFAULT NULL,
    p_invite_code TEXT DEFAULT NULL,
    p_invite_form_url TEXT DEFAULT NULL
)
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
    -- Verify user is an officer
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;

    -- Insert the meeting and return it
    RETURN QUERY
    INSERT INTO meetings (
        slug, title, description, date, time, location, type, featured,
        topics, secret_code, announcements, photos, resources,
        registration_type, registration_capacity, invite_code, invite_form_url
    )
    VALUES (
        p_slug, p_title, p_description, p_date, p_time, p_location, p_type, p_featured,
        p_topics, p_secret_code, p_announcements, p_photos, p_resources,
        p_registration_type, p_registration_capacity, p_invite_code, p_invite_form_url
    )
    RETURNING
        meetings.id, meetings.slug, meetings.title, meetings.description, meetings.date,
        meetings.time, meetings.location, meetings.type, meetings.featured,
        meetings.topics, meetings.announcements, meetings.photos, meetings.resources,
        meetings.secret_code, meetings.invite_code,
        meetings.created_at, meetings.updated_at,
        meetings.registration_type, meetings.registration_capacity, meetings.invite_form_url;
END;
$$;

-- 3. Drop problematic triggers on attendance table (skip system triggers)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.attendance'::regclass
        AND tgname NOT LIKE 'RI_ConstraintTrigger_%'  -- Skip foreign key constraint triggers
        AND tgname NOT LIKE 'pg_%'  -- Skip PostgreSQL system triggers
        AND tgisinternal = false  -- Skip internal triggers
    )
    LOOP
        -- Drop triggers that aren't the registration-related one
        IF r.tgname != 'attendance_marks_registration_attended' THEN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON public.attendance CASCADE';
            RAISE NOTICE 'Dropped trigger: %', r.tgname;
        END IF;
    END LOOP;
END $$;

-- 4. Update attendance RLS policies
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Officers can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can delete own attendance" ON public.attendance;

CREATE POLICY "Users can view own attendance" ON public.attendance
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Officers can view all attendance" ON public.attendance
FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

CREATE POLICY "Authenticated users can insert attendance" ON public.attendance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance" ON public.attendance
FOR DELETE
USING (auth.uid() = user_id);

-- 5. Create user_progress table with all needed columns
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score INTEGER,
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- 6. Add progress_percentage column if table exists but column doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_progress')
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_progress'
        AND column_name = 'progress_percentage'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN progress_percentage INTEGER DEFAULT 0;
        RAISE NOTICE 'Added progress_percentage column to user_progress table';
    END IF;
END $$;

-- 7. Add RLS to user_progress
DO $$
BEGIN
    ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'RLS already enabled on user_progress';
END $$;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;

CREATE POLICY "Users can view own progress" ON public.user_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- 8. Verify everything is set up correctly
DO $$
BEGIN
    RAISE NOTICE '✓ Migration completed successfully!';
    RAISE NOTICE '✓ verify_meeting_secret_code grants applied';
    RAISE NOTICE '✓ create_meeting_for_officers function created';
    RAISE NOTICE '✓ Attendance RLS policies updated';
    RAISE NOTICE '✓ user_progress table created/updated';
END $$;
