-- Users can upload to their own folder inside chat-images
CREATE POLICY "Users upload own chat images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read any chat image (signed URLs limit access in practice; bucket is private so listing requires signed access)
CREATE POLICY "Authenticated read chat images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-images');

-- Users can delete their own chat images
CREATE POLICY "Users delete own chat images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);