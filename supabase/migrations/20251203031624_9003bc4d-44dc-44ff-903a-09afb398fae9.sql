-- Create table to track Future Self messages history
CREATE TABLE public.future_self_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  emotional_tone TEXT,
  snapshot_id UUID,
  shown_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  was_received BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_future_self_messages_user_id ON public.future_self_messages(user_id);
CREATE INDEX idx_future_self_messages_created_at ON public.future_self_messages(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.future_self_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own future self messages"
  ON public.future_self_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own future self messages"
  ON public.future_self_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own future self messages"
  ON public.future_self_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Add last message timestamp to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_future_self_message_at TIMESTAMPTZ;