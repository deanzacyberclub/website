-- Officers cannot UPDATE meetings directly because authenticated role lacks SELECT
-- on the meetings table (by design — non-officers read from meetings_public view).
-- This security-definer function performs the update server-side after verifying
-- officer status, mirroring the pattern used by get_meeting_with_secrets.

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
  p_announcements jsonb,
  p_photos jsonb,
  p_resources jsonb
)
RETURNS SETOF meetings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.is_officer = true
  ) THEN
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
    announcements = p_announcements,
    photos = p_photos,
    resources = p_resources,
    updated_at = now()
  WHERE id = meeting_id
  RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION officer_update_meeting TO authenticated;
