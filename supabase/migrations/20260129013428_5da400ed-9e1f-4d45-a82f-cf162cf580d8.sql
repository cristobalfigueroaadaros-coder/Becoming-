-- Create lifetime_events table for storing life events in the timeline
CREATE TABLE public.lifetime_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Time Anchor (required)
  time_period TEXT NOT NULL,  -- 'childhood', 'teen', 'early_20s', 'mid_20s', 'late_20s', '30s', 'current'
  
  -- Life Event (required entry point)
  event_label TEXT NOT NULL,  -- "My parents separated"
  event_description TEXT,      -- Optional longer description
  
  -- Event Type (optional helper tag)
  event_type TEXT,  -- 'family', 'love', 'health', 'money', 'work', 'friendship', 'identity', 'loss', 'change'
  
  -- Pattern Connection (optional, can be linked later)
  pattern_id UUID REFERENCES public.inner_patterns(id) ON DELETE SET NULL,
  pattern_name TEXT,  -- Cached for display when no pattern_id
  
  -- Transmutation Connection (synced from pattern)
  gold_outcome TEXT,  -- "I became resilient" - from transmutation gold_insight
  is_transmuted BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lifetime_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user access
CREATE POLICY "Users can view their own lifetime events" 
ON public.lifetime_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lifetime events" 
ON public.lifetime_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lifetime events" 
ON public.lifetime_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lifetime events" 
ON public.lifetime_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_lifetime_events_user ON public.lifetime_events(user_id);
CREATE INDEX idx_lifetime_events_pattern ON public.lifetime_events(pattern_id);
CREATE INDEX idx_lifetime_events_time ON public.lifetime_events(time_period);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lifetime_events_updated_at
BEFORE UPDATE ON public.lifetime_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();