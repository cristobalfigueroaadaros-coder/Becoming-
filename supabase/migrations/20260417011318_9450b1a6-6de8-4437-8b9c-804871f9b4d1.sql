-- Replace broad public SELECT with two scoped policies:
-- (a) anonymous/public viewers can read a specific file by exact path (no bucket-wide listing)
-- (b) authenticated users can list/view files inside their own folder

DROP POLICY IF EXISTS "Anyone can view creator images" ON storage.objects;

CREATE POLICY "Public can view creator image by path"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'creator-images'
  AND name = (current_setting('request.path', true))
);

CREATE POLICY "Users can list their own creator images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'creator-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);