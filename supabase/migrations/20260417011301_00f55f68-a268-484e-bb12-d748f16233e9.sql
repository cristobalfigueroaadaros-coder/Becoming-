-- 1) Tighten creator-images uploads: enforce folder ownership on INSERT and UPDATE
DROP POLICY IF EXISTS "Users can upload creator images" ON storage.objects;
CREATE POLICY "Users can upload own creator images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own creator images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) premium_waitlist: allow users to manage their own row by email
CREATE POLICY "Users can view their own waitlist entry"
ON public.premium_waitlist
FOR SELECT
TO authenticated
USING (email = auth.email());

CREATE POLICY "Users can update their own waitlist entry"
ON public.premium_waitlist
FOR UPDATE
TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());

CREATE POLICY "Users can delete their own waitlist entry"
ON public.premium_waitlist
FOR DELETE
TO authenticated
USING (email = auth.email());

-- 3) Realtime authorization: enable RLS on realtime.messages and scope topics
-- Topics must follow the convention `user:{auth.uid()}:...` for broadcast/presence,
-- or use postgres_changes (already governed by table RLS).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read own-topic realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'postgres_changes'
  OR (realtime.topic() LIKE ('user:' || auth.uid()::text || ':%'))
  OR (realtime.topic() = ('user:' || auth.uid()::text))
);

CREATE POLICY "Authenticated users can write to own-topic realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  extension = 'postgres_changes'
  OR (realtime.topic() LIKE ('user:' || auth.uid()::text || ':%'))
  OR (realtime.topic() = ('user:' || auth.uid()::text))
);