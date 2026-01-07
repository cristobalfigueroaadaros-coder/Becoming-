-- Add Gravity System tracking fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gravity_orientation_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gravity_transition_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_project_created_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS first_project_id uuid;