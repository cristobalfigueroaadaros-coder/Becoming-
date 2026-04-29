-- Create integrator_projects table
CREATE TABLE public.integrator_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seed_breakthrough_id UUID REFERENCES public.conversation_breakthroughs(id),
  project_title TEXT NOT NULL,
  project_description TEXT NOT NULL,
  timeframe_days INTEGER NOT NULL DEFAULT 21,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL,
  current_phase TEXT NOT NULL DEFAULT 'exploration',
  current_day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  completion_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integrator_phases table
CREATE TABLE public.integrator_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.integrator_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  phase_name TEXT NOT NULL,
  phase_color TEXT NOT NULL,
  phase_description TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  start_day INTEGER NOT NULL,
  end_day INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integrator_daily_steps table
CREATE TABLE public.integrator_daily_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.integrator_projects(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES public.integrator_phases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  step_title TEXT NOT NULL,
  step_description TEXT NOT NULL,
  encouragement TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  insight_text TEXT,
  insight_shared_with_mentors BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.integrator_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrator_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrator_daily_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for integrator_projects
CREATE POLICY "Users can view own integrator projects"
  ON public.integrator_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrator projects"
  ON public.integrator_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrator projects"
  ON public.integrator_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrator projects"
  ON public.integrator_projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for integrator_phases
CREATE POLICY "Users can view own integrator phases"
  ON public.integrator_phases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrator phases"
  ON public.integrator_phases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrator phases"
  ON public.integrator_phases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrator phases"
  ON public.integrator_phases FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for integrator_daily_steps
CREATE POLICY "Users can view own integrator steps"
  ON public.integrator_daily_steps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrator steps"
  ON public.integrator_daily_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrator steps"
  ON public.integrator_daily_steps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrator steps"
  ON public.integrator_daily_steps FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at on integrator_projects
CREATE TRIGGER update_integrator_projects_updated_at
  BEFORE UPDATE ON public.integrator_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on integrator_daily_steps
CREATE TRIGGER update_integrator_daily_steps_updated_at
  BEFORE UPDATE ON public.integrator_daily_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();