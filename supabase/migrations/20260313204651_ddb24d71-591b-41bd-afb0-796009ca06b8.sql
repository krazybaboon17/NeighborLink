
-- 1. Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Owners can see their own full profile
CREATE POLICY "Users can view own full profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 3. Admins can already view all profiles (policy exists)

-- 4. Create a safe public view for other users' profiles (no sensitive fields)
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

-- 5. Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 6. Create a SECURITY DEFINER function to safely fetch a helper's zelle_id
-- Only the task owner (who has an accepted offer) can retrieve it
CREATE OR REPLACE FUNCTION public.get_helper_zelle_id(p_task_id uuid, p_helper_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_zelle_id text;
  v_task_owner uuid;
BEGIN
  -- Verify caller owns the task
  SELECT user_id INTO v_task_owner
  FROM public.tasks
  WHERE id = p_task_id;

  IF v_task_owner IS NULL OR v_task_owner != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: only the task owner can access helper payment info';
  END IF;

  -- Verify helper has an accepted offer on this task
  IF NOT EXISTS (
    SELECT 1 FROM public.offers
    WHERE task_id = p_task_id
    AND helper_id = p_helper_id
    AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'No accepted offer found for this helper on this task';
  END IF;

  -- Get the zelle_id
  SELECT zelle_id INTO v_zelle_id
  FROM public.profiles
  WHERE id = p_helper_id;

  RETURN v_zelle_id;
END;
$$;
