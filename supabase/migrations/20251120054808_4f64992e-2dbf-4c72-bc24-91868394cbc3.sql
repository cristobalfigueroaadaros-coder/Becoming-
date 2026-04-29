-- Create shadow encounters table to store individual encounter instances
CREATE TABLE IF NOT EXISTS public.shadow_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shadow_name TEXT NOT NULL,
  shadow_statement TEXT NOT NULL,
  reflection_prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  task_description TEXT NOT NULL,
  mentor_type TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, dismissed
  voice_note_url TEXT,
  integration_insight TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  triggered_by TEXT, -- council_meeting, chat, journal, milestone
  triggered_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.shadow_encounters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own shadow encounters"
  ON public.shadow_encounters
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shadow encounters"
  ON public.shadow_encounters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shadow encounters"
  ON public.shadow_encounters
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_shadow_encounters_user_id ON public.shadow_encounters(user_id);
CREATE INDEX idx_shadow_encounters_status ON public.shadow_encounters(status);
CREATE INDEX idx_shadow_encounters_shadow_name ON public.shadow_encounters(shadow_name);