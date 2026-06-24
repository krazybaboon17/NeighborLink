CREATE TABLE public.task_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_time_slots_task_id ON public.task_time_slots(task_id);

GRANT SELECT ON public.task_time_slots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_time_slots TO authenticated;
GRANT ALL ON public.task_time_slots TO service_role;

ALTER TABLE public.task_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task time slots"
ON public.task_time_slots FOR SELECT
USING (true);

CREATE POLICY "Task owner can insert time slots"
ON public.task_time_slots FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()));

CREATE POLICY "Task owner can update time slots"
ON public.task_time_slots FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()));

CREATE POLICY "Task owner can delete time slots"
ON public.task_time_slots FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()));