
-- =========================================================
-- 1. Storage update policies
-- =========================================================
CREATE POLICY "Users update own verification files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'verifications' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'verifications' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own chat images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-images' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'chat-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own chat voice"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-voice' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'chat-voice' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- =========================================================
-- 2. Avatars: drop broad listing policy.
-- Public bucket continues to serve files via direct URLs.
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- =========================================================
-- 3. mailing_list: validate email instead of WITH CHECK (true)
-- =========================================================
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.mailing_list;
CREATE POLICY "Anyone can subscribe valid email"
ON public.mailing_list FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) <= 320
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- =========================================================
-- 4. Realtime topic policies: drop wildcard branches
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can receive own realtime messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can receive own realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated users can receive own realtime messages"
ON realtime.messages FOR SELECT TO authenticated
USING (realtime.topic() = ('user:' || (auth.uid())::text));

-- =========================================================
-- 5. Parental consents: private storage for parent PII
-- =========================================================
CREATE TABLE IF NOT EXISTS public.parental_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  offer_id UUID NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.parental_consents TO authenticated;
GRANT ALL ON public.parental_consents TO service_role;

ALTER TABLE public.parental_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own parental consents"
ON public.parental_consents FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all parental consents"
ON public.parental_consents FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Owners can insert own parental consents"
ON public.parental_consents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 6. Strip [YN_APPROVAL:...] from tasks.description / offers.message
--    and move parent PII into parental_consents
-- =========================================================
CREATE OR REPLACE FUNCTION public.strip_yn_approval_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  marker TEXT;
  payload TEXT;
  parsed JSONB;
BEGIN
  IF NEW.description IS NULL THEN RETURN NEW; END IF;
  marker := substring(NEW.description from '\[YN_APPROVAL:(\{[^\]]*\})\]');
  IF marker IS NOT NULL THEN
    BEGIN
      parsed := marker::jsonb;
      INSERT INTO public.parental_consents (task_id, user_id, parent_name, parent_email)
      VALUES (
        NEW.id,
        NEW.user_id,
        COALESCE(parsed->>'parentName', ''),
        COALESCE(parsed->>'parentEmail', '')
      );
    EXCEPTION WHEN OTHERS THEN
      -- ignore parse errors but still strip the marker
      NULL;
    END;
    NEW.description := regexp_replace(NEW.description, '\s*\[YN_APPROVAL:[^\]]*\]\s*', ' ', 'g');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.strip_yn_approval_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  marker TEXT;
  parsed JSONB;
BEGIN
  IF NEW.message IS NULL THEN RETURN NEW; END IF;
  marker := substring(NEW.message from '\[YN_APPROVAL:(\{[^\]]*\})\]');
  IF marker IS NOT NULL THEN
    BEGIN
      parsed := marker::jsonb;
      INSERT INTO public.parental_consents (offer_id, user_id, parent_name, parent_email)
      VALUES (
        NEW.id,
        NEW.helper_id,
        COALESCE(parsed->>'parentName', ''),
        COALESCE(parsed->>'parentEmail', '')
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    NEW.message := regexp_replace(NEW.message, '\s*\[YN_APPROVAL:[^\]]*\]\s*', ' ', 'g');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS strip_yn_approval_task_insert ON public.tasks;
CREATE TRIGGER strip_yn_approval_task_insert
BEFORE INSERT OR UPDATE OF description ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.strip_yn_approval_task();

DROP TRIGGER IF EXISTS strip_yn_approval_offer_insert ON public.offers;
CREATE TRIGGER strip_yn_approval_offer_insert
BEFORE INSERT OR UPDATE OF message ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.strip_yn_approval_offer();

-- Backfill: redact existing rows (parent PII already exposed historically; clean it now)
UPDATE public.tasks
SET description = regexp_replace(description, '\s*\[YN_APPROVAL:[^\]]*\]\s*', ' ', 'g')
WHERE description ~ '\[YN_APPROVAL:';

UPDATE public.offers
SET message = regexp_replace(message, '\s*\[YN_APPROVAL:[^\]]*\]\s*', ' ', 'g')
WHERE message ~ '\[YN_APPROVAL:';

-- =========================================================
-- 7. Server-side content moderation triggers
--    Narrow scope: block sexual/explicit content, graphic violence/threats,
--    hate speech, and obvious scam patterns. Mirrors the client policy.
-- =========================================================
CREATE OR REPLACE FUNCTION public.contains_prohibited_content(input TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT input ~* '(\m(porn|nude|nudes|sexual|sexting|nsfw|onlyfans|escort|fuck|c\*nt|rape)\M)'
      OR input ~* '(\m(kill yourself|kys|i will kill you|murder you|shoot you|stab you|behead)\M)'
      OR input ~* '(\m(n[i1]gger|f[a4]gg[o0]t|k[i1]ke|chink|sp[i1]c|tr[a4]nny)\M)'
      OR input ~* '(\m(send (me )?(crypto|btc|bitcoin|eth|gift cards?)|wire (transfer|money) to|western union to|cash app me)\M)';
$$;

CREATE OR REPLACE FUNCTION public.moderate_task_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.contains_prohibited_content(COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '')) THEN
    RAISE EXCEPTION 'Content blocked: prohibited language detected'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_message_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.contains_prohibited_content(COALESCE(NEW.content, '')) THEN
    RAISE EXCEPTION 'Message blocked: prohibited language detected'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS moderate_task_content_trg ON public.tasks;
CREATE TRIGGER moderate_task_content_trg
BEFORE INSERT OR UPDATE OF title, description ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.moderate_task_content();

DROP TRIGGER IF EXISTS moderate_message_content_trg ON public.messages;
CREATE TRIGGER moderate_message_content_trg
BEFORE INSERT OR UPDATE OF content ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.moderate_message_content();

-- =========================================================
-- 8. Revoke EXECUTE on internal SECURITY DEFINER functions
--    Keep functions used inside RLS for the {public}/anon paths
--    (is_admin, has_role, user_has_task_access) callable.
-- =========================================================

-- Trigger-only functions: never called by clients
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_email_verified() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_admin_to_seed_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_offer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_offer_accepted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_task_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.strip_yn_approval_task() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.strip_yn_approval_offer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.moderate_task_content() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.moderate_message_content() FROM PUBLIC, anon, authenticated;

-- Internal-only: notification helper
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- Admin-only: keep authenticated, deny anon (functions self-check is_admin)
REVOKE EXECUTE ON FUNCTION public.admin_delete_task(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_task(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_approve_verification(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_verification(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reject_verification(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_verification(uuid) TO authenticated;

-- check_is_admin / submit_review: signed-in callers only
REVOKE EXECUTE ON FUNCTION public.check_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_review(uuid, uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid, uuid, integer, text) TO authenticated;
