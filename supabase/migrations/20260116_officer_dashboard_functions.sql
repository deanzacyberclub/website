-- Function for officers to get all users
CREATE OR REPLACE FUNCTION get_all_users_for_officers()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  is_officer BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an officer
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.is_officer = true
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not an officer';
  END IF;

  -- Return all users
  RETURN QUERY
  SELECT u.id, u.display_name, u.email, u.photo_url, u.is_officer, u.created_at
  FROM users u
  ORDER BY u.created_at DESC;
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
  -- Check if the calling user is an officer
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.is_officer = true
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not an officer';
  END IF;

  -- Prevent officers from removing their own status
  IF target_user_id = auth.uid() AND new_status = false THEN
    RAISE EXCEPTION 'Cannot remove your own officer status';
  END IF;

  -- Update the target user's officer status
  UPDATE users
  SET is_officer = new_status
  WHERE id = target_user_id;
END;
$$;
