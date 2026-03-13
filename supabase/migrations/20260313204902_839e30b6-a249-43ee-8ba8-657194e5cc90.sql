
-- Function for task owner to set helper's zelle_id during payment
CREATE OR REPLACE FUNCTION public.set_helper_zelle_id(p_task_id uuid, p_helper_id uuid, p_zelle_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_task_owner uuid;
BEGIN
  -- Verify caller owns the task
  SELECT user_id INTO v_task_owner
  FROM public.tasks
  WHERE id = p_task_id;

  IF v_task_owner IS NULL OR v_task_owner != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: only the task owner can set helper payment info';
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

  -- Update the helper's zelle_id
  UPDATE public.profiles
  SET zelle_id = p_zelle_id
  WHERE id = p_helper_id;

  RETURN true;
END;
$$;
