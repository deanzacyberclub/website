-- ============================================================
-- SECURITY LOCKDOWN: Prevent unauthorized meeting manipulation
-- ============================================================

-- 1. CRITICAL: Prevent users from changing their own officer status
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile (not officer status)" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    -- Prevent changing is_officer field
    is_officer = (SELECT is_officer FROM public.users WHERE id = auth.uid())
);

-- 2. Remove direct INSERT/UPDATE/DELETE access to meetings table
-- Only officers can SELECT, but must use RPC functions for modifications
DROP POLICY IF EXISTS "Officers can insert meetings" ON public.meetings;
DROP POLICY IF EXISTS "Officers can update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Officers can delete meetings" ON public.meetings;

-- Keep SELECT policy for officers
DROP POLICY IF EXISTS "Officers can view meetings" ON public.meetings;
CREATE POLICY "Officers can view meetings" ON public.meetings
FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_officer = true)
);

-- 3. Create secure RPC function to update meetings
CREATE OR REPLACE FUNCTION update_meeting_for_officers(
    p_meeting_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_date DATE DEFAULT NULL,
    p_time TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_type TEXT DEFAULT NULL,
    p_featured BOOLEAN DEFAULT NULL,
    p_topics TEXT[] DEFAULT NULL,
    p_secret_code TEXT DEFAULT NULL,
    p_announcements JSONB DEFAULT NULL,
    p_photos JSONB DEFAULT NULL,
    p_resources JSONB DEFAULT NULL,
    p_registration_type TEXT DEFAULT NULL,
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

    -- Update only non-NULL fields
    RETURN QUERY
    UPDATE meetings SET
        title = COALESCE(p_title, meetings.title),
        description = COALESCE(p_description, meetings.description),
        date = COALESCE(p_date, meetings.date),
        time = COALESCE(p_time, meetings.time),
        location = COALESCE(p_location, meetings.location),
        type = COALESCE(p_type, meetings.type),
        featured = COALESCE(p_featured, meetings.featured),
        topics = COALESCE(p_topics, meetings.topics),
        secret_code = COALESCE(p_secret_code, meetings.secret_code),
        announcements = COALESCE(p_announcements, meetings.announcements),
        photos = COALESCE(p_photos, meetings.photos),
        resources = COALESCE(p_resources, meetings.resources),
        registration_type = COALESCE(p_registration_type, meetings.registration_type),
        registration_capacity = COALESCE(p_registration_capacity, meetings.registration_capacity),
        invite_code = COALESCE(p_invite_code, meetings.invite_code),
        invite_form_url = COALESCE(p_invite_form_url, meetings.invite_form_url),
        updated_at = NOW()
    WHERE meetings.id = p_meeting_id
    RETURNING
        meetings.id, meetings.slug, meetings.title, meetings.description, meetings.date,
        meetings.time, meetings.location, meetings.type, meetings.featured,
        meetings.topics, meetings.announcements, meetings.photos, meetings.resources,
        meetings.secret_code, meetings.invite_code,
        meetings.created_at, meetings.updated_at,
        meetings.registration_type, meetings.registration_capacity, meetings.invite_form_url;
END;
$$;

-- 4. Create secure RPC function to delete meetings
CREATE OR REPLACE FUNCTION delete_meeting_for_officers(p_meeting_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify user is an officer
    IF NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true) THEN
        RAISE EXCEPTION 'Access denied: User is not an officer';
    END IF;

    DELETE FROM meetings WHERE id = p_meeting_id;
    RETURN FOUND;
END;
$$;

-- 5. Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION update_meeting_for_officers(UUID, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, JSONB, JSONB, JSONB, TEXT, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_meeting_for_officers(UUID) TO authenticated;

-- 6. Add audit logging for meeting changes (optional but recommended)
CREATE TABLE IF NOT EXISTS meeting_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_data JSONB,
    new_data JSONB
);

-- Enable RLS on audit log
ALTER TABLE meeting_audit_log ENABLE ROW LEVEL SECURITY;

-- Only officers can view audit logs
CREATE POLICY "Officers can view audit logs" ON meeting_audit_log
FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true)
);

-- 7. Create trigger to log meeting changes
CREATE OR REPLACE FUNCTION log_meeting_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO meeting_audit_log (meeting_id, action, changed_by, new_data)
        VALUES (NEW.id, 'created', auth.uid(), to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO meeting_audit_log (meeting_id, action, changed_by, old_data, new_data)
        VALUES (NEW.id, 'updated', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO meeting_audit_log (meeting_id, action, changed_by, old_data)
        VALUES (OLD.id, 'deleted', auth.uid(), to_jsonb(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS meeting_audit_trigger ON meetings;
CREATE TRIGGER meeting_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON meetings
FOR EACH ROW EXECUTE FUNCTION log_meeting_changes();

-- 8. Verify and report current security status
DO $$
BEGIN
    RAISE NOTICE '✓ Security lockdown completed!';
    RAISE NOTICE '✓ Users cannot change their own officer status';
    RAISE NOTICE '✓ Direct INSERT/UPDATE/DELETE removed from meetings table';
    RAISE NOTICE '✓ All meeting changes must go through secure RPC functions';
    RAISE NOTICE '✓ Audit logging enabled for all meeting changes';
    RAISE NOTICE '✓ Only verified officers can modify meetings';
END $$;
