-- Update the viewing policy to show both open tasks AND user's own tasks
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;

CREATE POLICY "Tasks are viewable by everyone and owners" ON public.tasks
    FOR SELECT
    USING (
        status = 'open'  -- Anyone can see open tasks
        OR               -- OR
        auth.uid() = user_id  -- Users can see their own tasks regardless of status
    );