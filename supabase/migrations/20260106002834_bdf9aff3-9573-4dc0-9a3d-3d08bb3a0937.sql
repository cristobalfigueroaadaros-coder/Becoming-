-- Create archived steps table for PDR regeneration
CREATE TABLE IF NOT EXISTS public.archived_integrator_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_step_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES integrator_projects(id),
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  step_title TEXT NOT NULL,
  step_description TEXT NOT NULL,
  encouragement TEXT,
  estimated_minutes INTEGER,
  status TEXT,
  scheduled_date DATE,
  insight_text TEXT,
  why_it_matters TEXT,
  hint TEXT,
  action_type TEXT,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  archive_reason TEXT DEFAULT 'pdr_regeneration'
);

-- Enable RLS
ALTER TABLE public.archived_integrator_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own archived steps"
  ON public.archived_integrator_steps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own archived steps"
  ON public.archived_integrator_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_archived_steps_user_project ON public.archived_integrator_steps(user_id, project_id);