
-- Create console_thread_messages table for persistent thread history
CREATE TABLE public.console_thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  mentor_type text,
  mentor_name text,
  mentor_icon text,
  mentor_color text,
  card_type text,
  card_data jsonb,
  phase text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.console_thread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own thread messages"
  ON public.console_thread_messages
  FOR ALL
  USING (auth.uid() = user_id);

-- Add console_thread_phase to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS console_thread_phase text;
