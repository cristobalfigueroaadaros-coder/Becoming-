-- Create self_discovery_quests table
CREATE TABLE IF NOT EXISTS public.self_discovery_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quest_type TEXT NOT NULL,
  quest_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  insights_generated TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.self_discovery_quests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own discovery quests"
  ON public.self_discovery_quests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discovery quests"
  ON public.self_discovery_quests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discovery quests"
  ON public.self_discovery_quests
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discovery quests"
  ON public.self_discovery_quests
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_self_discovery_quests_user_id ON public.self_discovery_quests(user_id);
CREATE INDEX idx_self_discovery_quests_quest_type ON public.self_discovery_quests(quest_type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_self_discovery_quests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_self_discovery_quests_updated_at
  BEFORE UPDATE ON public.self_discovery_quests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_self_discovery_quests_updated_at();