-- Add work context and self-discovery tracking columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS work_context TEXT,
ADD COLUMN IF NOT EXISTS self_discovery_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS self_discovery_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS council_unlocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS council_unlocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS action_patterns JSONB DEFAULT '{}'::jsonb;