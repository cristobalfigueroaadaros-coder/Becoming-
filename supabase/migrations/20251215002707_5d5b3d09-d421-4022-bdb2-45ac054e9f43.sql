-- Add new columns to integrator_projects
ALTER TABLE integrator_projects ADD COLUMN IF NOT EXISTS why_this_matters TEXT;
ALTER TABLE integrator_projects ADD COLUMN IF NOT EXISTS learning_insights_count INTEGER DEFAULT 0;

-- Add new columns to integrator_daily_steps
ALTER TABLE integrator_daily_steps ADD COLUMN IF NOT EXISTS reflection_question TEXT;
ALTER TABLE integrator_daily_steps ADD COLUMN IF NOT EXISTS user_edited_title TEXT;
ALTER TABLE integrator_daily_steps ADD COLUMN IF NOT EXISTS user_edited_description TEXT;
ALTER TABLE integrator_daily_steps ADD COLUMN IF NOT EXISTS skip_reason TEXT;
ALTER TABLE integrator_daily_steps ADD COLUMN IF NOT EXISTS rescheduled_from DATE;