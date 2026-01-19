-- Create design_thinking_content table for user-editable phase content
CREATE TABLE public.design_thinking_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES integrator_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('empathize', 'define', 'ideate', 'prototype', 'test')),
  content JSONB DEFAULT '[]'::jsonb,
  reflection_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, phase)
);

-- Enable RLS
ALTER TABLE public.design_thinking_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own design thinking content" ON public.design_thinking_content
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own design thinking content" ON public.design_thinking_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own design thinking content" ON public.design_thinking_content
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own design thinking content" ON public.design_thinking_content
  FOR DELETE USING (auth.uid() = user_id);

-- Create project_thread_milestones table
CREATE TABLE public.project_thread_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES integrator_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  explanation TEXT,
  related_phase TEXT CHECK (related_phase IN ('empathize', 'define', 'ideate', 'prototype', 'test')),
  milestone_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_thread_milestones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own milestones" ON public.project_thread_milestones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON public.project_thread_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON public.project_thread_milestones
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON public.project_thread_milestones
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for design_thinking_content
CREATE TRIGGER update_design_thinking_content_updated_at
  BEFORE UPDATE ON public.design_thinking_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();