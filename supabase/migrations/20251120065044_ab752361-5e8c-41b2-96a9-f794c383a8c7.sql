-- Create voice-notes bucket for shadow encounter recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-notes',
  'voice-notes',
  false,
  10485760,
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg']
);

-- Allow authenticated users to upload their own voice notes
CREATE POLICY "Users can upload their own voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own voice notes
CREATE POLICY "Users can read their own voice notes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own voice notes
CREATE POLICY "Users can delete their own voice notes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);