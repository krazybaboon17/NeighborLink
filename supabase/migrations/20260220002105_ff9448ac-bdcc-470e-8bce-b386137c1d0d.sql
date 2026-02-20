
-- Fix 1: Add authorization checks to submit_review
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
  v_task_owner UUID;
BEGIN
  -- Verify caller owns the task
  SELECT user_id INTO v_task_owner
  FROM public.tasks
  WHERE id = p_task_id;

  IF v_task_owner IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only task owner can submit review';
  END IF;

  -- Verify helper was assigned to this task
  IF NOT EXISTS (
    SELECT 1 FROM public.offers
    WHERE task_id = p_task_id
    AND helper_id = p_helper_id
    AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Helper was not assigned to this task';
  END IF;

  -- Validate rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

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

  -- Update helper's profile
  UPDATE public.profiles
  SET
    rating = COALESCE(v_new_rating, 0),
    completed_tasks = COALESCE(completed_tasks, 0) + 1
  WHERE id = p_helper_id;
END;
$$;

-- Fix 2: Add admin storage policy for verification images
CREATE POLICY "Admins can view verification images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verifications' AND
  public.is_admin()
);
