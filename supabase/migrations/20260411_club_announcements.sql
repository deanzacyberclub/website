-- ============================================================
-- CLUB ANNOUNCEMENTS
-- Officer-posted banners shown app-wide (e.g. event cancelled,
-- service outage, critical info).
-- ============================================================

CREATE TABLE public.club_announcements (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT        NOT NULL,
    body        TEXT        NOT NULL,
    severity    TEXT        NOT NULL DEFAULT 'info'
                            CHECK (severity IN ('info', 'warning', 'critical')),
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_by  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ
);

CREATE INDEX idx_club_announcements_active    ON public.club_announcements(is_active);
CREATE INDEX idx_club_announcements_created   ON public.club_announcements(created_at DESC);

ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;

-- Everyone (including anonymous) can read active, non-expired announcements.
CREATE POLICY "Anyone can view active announcements"
    ON public.club_announcements FOR SELECT
    TO anon, authenticated
    USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Only officers can create, update, or delete announcements.
CREATE POLICY "Officers can manage announcements"
    ON public.club_announcements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_officer = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_officer = true
        )
    );

GRANT SELECT ON public.club_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_announcements TO authenticated;
