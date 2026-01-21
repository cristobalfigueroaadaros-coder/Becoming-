-- PDR 3: Problem Understanding & Win Logic

-- Create project_problems table for storing structured problem statements
CREATE TABLE public.project_problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES integrator_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Structured problem components
  problem_statement TEXT NOT NULL,
  target_audience TEXT,
  pain_points TEXT,
  root_cause TEXT,
  
  -- Full formatted statement
  full_problem_text TEXT NOT NULL,
  
  -- State tracking
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  confirmation_source TEXT CHECK (confirmation_source IN ('mentor', 'manual')),
  mentor_conversation_id TEXT,
  
  -- Version for evolution tracking
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES project_problems(id),
  change_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_problems ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_problems
CREATE POLICY "Users can view own problems" ON project_problems
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own problems" ON project_problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems" ON project_problems
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems" ON project_problems
  FOR DELETE USING (auth.uid() = user_id);

-- Add second_win_completed_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS second_win_completed_at TIMESTAMPTZ;

-- Add problem clarification tracking to integrator_projects
ALTER TABLE integrator_projects 
  ADD COLUMN IF NOT EXISTS needs_problem_clarification BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS problem_clarified_at TIMESTAMPTZ;