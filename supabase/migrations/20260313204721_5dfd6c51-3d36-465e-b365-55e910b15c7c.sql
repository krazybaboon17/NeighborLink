
-- Recreate view without security_invoker so it can read all profiles
-- but only exposes safe columns
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
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
