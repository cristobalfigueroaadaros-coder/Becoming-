-- Create inner_patterns table for Inner Work Lab
CREATE TABLE public.inner_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Core pattern data
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,
  pattern_type TEXT NOT NULL DEFAULT 'limiting_belief',
  
  -- Origin data
  source_council_meeting_id UUID REFERENCES public.council_meetings(id),
  source_mentor TEXT,
  trigger_context TEXT,
  
  -- Emotional signature
  primary_emotion TEXT,
  related_emotions TEXT[],
  body_sensation TEXT,
  
  -- Life mapping (for Pattern Timeline - future PDR)
  earliest_memory_age INTEGER,
  life_events JSONB DEFAULT '[]',
  
  -- Transformation state
  status TEXT NOT NULL DEFAULT 'exploring',
  gold_shift_text TEXT,
  transformed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inner_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own patterns" ON public.inner_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own patterns" ON public.inner_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns" ON public.inner_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns" ON public.inner_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_inner_patterns_user ON public.inner_patterns(user_id);
CREATE INDEX idx_inner_patterns_status ON public.inner_patterns(status);
CREATE INDEX idx_inner_patterns_created ON public.inner_patterns(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_inner_patterns_updated_at
  BEFORE UPDATE ON public.inner_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();