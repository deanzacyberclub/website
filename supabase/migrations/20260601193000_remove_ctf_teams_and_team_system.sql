-- ============================================================
-- REMOVE CTF TEAMS / TEAM MEMBERS / TEAM SUBMISSIONS
-- ============================================================
-- This migration completely removes the team-based CTF system:
--   - ctf_teams
--   - ctf_team_members
--   - ctf_submissions
--   - ctf_settings (leaderboard freeze settings)
--
-- Associated functions removed:
--   - check_team_size (trigger function)
--   - generate_invite_code
--   - toggle_leaderboard_freeze
--
-- Note: ctf_challenges table is intentionally left in place
-- (separate officer-managed challenge bank, not team-specific).
--
-- Run this after the lessons removal migration.
-- ============================================================

-- 1. Drop the team size enforcement trigger first
DROP TRIGGER IF EXISTS enforce_team_size ON public.ctf_team_members;

-- 2. Drop dependent functions
DROP FUNCTION IF EXISTS public.check_team_size() CASCADE;
DROP FUNCTION IF EXISTS public.generate_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.toggle_leaderboard_freeze(BOOLEAN) CASCADE;

-- 3. Drop tables in dependency order (submissions → members → teams → settings)
DROP TABLE IF EXISTS public.ctf_submissions CASCADE;
DROP TABLE IF EXISTS public.ctf_team_members CASCADE;
DROP TABLE IF EXISTS public.ctf_teams CASCADE;
DROP TABLE IF EXISTS public.ctf_settings CASCADE;

-- 4. Remove any lingering grants (defensive)
-- These will no-op harmlessly if the functions no longer exist
DO $$
BEGIN
    -- No explicit REVOKE needed for functions that are already dropped
    NULL;
END $$;

-- ============================================================
-- Post-migration notes:
--   - Team-based CTF functionality has been fully removed.
--   - Officer.tsx and UserProfile.tsx contain references to
--     ctf_teams that will need to be cleaned up in application code.
--   - ctf_challenges (if present) remains untouched.
-- ============================================================