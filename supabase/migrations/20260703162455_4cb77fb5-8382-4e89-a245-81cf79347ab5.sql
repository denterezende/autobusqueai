
-- Lock down SECURITY DEFINER + helper trigger fns from being called via Data API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage policies for private bucket 'part-images': owner is auth.uid(), stored under <uid>/<file>
CREATE POLICY "part-images owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'part-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "part-images owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'part-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "part-images owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'part-images' AND auth.uid()::text = (storage.foldername(name))[1]);
