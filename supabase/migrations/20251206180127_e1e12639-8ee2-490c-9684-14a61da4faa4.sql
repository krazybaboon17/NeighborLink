-- Add columns to profiles for onboarding data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS current_state text,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS is_young_neighbor boolean DEFAULT false;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_young_neighbor ON public.profiles(is_young_neighbor) WHERE is_young_neighbor = true;

-- Update RLS policy to allow admins to view all profile details
CREATE POLICY "Admins can view all profile details"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());