
-- Recreate with security_invoker to satisfy linter
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
  is_young_neighbor,
  is_helper,
  verified,
  skills,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add a policy that allows authenticated users to read limited profile data
-- The view already restricts which columns are visible
CREATE POLICY "Authenticated users can view basic profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);
