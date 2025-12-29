-- Create project_branches table for Tree Trunk & Branches architecture
CREATE TABLE public.project_branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spine_id UUID NOT NULL REFERENCES public.project_spines(id) ON DELETE CASCADE,
  parent_node_id UUID REFERENCES public.evolution_nodes(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  branch_title TEXT NOT NULL,
  branch_description TEXT NOT NULL,
  branch_type TEXT NOT NULL DEFAULT 'tactic',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to project_spines for core theme detection and cooldown tracking
ALTER TABLE public.project_spines 
ADD COLUMN IF NOT EXISTS core_theme TEXT,
ADD COLUMN IF NOT EXISTS core_theme_confidence NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_coherence_card_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on project_branches
ALTER TABLE public.project_branches ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_branches
CREATE POLICY "Users can view own branches" 
ON public.project_branches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own branches" 
ON public.project_branches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own branches" 
ON public.project_branches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own branches" 
ON public.project_branches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_project_branches_updated_at
  BEFORE UPDATE ON public.project_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();