
-- Add completion_photo_url column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completion_photo_url text;

-- Create storage bucket for completion photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('completion-photos', 'completion-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to completion-photos bucket
CREATE POLICY "Users can upload completion photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'completion-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own completion photos, and task owners to read photos for their tasks
CREATE POLICY "Users can read completion photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'completion-photos');
