-- Grant execute permissions on all RPC functions to authenticated users
-- This allows officers and regular users to call these functions
-- (Authorization is still enforced inside each function)

GRANT EXECUTE ON FUNCTION verify_meeting_secret_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_meeting_secret_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_officer_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_details_for_officers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_for_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profiles_for_officers(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_officer_status(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_meetings_for_officers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_meeting_with_secrets(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_leaderboard_freeze(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_meeting_for_officers(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT, JSONB, JSONB, JSONB, TEXT, INTEGER, TEXT, TEXT) TO authenticated;
