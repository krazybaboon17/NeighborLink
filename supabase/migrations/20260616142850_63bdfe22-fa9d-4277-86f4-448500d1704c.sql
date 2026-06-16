
-- 1) Profiles: drop broad SELECT policy
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
-- "Users can view own full profile" and "Admins can view all profile details" remain.
-- Other users should read via public.public_profiles view.

-- 2) Storage: chat-images participant-only SELECT
DROP POLICY IF EXISTS "Authenticated read chat images" ON storage.objects;
CREATE POLICY "Participants read chat images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-images'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.image_url LIKE '%' || storage.objects.name || '%'
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
    OR public.is_admin()
  )
);

-- 3) Storage: chat-voice participant-only SELECT
DROP POLICY IF EXISTS "Authenticated read voice" ON storage.objects;
CREATE POLICY "Participants read chat voice"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-voice'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.voice_url LIKE '%' || storage.objects.name || '%'
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
    OR public.is_admin()
  )
);

-- 4) Offers: prevent price/message tampering on task-owner UPDATE
DROP POLICY IF EXISTS "Task owners can update offer status" ON public.offers;
CREATE POLICY "Task owners can update offer status"
ON public.offers FOR UPDATE TO authenticated
USING (
  auth.uid() IN (SELECT t.user_id FROM public.tasks t WHERE t.id = offers.task_id)
)
WITH CHECK (
  auth.uid() IN (SELECT t.user_id FROM public.tasks t WHERE t.id = offers.task_id)
  AND status = ANY (ARRAY['pending','accepted','rejected'])
  AND price = (SELECT o.price FROM public.offers o WHERE o.id = offers.id)
  AND helper_id = (SELECT o.helper_id FROM public.offers o WHERE o.id = offers.id)
  AND task_id = (SELECT o.task_id FROM public.offers o WHERE o.id = offers.id)
  AND COALESCE(message,'') = COALESCE((SELECT o.message FROM public.offers o WHERE o.id = offers.id),'')
);

-- 5) Realtime: scope reactions and notifications channels to participants
CREATE POLICY "Reactions realtime scoped to participants"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'reactions:%'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id::text = split_part(realtime.topic(), ':', 2)
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

CREATE POLICY "Notifications realtime scoped to owner"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = ('notifications:' || (auth.uid())::text)
);
