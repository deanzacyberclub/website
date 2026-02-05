-- Simple function to verify if current user is an officer
-- This is used by the frontend to prevent client-side tampering
CREATE OR REPLACE FUNCTION verify_officer_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_officer = true);
END;
$$;
