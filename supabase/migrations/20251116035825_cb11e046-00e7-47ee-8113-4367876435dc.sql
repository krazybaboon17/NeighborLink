-- Drop the problematic policies
DROP POLICY IF EXISTS "Anyone can view open tasks" ON tasks;
DROP POLICY IF EXISTS "Helpers can view selected tasks" ON tasks;

-- Create a security definer function to check if user has access via offers
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
      AND (o.status = 'accepted' OR o.status = 'pending')
  );
END;
$$;

-- Recreate the view policy without recursion
CREATE POLICY "Tasks are viewable by everyone and owners" ON tasks
  FOR SELECT
  USING (
    status = 'open'  -- Anyone can see open tasks
    OR auth.uid() = user_id  -- Users can see their own tasks
    OR public.user_has_task_access(id)  -- Helpers with offers can see tasks
  );