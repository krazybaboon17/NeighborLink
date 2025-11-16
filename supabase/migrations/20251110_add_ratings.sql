-- Create ratings table for task ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Policies for ratings
CREATE POLICY "Users can view ratings for their tasks or where they were rated"
  ON public.ratings FOR SELECT
  USING (
    auth.uid() = rater_id OR 
    auth.uid() = rated_user_id OR
    auth.uid() IN (SELECT user_id FROM public.tasks WHERE id = task_id)
  );

CREATE POLICY "Users can create ratings for completed tasks"
  ON public.ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE id = task_id 
      AND status = 'completed'
      AND (user_id = auth.uid() OR selected_offer_id IN (
        SELECT id FROM public.offers WHERE helper_id = auth.uid() AND task_id = ratings.task_id
      ))
    )
  );

-- Function to update profile rating when a new rating is added
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  -- Calculate average rating for the rated user
  SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00)
  INTO avg_rating
  FROM public.ratings
  WHERE rated_user_id = NEW.rated_user_id;
  
  -- Update the profile
  UPDATE public.profiles
  SET rating = avg_rating
  WHERE id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile rating
CREATE TRIGGER update_profile_rating_trigger
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_rating();

