-- Create conversation_breakthroughs table to detect and store breakthrough moments
CREATE TABLE public.conversation_breakthroughs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mentor_type TEXT NOT NULL,
  breakthrough_title TEXT NOT NULL,
  breakthrough_description TEXT NOT NULL,
  source_conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  actionable_next_step TEXT,
  converted_to_goal BOOLEAN NOT NULL DEFAULT false,
  goal_id UUID,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create council_notifications table for follow-up messages
CREATE TABLE public.council_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'breakthrough_followup',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  context_data JSONB DEFAULT '{}'::jsonb,
  breakthrough_id UUID REFERENCES public.conversation_breakthroughs(id),
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.conversation_breakthroughs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversation_breakthroughs
CREATE POLICY "Users can view own breakthroughs"
  ON public.conversation_breakthroughs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own breakthroughs"
  ON public.conversation_breakthroughs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own breakthroughs"
  ON public.conversation_breakthroughs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for council_notifications
CREATE POLICY "Users can view own council notifications"
  ON public.council_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own council notifications"
  ON public.council_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own council notifications"
  ON public.council_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);