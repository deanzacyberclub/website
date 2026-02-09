-- Fix attendance permissions and add missing grants

-- Grant execute permission on verify_meeting_secret_code to authenticated and anon users
GRANT EXECUTE ON FUNCTION verify_meeting_secret_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_meeting_secret_code(TEXT) TO anon;

-- Update attendance RLS policies to allow checking for duplicates
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Officers can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can delete own attendance" ON public.attendance;

-- Recreate policies with better permissions
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

-- Drop any triggers on attendance that reference user_progress (which may not be fully set up)
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
        END IF;
    END LOOP;
END $$;

-- Create user_progress table if it doesn't exist (in case there's a trigger referencing it)
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

-- Add progress_percentage column if table already exists but column doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_progress'
        AND column_name = 'progress_percentage'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN progress_percentage INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add RLS to user_progress if it was just created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_progress'
        AND policyname = 'Users can view own progress'
    ) THEN
        ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own progress" ON public.user_progress
        FOR SELECT
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own progress" ON public.user_progress
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own progress" ON public.user_progress
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;
END $$;
