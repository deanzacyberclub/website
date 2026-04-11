-- ===========================================================
-- Notification inbox records
-- ===========================================================
-- One row per user per notification sent.
-- The edge function inserts here; users mark rows as read.
-- meeting_id is nullable so records survive meeting deletion.
-- ===========================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  -- 'new_meeting' | 'announcement' | 'registration_update'
  type       TEXT        NOT NULL DEFAULT 'new_meeting',
  meeting_id UUID        REFERENCES public.meetings(id) ON DELETE SET NULL,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx  ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx     ON public.notifications (user_id, read) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users read and update (mark as read) their own notifications.
-- INSERT is done by the edge function via the service role, which bypasses RLS.
CREATE POLICY "notifications: users read own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: users mark read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications: users delete own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
