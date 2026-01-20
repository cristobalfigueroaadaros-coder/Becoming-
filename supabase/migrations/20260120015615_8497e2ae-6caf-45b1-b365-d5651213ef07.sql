-- Create project_name_history table to track project name evolution
CREATE TABLE public.project_name_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES integrator_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_name TEXT NOT NULL,
  new_name TEXT NOT NULL,
  change_reason TEXT,
  change_type TEXT CHECK (change_type IN ('conceptual', 'action_driven', 'clarification')),
  related_phase TEXT CHECK (related_phase IN ('empathize', 'define', 'ideate', 'prototype', 'test')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_name_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own name history" ON project_name_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own name history" ON project_name_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own name history" ON project_name_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own name history" ON project_name_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function to automatically track project name changes
CREATE OR REPLACE FUNCTION public.track_project_name_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.project_title IS DISTINCT FROM NEW.project_title THEN
    INSERT INTO project_name_history (
      project_id,
      user_id,
      old_name,
      new_name,
      change_type,
      related_phase
    ) VALUES (
      NEW.id,
      NEW.user_id,
      OLD.project_title,
      NEW.project_title,
      'conceptual',
      'ideate'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on integrator_projects
CREATE TRIGGER on_project_name_change
  AFTER UPDATE OF project_title ON integrator_projects
  FOR EACH ROW
  EXECUTE FUNCTION track_project_name_change();