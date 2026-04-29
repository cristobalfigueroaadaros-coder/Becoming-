-- Create table for storing dot connection analysis results
CREATE TABLE public.dot_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  connections JSONB NOT NULL DEFAULT '[]'::jsonb,
  emerging_genius TEXT,
  next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create table for creation projects/ideas
CREATE TABLE public.creation_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  dot_connections JSONB NOT NULL DEFAULT '[]'::jsonb,
  first_step TEXT NOT NULL,
  impact TEXT,
  status TEXT NOT NULL DEFAULT 'idea',
  progress_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.dot_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creation_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dot_analysis_history
CREATE POLICY "Users can view own analysis history"
  ON public.dot_analysis_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis history"
  ON public.dot_analysis_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for creation_projects
CREATE POLICY "Users can view own creation projects"
  ON public.creation_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creation projects"
  ON public.creation_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creation projects"
  ON public.creation_projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creation projects"
  ON public.creation_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on creation_projects
CREATE TRIGGER update_creation_projects_updated_at
  BEFORE UPDATE ON public.creation_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_dot_analysis_history_user_created 
  ON public.dot_analysis_history(user_id, created_at DESC);

CREATE INDEX idx_creation_projects_user_status 
  ON public.creation_projects(user_id, status, created_at DESC);