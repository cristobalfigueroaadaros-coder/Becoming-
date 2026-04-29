-- Add new columns to integrator_daily_steps for PDR task system
ALTER TABLE integrator_daily_steps 
  ADD COLUMN IF NOT EXISTS why_it_matters text,
  ADD COLUMN IF NOT EXISTS hint text,
  ADD COLUMN IF NOT EXISTS action_type text;

-- Create task_feedback table for tracking user feedback on tasks
CREATE TABLE IF NOT EXISTS task_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step_id uuid REFERENCES integrator_daily_steps(id) ON DELETE CASCADE,
  insight_text text NOT NULL,
  win_text text NOT NULL,
  improvement_text text,
  usefulness_rating smallint CHECK (usefulness_rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on task_feedback
ALTER TABLE task_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_feedback
CREATE POLICY "Users can view their own task feedback"
ON task_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task feedback"
ON task_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task feedback"
ON task_feedback FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_task_feedback_user_id ON task_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_task_feedback_step_id ON task_feedback(step_id);