-- Create mentor_daily_outreach table for tracking daily mentor messages
CREATE TABLE public.mentor_daily_outreach (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mentor_type TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'goal_check', 'idea', 'question', 'encouragement', 'journey_suggestion'
  context_source TEXT, -- 'council_meeting', 'daily_goal', 'life_domain', 'pattern'
  context_data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE,
  responded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add handoff_chain_id to conversation_handoffs for tracking multi-mentor journeys
ALTER TABLE public.conversation_handoffs 
ADD COLUMN handoff_chain_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN chain_position INTEGER DEFAULT 1,
ADD COLUMN journey_topic TEXT;

-- Enable RLS on mentor_daily_outreach
ALTER TABLE public.mentor_daily_outreach ENABLE ROW LEVEL SECURITY;

-- RLS policies for mentor_daily_outreach
CREATE POLICY "Users can view own outreach messages"
ON public.mentor_daily_outreach FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own outreach messages"
ON public.mentor_daily_outreach FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outreach messages"
ON public.mentor_daily_outreach FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_mentor_daily_outreach_user_date ON public.mentor_daily_outreach(user_id, created_at DESC);
CREATE INDEX idx_conversation_handoffs_chain ON public.conversation_handoffs(handoff_chain_id);