-- Rebuild public_profiles to be visible to everyone (safe columns only).
-- Previously security_invoker blocked anon/auth users due to profiles RLS.
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = off) AS
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