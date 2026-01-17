-- Create reviews table to store all reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  helper_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(task_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are viewable by everyone (for showing ratings)
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (true);

-- Only task owners can create reviews for their tasks
CREATE POLICY "Task owners can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = reviews.task_id AND tasks.user_id = auth.uid()
  )
);

-- Create the submit_review function
CREATE OR REPLACE FUNCTION public.submit_review(
  p_task_id UUID,
  p_helper_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_rating NUMERIC;
  v_review_count INTEGER;
BEGIN
  -- Insert the review
  INSERT INTO public.reviews (task_id, reviewer_id, helper_id, rating, comment)
  VALUES (p_task_id, auth.uid(), p_helper_id, p_rating, p_comment);

  -- Update task status to completed
  UPDATE public.tasks
  SET status = 'completed'
  WHERE id = p_task_id AND user_id = auth.uid();

  -- Calculate new average rating for the helper
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)
  INTO v_new_rating, v_review_count
  FROM public.reviews
  WHERE helper_id = p_helper_id;

  -- Update helper's profile with new rating and increment completed_tasks
  UPDATE public.profiles
  SET 
    rating = COALESCE(v_new_rating, 0),
    completed_tasks = COALESCE(completed_tasks, 0) + 1
  WHERE id = p_helper_id;
END;
$$;