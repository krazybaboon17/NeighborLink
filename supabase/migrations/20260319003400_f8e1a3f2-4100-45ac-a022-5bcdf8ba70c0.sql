
CREATE TABLE public.mailing_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mailing_list ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe" ON public.mailing_list
  FOR INSERT TO public
  WITH CHECK (true);

-- Only admins can view the list
CREATE POLICY "Admins can view mailing list" ON public.mailing_list
  FOR SELECT TO authenticated
  USING (public.is_admin());
