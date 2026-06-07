-- ============================================================
-- FIX: Resolve PGRST203 — ambiguous create_meeting_for_officers
-- ============================================================
-- Symptom (officer "New Meeting" create from Dashboard.tsx / Meetings.tsx):
--   PGRST203 "Could not choose the best candidate function between:
--     create_meeting_for_officers(... p_resources ...)               -- 15 args (current)
--     create_meeting_for_officers(... p_announcements, p_photos ...) -- 17 args (stale)"
--
-- Root cause:
--   The `announcements` and `photos` columns were removed from `meetings`
--   (migration 20260601201000) and the RPC was redefined WITHOUT them.
--   But `CREATE OR REPLACE FUNCTION` only replaces a function with the SAME
--   argument signature. Because the new definition dropped two JSONB params,
--   Postgres KEPT the old 17-arg overload alongside the new 15-arg one.
--   The earlier cleanup (fixes/fix_officer_meeting_rpcs_after_column_removal.sql)
--   only DROPped the *15-arg* signature — never the stale 17-arg one — so the
--   live database ended up carrying BOTH overloads.
--
--   The 15-arg parameter set is a strict SUBSET of the 17-arg one, so the
--   client's named-argument call matches both and PostgREST cannot pick one.
--   (The 17-arg version is also broken: its body inserts into the now-dropped
--   announcements/photos columns.) There is no client-side workaround — the
--   stale overload must be removed.
--
-- Fix: drop the stale 17-arg overload. The canonical 15-arg version
--      (supabase/setup.sql) remains, and the RPC resolves cleanly.
--      Dropping a different overload does NOT affect the canonical
--      function's grants, so no re-grant is required.
-- ============================================================

-- Primary, explicit drop of the known stale signature (idempotent).
DROP FUNCTION IF EXISTS public.create_meeting_for_officers(
    TEXT,     -- p_slug
    TEXT,     -- p_title
    TEXT,     -- p_description
    DATE,     -- p_date
    TEXT,     -- p_time
    TEXT,     -- p_location
    TEXT,     -- p_type
    BOOLEAN,  -- p_featured
    TEXT[],   -- p_topics
    TEXT,     -- p_secret_code
    JSONB,    -- p_announcements   <-- references removed column
    JSONB,    -- p_photos          <-- references removed column
    JSONB,    -- p_resources
    TEXT,     -- p_registration_type
    INTEGER,  -- p_registration_capacity
    TEXT,     -- p_invite_code
    TEXT      -- p_invite_form_url
) CASCADE;

-- Defensive sweep: drop ANY remaining create_meeting_for_officers overload that
-- still references the removed announcements/photos params, regardless of exact
-- argument ordering. This can never drop the canonical version (which has neither).
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'create_meeting_for_officers'
          AND pg_get_function_identity_arguments(p.oid) ~ '\m(p_announcements|p_photos)\M'
    LOOP
        EXECUTE format('DROP FUNCTION %s CASCADE;', r.sig);
        RAISE NOTICE 'Dropped stale create_meeting_for_officers overload: %', r.sig;
    END LOOP;
END $$;

-- Sanity check (raises if zero or more than one overload remains).
DO $$
DECLARE
    n INTEGER;
BEGIN
    SELECT count(*) INTO n
    FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.proname = 'create_meeting_for_officers';

    IF n <> 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 create_meeting_for_officers overload after cleanup, found %', n;
    END IF;
END $$;

-- Verify manually with:
--   SELECT pg_get_function_identity_arguments(p.oid)
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname = 'create_meeting_for_officers';
