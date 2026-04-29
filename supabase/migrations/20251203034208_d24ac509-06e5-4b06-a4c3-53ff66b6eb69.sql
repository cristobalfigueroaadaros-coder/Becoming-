-- Create user_keywords table for tracking highlighted keywords
CREATE TABLE public.user_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  keyword_type TEXT NOT NULL, -- 'purpose_theme' | 'fear' | 'bottleneck' | 'value' | 'action_driver' | 'strategic_insight'
  source TEXT NOT NULL, -- 'council' | 'mentor_chat' | 'future_self' | 'banter' | 'whisper'
  source_id UUID,
  context TEXT,
  frequency_count INTEGER DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_user_keywords_user_id ON public.user_keywords(user_id);
CREATE INDEX idx_user_keywords_type ON public.user_keywords(keyword_type);
CREATE INDEX idx_user_keywords_frequency ON public.user_keywords(user_id, frequency_count DESC);

-- Enable RLS
ALTER TABLE public.user_keywords ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own keywords" ON public.user_keywords
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keywords" ON public.user_keywords
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keywords" ON public.user_keywords
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own keywords" ON public.user_keywords
  FOR DELETE USING (auth.uid() = user_id);