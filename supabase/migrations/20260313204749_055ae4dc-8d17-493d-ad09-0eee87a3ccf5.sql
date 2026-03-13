
-- Remove the broad policy that exposes all columns
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;

-- Recreate the view as security definer (no security_invoker) 
-- This is intentional: the view only exposes safe columns while base table is locked down
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
