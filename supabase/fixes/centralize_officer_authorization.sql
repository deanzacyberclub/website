-- ============================================================
-- FIX: Centralize all officer authorization behind public.is_officer()
-- Run this in Supabase SQL Editor (as postgres or service role) to make
-- officer checks consistent and reliable across all RPCs.
-- ============================================================

-- 1. Create / update the single source of truth function
CREATE OR REPLACE FUNCTION public.is_officer(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = p_user_id 
      AND is_officer IS TRUE
  );
END;
$$;

COMMENT ON FUNCTION public.is_officer(uuid) IS 
  'Canonical officer check. This is the ONLY function that should be used to determine if a user is an officer.';

GRANT EXECUTE ON FUNCTION public.is_officer(uuid) TO authenticated;

-- 2. Update the core verification function (what ProtectedRoute + useOfficerVerification use)
CREATE OR REPLACE FUNCTION public.verify_officer_status()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN public.is_officer();
END;
$$;

-- 3. Update the main officer lookup / management functions
CREATE OR REPLACE FUNCTION public.get_user_profiles_for_officers(user_ids UUID[])
RETURNS TABLE (id UUID, display_name TEXT, photo_url TEXT, email TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_officer() THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.photo_url, u.email FROM users u WHERE u.id = ANY(user_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_users_for_officers()
RETURNS TABLE (id UUID, display_name TEXT, email TEXT, photo_url TEXT, is_officer BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_officer() THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.email, u.photo_url, u.is_officer, u.created_at FROM users u ORDER BY u.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_officer_status(target_user_id UUID, new_status BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_officer() THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    IF target_user_id = auth.uid() AND new_status = false THEN
        RAISE EXCEPTION 'Cannot remove your own officer status';
    END IF;
    UPDATE users SET is_officer = new_status WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_details_for_officers(target_user_id UUID)
RETURNS TABLE (id UUID, display_name TEXT, email TEXT, photo_url TEXT, student_id TEXT, is_officer BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_officer() THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;
    RETURN QUERY SELECT u.id, u.display_name, u.email, u.photo_url, u.student_id, u.is_officer, u.created_at FROM users u WHERE u.id = target_user_id;
END;
$$;

-- Note: Other officer functions (get_all_meetings_for_officers, etc.) have also been updated
-- in the main setup.sql. Re-apply setup.sql or run similar replacements for any
-- remaining duplicated checks in your live database if needed.

-- After running this, test with:
-- SELECT public.verify_officer_status();
-- SELECT public.is_officer();
