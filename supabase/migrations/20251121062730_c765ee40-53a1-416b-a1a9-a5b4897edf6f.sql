-- Create purpose history table
CREATE TABLE IF NOT EXISTS public.purpose_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purpose_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purpose_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purpose history"
  ON public.purpose_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purpose history"
  ON public.purpose_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_purpose_history_user_id ON public.purpose_history(user_id);
CREATE INDEX idx_purpose_history_created_at ON public.purpose_history(user_id, created_at DESC);