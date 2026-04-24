
-- 1. DELETE policies for user-owned data
CREATE POLICY "Helpers can delete own pending offers"
ON public.offers FOR DELETE TO authenticated
USING (auth.uid() = helper_id AND status = 'pending');

CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own volunteer hours"
ON public.volunteer_hours FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending verifications"
ON public.verifications FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- 2. Rebuild public_profiles view: remove is_young_neighbor + use security_invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  full_name,
  avatar_url,
  bio,
  rating,
  completed_tasks,
  is_helper,
  verified,
  skills,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Restrict completion-photos bucket reads to task owner + assigned helper
DROP POLICY IF EXISTS "Users can read completion photos" ON storage.objects;

CREATE POLICY "Task parties can read completion photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'completion-photos'
  AND (
    -- Uploader (path starts with their uid)
    (storage.foldername(name))[1] = auth.uid()::text
    -- Or accepted helper for the task referenced by completion_photo_url
    OR EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.offers o ON o.task_id = t.id
      WHERE o.helper_id = auth.uid()
        AND o.status = 'accepted'
        AND t.completion_photo_url IS NOT NULL
        AND t.completion_photo_url LIKE '%' || name || '%'
    )
  )
);

-- 4. Close pending-offer task-visibility loophole
CREATE OR REPLACE FUNCTION public.user_has_task_access(task_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM offers o
    WHERE o.task_id = user_has_task_access.task_id
      AND o.helper_id = auth.uid()
      AND o.status = 'accepted'
  );
END;
$$;

-- 5. Realtime authorization: restrict message channel subscriptions
-- Enable RLS on realtime.messages (Supabase Realtime authorization)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only receive realtime messages on topics they participate in.
-- Topic convention: messages broadcast on the 'messages' channel; we additionally allow
-- topic patterns scoped to the user id (e.g. user:<uid>) and reject anonymous access.
CREATE POLICY "Authenticated users can receive own realtime messages"
ON realtime.messages FOR SELECT TO authenticated
USING (
  -- User-scoped topics: "user:<auth.uid()>"
  realtime.topic() = 'user:' || auth.uid()::text
  -- Or task/conversation topics that include the user's id
  OR realtime.topic() LIKE '%' || auth.uid()::text || '%'
);
