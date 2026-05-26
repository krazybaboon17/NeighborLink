
-- 1) Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 2) Helper function: insert notification (SECURITY DEFINER so triggers can insert
--    on behalf of other users)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link);
END;
$$;

-- 3) Trigger: new offer => notify task owner
CREATE OR REPLACE FUNCTION public.notify_on_new_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_title text;
BEGIN
  SELECT user_id, title INTO v_owner, v_title
  FROM public.tasks WHERE id = NEW.task_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.helper_id THEN
    PERFORM public.create_notification(
      v_owner,
      'new_offer',
      'New offer on your task',
      'Someone made an offer on "' || COALESCE(v_title,'your task') || '"',
      '/tasks/' || NEW.task_id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_offer ON public.offers;
CREATE TRIGGER trg_notify_new_offer
AFTER INSERT ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_offer();

-- 4) Trigger: offer accepted => notify helper
CREATE OR REPLACE FUNCTION public.notify_on_offer_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    SELECT title INTO v_title FROM public.tasks WHERE id = NEW.task_id;
    PERFORM public.create_notification(
      NEW.helper_id,
      'offer_accepted',
      'Your offer was accepted',
      'You were selected for "' || COALESCE(v_title,'a task') || '"',
      '/tasks/' || NEW.task_id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_offer_accepted ON public.offers;
CREATE TRIGGER trg_notify_offer_accepted
AFTER UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_offer_accepted();

-- 5) Trigger: new message => notify receiver
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name text;
BEGIN
  SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  PERFORM public.create_notification(
    NEW.receiver_id,
    'new_message',
    'New message',
    COALESCE(v_sender_name,'A neighbor') || ': ' || LEFT(NEW.content, 80),
    '/messages?task=' || NEW.task_id::text || '&user=' || NEW.sender_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();

-- 6) Trigger: task status change => notify involved
CREATE OR REPLACE FUNCTION public.notify_on_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_helper uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT helper_id INTO v_helper FROM public.offers
      WHERE id = NEW.selected_offer_id;

    -- Helper notifications
    IF v_helper IS NOT NULL AND v_helper <> NEW.user_id THEN
      IF NEW.status = 'pending_review' THEN
        PERFORM public.create_notification(
          NEW.user_id, 'task_pending_review',
          'Helper submitted task for review',
          'Review and approve "' || NEW.title || '"',
          '/tasks/' || NEW.id::text
        );
      ELSIF NEW.status = 'completed' THEN
        PERFORM public.create_notification(
          v_helper, 'task_completed',
          'Task marked complete',
          'The poster approved "' || NEW.title || '"',
          '/tasks/' || NEW.id::text
        );
      ELSIF NEW.status = 'assigned' AND OLD.status = 'pending_review' THEN
        PERFORM public.create_notification(
          v_helper, 'task_changes_requested',
          'Changes requested',
          'The poster asked for changes on "' || NEW.title || '"',
          '/tasks/' || NEW.id::text
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_task_status ON public.tasks;
CREATE TRIGGER trg_notify_task_status
AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_on_task_status_change();
