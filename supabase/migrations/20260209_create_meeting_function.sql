-- Function for officers to create meetings
-- Uses SECURITY DEFINER to bypass RLS after verifying officer status
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
