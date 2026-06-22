
CREATE POLICY "card_images_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'card-images' AND EXISTS (
  SELECT 1 FROM public.children c
  WHERE c.parent_id = auth.uid() AND c.id::text = (storage.foldername(name))[1]
));
CREATE POLICY "card_images_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'card-images' AND EXISTS (
  SELECT 1 FROM public.children c
  WHERE c.parent_id = auth.uid() AND c.id::text = (storage.foldername(name))[1]
));
CREATE POLICY "card_images_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'card-images' AND EXISTS (
  SELECT 1 FROM public.children c
  WHERE c.parent_id = auth.uid() AND c.id::text = (storage.foldername(name))[1]
));
