-- 1) Realtime scoping for notification channel
DROP POLICY IF EXISTS "Users can subscribe to own notifications channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to own notifications channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('notifs-' || (auth.uid())::text)
);

-- 2) Lock down offers UPDATE policy
DROP POLICY IF EXISTS "Task owners can update offers" ON public.offers;
CREATE POLICY "Task owners can update offer status"
ON public.offers
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.tasks WHERE id = offers.task_id)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.tasks WHERE id = offers.task_id)
  AND status IN ('pending','accepted','rejected')
);

-- 3) Volunteer hours: only record for an accepted helper of that task
DROP POLICY IF EXISTS "Task owners can record volunteer hours" ON public.volunteer_hours;
CREATE POLICY "Task owners can record volunteer hours for accepted helper"
ON public.volunteer_hours
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = volunteer_hours.task_id
      AND t.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.task_id = volunteer_hours.task_id
      AND o.helper_id = volunteer_hours.user_id
      AND o.status = 'accepted'
  )
);