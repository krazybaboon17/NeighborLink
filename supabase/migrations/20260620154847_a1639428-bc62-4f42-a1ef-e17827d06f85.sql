
-- Approximate (publicly visible) location coordinates on tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS approx_lat numeric,
  ADD COLUMN IF NOT EXISTS approx_lng numeric;

-- Precise location lives in a separate table, gated by RLS so only the
-- task owner and the assigned helper can read it.
CREATE TABLE IF NOT EXISTS public.task_locations (
  task_id uuid PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_locations TO authenticated;
GRANT ALL ON public.task_locations TO service_role;

ALTER TABLE public.task_locations ENABLE ROW LEVEL SECURITY;

-- Owner can manage their task's precise location
CREATE POLICY "Owner can manage task location"
ON public.task_locations
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid())
);

-- Assigned (accepted) helper can read the precise location
CREATE POLICY "Accepted helper can read task location"
ON public.task_locations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.task_id = task_locations.task_id
      AND o.helper_id = auth.uid()
      AND o.status = 'accepted'
  )
);

-- Admins can read all
CREATE POLICY "Admins can read all task locations"
ON public.task_locations
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE TRIGGER update_task_locations_updated_at
BEFORE UPDATE ON public.task_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
