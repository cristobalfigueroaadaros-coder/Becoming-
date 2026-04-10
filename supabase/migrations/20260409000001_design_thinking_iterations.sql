-- Design Thinking Lab: Iteration Support
-- Adds iteration_number to content table and creates iteration tracking table

-- 1. Add iteration_number column to design_thinking_content
ALTER TABLE design_thinking_content ADD COLUMN IF NOT EXISTS iteration_number INTEGER NOT NULL DEFAULT 1;

-- 2. Drop old unique constraint (project_id, phase) and replace with (project_id, phase, iteration_number)
ALTER TABLE design_thinking_content DROP CONSTRAINT IF EXISTS design_thinking_content_project_id_phase_key;
ALTER TABLE design_thinking_content ADD CONSTRAINT design_thinking_content_project_phase_iteration_key
  UNIQUE (project_id, phase, iteration_number);

-- 3. Create iteration tracking table
CREATE TABLE IF NOT EXISTS design_thinking_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES integrator_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iteration_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  summary TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, iteration_number)
);

-- 4. Enable RLS
ALTER TABLE design_thinking_iterations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own design thinking iterations"
  ON design_thinking_iterations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Seed iteration 1 for any existing projects that have design_thinking_content
INSERT INTO design_thinking_iterations (project_id, user_id, iteration_number, status)
SELECT DISTINCT
  dtc.project_id,
  dtc.user_id,
  1,
  'active'
FROM design_thinking_content dtc
ON CONFLICT (project_id, iteration_number) DO NOTHING;
