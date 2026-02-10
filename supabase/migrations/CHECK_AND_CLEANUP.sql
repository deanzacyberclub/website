-- ============================================================
-- CHECK FOR UNAUTHORIZED OFFICERS AND CLEANUP BAD DATA
-- Run this to identify and fix security issues
-- ============================================================

-- 1. Show all current officers
SELECT
    id,
    email,
    display_name,
    is_officer,
    created_at
FROM users
WHERE is_officer = true
ORDER BY created_at DESC;

-- 2. Check recent meeting creations (to find suspicious activity)
SELECT
    m.id,
    m.title,
    m.slug,
    m.created_at,
    u.email as created_by_email,
    u.display_name as created_by_name,
    u.is_officer
FROM meetings m
LEFT JOIN meeting_audit_log mal ON m.id = mal.meeting_id AND mal.action = 'created'
LEFT JOIN users u ON mal.changed_by = u.id
ORDER BY m.created_at DESC
LIMIT 20;

-- 3. Check for meetings created in the last 24 hours
SELECT
    id,
    title,
    slug,
    date,
    created_at
FROM meetings
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================================
-- CLEANUP COMMANDS (uncomment and modify as needed)
-- ============================================================

-- Remove officer status from specific user (replace with their email)
-- UPDATE users SET is_officer = false WHERE email = 'suspicious@email.com';

-- Delete a specific meeting by ID (replace with meeting ID)
-- DELETE FROM meetings WHERE id = 'meeting-uuid-here';

-- Delete meetings created by non-officers (careful with this!)
-- DELETE FROM meetings
-- WHERE id IN (
--     SELECT m.id
--     FROM meetings m
--     LEFT JOIN meeting_audit_log mal ON m.id = mal.meeting_id AND mal.action = 'created'
--     LEFT JOIN users u ON mal.changed_by = u.id
--     WHERE u.is_officer = false OR u.is_officer IS NULL
-- );

-- View audit log to see who made changes
-- SELECT
--     mal.action,
--     mal.changed_at,
--     u.email,
--     u.display_name,
--     u.is_officer,
--     mal.new_data->>'title' as meeting_title
-- FROM meeting_audit_log mal
-- JOIN users u ON mal.changed_by = u.id
-- ORDER BY mal.changed_at DESC
-- LIMIT 50;
