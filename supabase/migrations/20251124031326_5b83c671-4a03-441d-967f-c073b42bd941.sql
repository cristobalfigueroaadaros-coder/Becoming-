-- Add pattern tracking table for Council Memory
CREATE TABLE IF NOT EXISTS public.council_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern_type text NOT NULL,
  pattern_count integer DEFAULT 1,
  first_detected_at timestamptz DEFAULT now(),
  last_detected_at timestamptz DEFAULT now(),
  context jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT council_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add emotional state tracking to council meetings
ALTER TABLE public.council_meetings 
ADD COLUMN IF NOT EXISTS emotional_tone text,
ADD COLUMN IF NOT EXISTS threshold_moment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS clarifying_questions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS conversation_flow jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pattern_detected text;

-- Add reflection tracking for task completions
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS completion_reflection text,
ADD COLUMN IF NOT EXISTS completion_insights jsonb DEFAULT '{}'::jsonb;

-- Enable RLS on council_patterns
ALTER TABLE public.council_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for council_patterns
CREATE POLICY "Users can view own patterns"
ON public.council_patterns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns"
ON public.council_patterns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
ON public.council_patterns FOR UPDATE
USING (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX idx_council_patterns_user_id ON public.council_patterns(user_id);
CREATE INDEX idx_council_patterns_type ON public.council_patterns(user_id, pattern_type);