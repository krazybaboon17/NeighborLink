
-- Task reports table for user reporting system
CREATE TABLE public.task_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, reporter_id)
);

ALTER TABLE public.task_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report tasks"
ON public.task_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view own reports"
ON public.task_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.task_reports
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update reports"
ON public.task_reports
FOR UPDATE
TO authenticated
USING (is_admin());

CREATE INDEX idx_task_reports_task_id ON public.task_reports(task_id);
CREATE INDEX idx_task_reports_status ON public.task_reports(status);
