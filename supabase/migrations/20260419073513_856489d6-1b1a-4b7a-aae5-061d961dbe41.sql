-- 1. Fix realtime cross-user broadcast leak
DROP POLICY IF EXISTS "Authenticated users can read own-topic realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can write to own-topic realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated users can read own-topic realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('user:' || (auth.uid())::text || ':%')
  OR realtime.topic() = ('user:' || (auth.uid())::text)
);

CREATE POLICY "Authenticated users can write to own-topic realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE ('user:' || (auth.uid())::text || ':%')
  OR realtime.topic() = ('user:' || (auth.uid())::text)
);

-- 2. Pin search_path on email queue functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;