
CREATE POLICY "Users upload voice in own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-voice' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own voice"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-voice' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Authenticated read voice"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-voice');
