-- Create storage buckets for verifications (private) and avatars (public)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('verifications', 'verifications', false),
  ('avatars', 'avatars', true);

-- Storage RLS Policies for Verifications Bucket (STRICT ACCESS)

-- Users can upload their own verification images
CREATE POLICY "Users upload own verification images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own verification images
CREATE POLICY "Users view own verification images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage RLS Policies for Avatars Bucket (PUBLIC DISPLAY)

-- Users can upload their own avatars
CREATE POLICY "Users upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view avatars (needed for public profile display)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can update their own avatars
CREATE POLICY "Users update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);