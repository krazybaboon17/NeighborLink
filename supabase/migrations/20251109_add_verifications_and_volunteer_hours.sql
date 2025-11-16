-- Create verifications and volunteer_hours tables

-- verifications: stores uploaded ID/selfie paths and status
CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_image text,
  selfie_image text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- volunteer_hours: records hours earned by volunteers for a task
CREATE TABLE IF NOT EXISTS public.volunteer_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  hours integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Ensure profiles has a verified column (some generated types use `verified`)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
