-- Create saved_insights table for user-driven insight capture
CREATE TABLE public.saved_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_text TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_mentor TEXT,
  source_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- For Creation Lab visibility
  is_concept BOOLEAN NOT NULL DEFAULT false,
  
  -- For "Go Deeper Later" follow-up
  followup_requested BOOLEAN NOT NULL DEFAULT false,
  followup_mentor TEXT,
  followup_triggered_at TIMESTAMPTZ,
  
  -- Archiving
  archived_at TIMESTAMPTZ,
  
  CONSTRAINT valid_source_type CHECK (source_type IN (
    'council_insight', 'mentor_perspective', 'council_banter', 
    'emotional_reflection', 'council_guidance', 'mentor_message', 'mentor_whisper'
  ))
);

-- Create mentor_followup_queue table for delayed mentor follow-ups
CREATE TABLE public.mentor_followup_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  saved_insight_id UUID REFERENCES public.saved_insights(id) ON DELETE CASCADE,
  mentor_type TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 day'),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'responded'))
);

-- Enable RLS
ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_followup_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_insights
CREATE POLICY "Users can view own saved insights"
  ON public.saved_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved insights"
  ON public.saved_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved insights"
  ON public.saved_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved insights"
  ON public.saved_insights FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for mentor_followup_queue
CREATE POLICY "Users can view own followup queue"
  ON public.mentor_followup_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own followup queue"
  ON public.mentor_followup_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own followup queue"
  ON public.mentor_followup_queue FOR UPDATE
  USING (auth.uid() = user_id);