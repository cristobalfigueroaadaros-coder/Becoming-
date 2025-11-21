-- Create user_affirmations table
CREATE TABLE IF NOT EXISTS public.user_affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  affirmation_text TEXT,
  song_name TEXT,
  song_link TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_affirmations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own affirmations"
  ON public.user_affirmations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affirmations"
  ON public.user_affirmations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affirmations"
  ON public.user_affirmations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own affirmations"
  ON public.user_affirmations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_affirmations_user_id ON public.user_affirmations(user_id);
CREATE INDEX idx_user_affirmations_is_favorite ON public.user_affirmations(is_favorite) WHERE is_favorite = true;