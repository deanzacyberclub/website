-- ===========================================================
-- Notifications: device_tokens + notification_preferences
-- ===========================================================
--
-- SETUP REQUIRED after running this migration:
--
-- 1. Enable the pg_net extension (if not already on):
--    Dashboard → Database → Extensions → pg_net
--
-- 2. Store your Supabase service role key in the Vault so
--    triggers can invoke the edge function:
--
--      SELECT vault.create_secret(
--        'supabase_service_role_key',
--        '<your-supabase-service-role-key>',
--        'Service role key used by DB triggers to call edge functions'
--      );
--
-- 3. Deploy the send-push-notification edge function:
--      supabase functions deploy send-push-notification
--
-- 4. Set the following secrets in the Supabase dashboard
--    (Edge Functions → send-push-notification → Secrets):
--      APNS_KEY_ID      — Key ID from Apple Developer account
--      APNS_TEAM_ID     — Apple Developer Team ID
--      APNS_PRIVATE_KEY — Full contents of your .p8 file
--      APNS_BUNDLE_ID   — App bundle ID (e.g. com.aaronma.DACC)
--      APNS_SANDBOX     — "true" for dev, "false" for production
--
-- ===========================================================

-- ─── device_tokens ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_tokens: users manage own"
  ON public.device_tokens FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "device_tokens: officers read all"
  ON public.device_tokens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_officer = true
  ));

-- ─── notification_preferences ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                     UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Broad subscriptions
  any_events             BOOLEAN     NOT NULL DEFAULT false,
  category_subscriptions TEXT[]      NOT NULL DEFAULT '{}',
  keyword_subscriptions  TEXT[]      NOT NULL DEFAULT '{}',
  -- Per-event updates
  event_announcements    BOOLEAN     NOT NULL DEFAULT true,
  registration_updates   BOOLEAN     NOT NULL DEFAULT true,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences: users manage own"
  ON public.notification_preferences FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Helper: invoke the edge function via pg_net ──────────────────────────────
-- Reads the Supabase service role key from Vault (see SETUP REQUIRED above).
-- Silently no-ops if the key has not been configured.

CREATE OR REPLACE FUNCTION public.invoke_send_push_notification(
  p_user_ids UUID[],
  p_title    TEXT,
  p_body     TEXT,
  p_data     JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_key TEXT;
  v_url         TEXT := 'https://yhwpaclstjhylrphdrae.supabase.co/functions/v1/send-push-notification';
BEGIN
  IF array_length(p_user_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_service_role_key'
  LIMIT 1;

  IF v_service_key IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body    := jsonb_build_object(
      'userIds', to_jsonb(p_user_ids),
      'title',   p_title,
      'body',    p_body,
      'data',    p_data
    )
  );
END;
$$;

-- ─── Trigger: new meeting posted ──────────────────────────────────────────────
-- Notifies users who subscribed to:
--   • any_events = true
--   • this meeting's category
--   • a keyword that appears in the title, description, or any topic

CREATE OR REPLACE FUNCTION public.on_new_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipients UUID[];
BEGIN
  SELECT array_agg(DISTINCT np.user_id) INTO v_recipients
  FROM public.notification_preferences np
  WHERE
    np.any_events = true
    OR NEW.type = ANY(np.category_subscriptions)
    OR EXISTS (
      SELECT 1
      FROM unnest(np.keyword_subscriptions) AS kw
      WHERE
        NEW.title       ILIKE '%' || kw || '%'
        OR NEW.description ILIKE '%' || kw || '%'
        OR EXISTS (
          SELECT 1 FROM unnest(NEW.topics) AS topic
          WHERE topic ILIKE '%' || kw || '%'
        )
    );

  IF v_recipients IS NOT NULL THEN
    PERFORM public.invoke_send_push_notification(
      v_recipients,
      'New ' || initcap(NEW.type) || ': ' || NEW.title,
      NEW.date || ' · ' || NEW.location,
      jsonb_build_object('meetingId', NEW.id::text, 'type', 'new_meeting')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_new_meeting
  AFTER INSERT ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.on_new_meeting();

-- ─── Trigger: new announcement on a meeting ───────────────────────────────────
-- Notifies registered users (registered/invited/attended) who opted in to
-- event_announcements. Fires only when the announcements array grows.

CREATE OR REPLACE FUNCTION public.on_meeting_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipients UUID[];
  v_new_item   JSONB;
  v_old_len    INT := COALESCE(jsonb_array_length(OLD.announcements), 0);
  v_new_len    INT := COALESCE(jsonb_array_length(NEW.announcements), 0);
BEGIN
  IF v_new_len <= v_old_len THEN
    RETURN NEW;
  END IF;

  v_new_item := NEW.announcements -> (v_new_len - 1);

  SELECT array_agg(DISTINCT r.user_id) INTO v_recipients
  FROM public.registrations r
  JOIN public.notification_preferences np ON np.user_id = r.user_id
  WHERE
    r.meeting_id = NEW.id
    AND r.status IN ('registered', 'invited', 'attended')
    AND np.event_announcements = true;

  IF v_recipients IS NOT NULL THEN
    PERFORM public.invoke_send_push_notification(
      v_recipients,
      NEW.title || ': ' || COALESCE(v_new_item->>'title', 'New announcement'),
      COALESCE(v_new_item->>'content', ''),
      jsonb_build_object('meetingId', NEW.id::text, 'type', 'announcement')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_meeting_announcement
  AFTER UPDATE OF announcements ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.on_meeting_announcement();

-- ─── Trigger: registration status change ──────────────────────────────────────
-- Notifies a user when:
--   • They move from waitlist → registered (spot confirmed)
--   • They receive an invite (status becomes 'invited')

CREATE OR REPLACE FUNCTION public.on_registration_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meeting public.meetings%ROWTYPE;
  v_prefs   public.notification_preferences%ROWTYPE;
  v_title   TEXT;
  v_body    TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('registered', 'invited') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = NEW.user_id;

  IF NOT FOUND OR NOT v_prefs.registration_updates THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_meeting FROM public.meetings WHERE id = NEW.meeting_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.status = 'registered' AND OLD.status = 'waitlist' THEN
    v_title := 'You''re in! 🎉';
    v_body  := 'Your waitlist spot for "' || v_meeting.title || '" is now confirmed.';
  ELSIF NEW.status = 'invited' THEN
    v_title := 'You''ve been invited!';
    v_body  := 'You received a special invite to "' || v_meeting.title || '".';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.invoke_send_push_notification(
    ARRAY[NEW.user_id],
    v_title,
    v_body,
    jsonb_build_object('meetingId', NEW.meeting_id::text, 'type', 'registration_update')
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_registration_status
  AFTER UPDATE OF status ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.on_registration_status_change();
