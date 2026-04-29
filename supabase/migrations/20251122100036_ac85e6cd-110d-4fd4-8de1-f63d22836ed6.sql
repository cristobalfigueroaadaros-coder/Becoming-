-- Add purpose_path field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS purpose_path TEXT;

COMMENT ON COLUMN public.profiles.purpose_path IS 'User''s selected purpose path: has_purpose, discovering_purpose, has_goal, not_sure';

-- Create self_discovery_progress table to track multi-step discovery flow
CREATE TABLE IF NOT EXISTS public.self_discovery_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  purpose_path TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  answers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.self_discovery_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own discovery progress"
  ON public.self_discovery_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discovery progress"
  ON public.self_discovery_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discovery progress"
  ON public.self_discovery_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_self_discovery_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_self_discovery_progress_timestamp
  BEFORE UPDATE ON public.self_discovery_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_self_discovery_progress_updated_at();