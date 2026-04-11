
ALTER TABLE public.integrator_projects
  ADD COLUMN IF NOT EXISTS project_brief text,
  ADD COLUMN IF NOT EXISTS project_maturity_stage text DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS project_constraints jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weekly_focus_intent text,
  ADD COLUMN IF NOT EXISTS project_structure jsonb DEFAULT '[]';
