-- Fix RLS policy to allow anonymous users to view open tasks
-- This fixes the issue where tasks don't show up on Lovable but work on localhost

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view open tasks" ON public.tasks;

-- Create a new policy that allows both anonymous and authenticated users to view open tasks
-- and allows task owners to view their own tasks regardless of status
CREATE POLICY "Public can view open tasks and owners can view all their tasks"
  ON public.tasks FOR SELECT
  USING (
    status = 'open'  -- Anyone (including anonymous users) can see open tasks
    OR 
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)  -- Authenticated users can see their own tasks
  );

-- Only update profiles policy if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Drop and recreate profiles policy to ensure anonymous access
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone including anonymous" ON public.profiles;
        
        CREATE POLICY "Public profiles are viewable by everyone including anonymous"
          ON public.profiles FOR SELECT
          USING (true);  -- Allow anonymous access to profiles for task browsing
    END IF;
END
$$;
