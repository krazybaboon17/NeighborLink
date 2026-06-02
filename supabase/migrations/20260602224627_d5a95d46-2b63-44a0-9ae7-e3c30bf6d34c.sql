-- Grant admin role to krazybaboon@outlook.com if the account exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'krazybaboon@outlook.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Trigger so that whenever krazybaboon@outlook.com signs up later, they auto-receive admin role
CREATE OR REPLACE FUNCTION public.grant_admin_to_seed_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'krazybaboon@outlook.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_admin_to_seed_email_trg ON auth.users;
CREATE TRIGGER grant_admin_to_seed_email_trg
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_to_seed_email();

-- Admin RPC to delete any task
CREATE OR REPLACE FUNCTION public.admin_delete_task(p_task_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  DELETE FROM public.tasks WHERE id = p_task_id;
  RETURN true;
END;
$$;

-- Admin can view all tasks (regardless of status) via additional RLS policy
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
CREATE POLICY "Admins can view all tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (public.is_admin());