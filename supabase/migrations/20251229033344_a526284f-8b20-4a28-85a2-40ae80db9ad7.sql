-- Create project_spines table (one per user for MVP)
CREATE TABLE public.project_spines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  spine_title TEXT NOT NULL,
  core_intention TEXT NOT NULL,
  broad_contribution TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_spines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own spines" ON public.project_spines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spines" ON public.project_spines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spines" ON public.project_spines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spines" ON public.project_spines FOR DELETE USING (auth.uid() = user_id);

-- Create evolution_nodes table (refinements of the spine)
CREATE TABLE public.evolution_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spine_id UUID NOT NULL REFERENCES public.project_spines(id) ON DELETE CASCADE,
  parent_node_id UUID REFERENCES public.evolution_nodes(id),
  user_id UUID NOT NULL,
  node_number INTEGER NOT NULL DEFAULT 1,
  node_title TEXT NOT NULL,
  refined_description TEXT NOT NULL,
  evolution_insight TEXT,
  timeframe_days INTEGER NOT NULL DEFAULT 21,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL,
  current_phase TEXT NOT NULL DEFAULT 'exploration',
  current_day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  completion_summary TEXT,
  why_this_matters TEXT,
  learning_insights_count INTEGER DEFAULT 0,
  seed_breakthrough_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evolution_nodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own nodes" ON public.evolution_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nodes" ON public.evolution_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nodes" ON public.evolution_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nodes" ON public.evolution_nodes FOR DELETE USING (auth.uid() = user_id);

-- Add node_id to integrator_phases (link phases to evolution nodes)
ALTER TABLE public.integrator_phases ADD COLUMN node_id UUID REFERENCES public.evolution_nodes(id);

-- Add node_id to integrator_daily_steps (link steps to evolution nodes)
ALTER TABLE public.integrator_daily_steps ADD COLUMN node_id UUID REFERENCES public.evolution_nodes(id);

-- Create trigger for updated_at on project_spines
CREATE TRIGGER update_project_spines_updated_at
BEFORE UPDATE ON public.project_spines
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on evolution_nodes
CREATE TRIGGER update_evolution_nodes_updated_at
BEFORE UPDATE ON public.evolution_nodes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();