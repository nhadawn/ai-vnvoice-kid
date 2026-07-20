
CREATE POLICY "Users manage own card audio" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'card-audio' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'card-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
