
-- 1. Fix privilege-escalation on profiles UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND verified         IS NOT DISTINCT FROM (SELECT p.verified         FROM public.profiles p WHERE p.id = auth.uid())
  AND rating           IS NOT DISTINCT FROM (SELECT p.rating           FROM public.profiles p WHERE p.id = auth.uid())
  AND completed_tasks  IS NOT DISTINCT FROM (SELECT p.completed_tasks  FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2. Allow authenticated users to SELECT profiles (needed for app + security_invoker view)
CREATE POLICY "Authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Rebuild public_profiles view with security_invoker=on so it respects caller RLS
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT id, full_name, avatar_url, bio, rating, completed_tasks,
       is_helper, verified, skills, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 4. Storage DELETE policies scoped to owning user (folder name = auth.uid())
DROP POLICY IF EXISTS "Users can delete own avatar files" ON storage.objects;
CREATE POLICY "Users can delete own avatar files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own completion photos" ON storage.objects;
CREATE POLICY "Users can delete own completion photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'completion-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own verification files" ON storage.objects;
CREATE POLICY "Users can delete own verification files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'verifications' AND auth.uid()::text = (storage.foldername(name))[1]);
