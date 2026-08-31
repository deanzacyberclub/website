-- ============================================================
-- REMOVE LESSONS & STUDY PLAN FEATURE
-- ============================================================
-- This migration completely removes the lessons / curriculum / study plan
-- feature including:
--   - lessons table (and all related indexes, policies, triggers)
--   - user_progress table (progress tracking for lessons)
--   - The update_lessons_updated_at helper function
--
-- The entire Security+ curriculum (curriculum.sql) is no longer used.
--
-- Run this migration against your Supabase database to clean up
-- the old study-related objects.
-- ============================================================

-- 1. Drop user_progress first (it has a foreign key referencing lessons)
DROP TABLE IF EXISTS public.user_progress CASCADE;

-- 2. Drop the lessons table.
-- CASCADE will automatically remove:
--   - All indexes on the table (idx_lessons_type, idx_lessons_order)
--   - All RLS policies on the table
--   - The trigger lessons_updated_at
--   - The foreign key from lessons → meetings (meeting_id)
DROP TABLE IF EXISTS public.lessons CASCADE;

-- 3. Drop the helper function that was exclusively used by the lessons table
DROP FUNCTION IF EXISTS public.update_lessons_updated_at() CASCADE;

-- 4. (Defensive) Drop any lingering difficulty constraint that may have been
--    added by older runs of curriculum.sql. This will no-op if the table is gone.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'lessons'
          AND constraint_name LIKE '%difficulty%'
    ) THEN
        ALTER TABLE public.lessons
        DROP CONSTRAINT IF EXISTS lessons_difficulty_check;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        -- Table already dropped, nothing to do
        NULL;
END $$;

-- ============================================================
-- Post-migration notes:
--   - The curriculum.sql file is now obsolete and can be deleted.
--   - Any frontend code importing Lesson / LessonType / QuizData etc.
--     should be removed.
--   - The lessons feature (self-paced study path, quizzes, flashcards)
--     has been fully decommissioned.
-- ============================================================