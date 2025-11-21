-- Add birth information fields to profiles table for Human Design integration
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_time TIME,
ADD COLUMN IF NOT EXISTS birth_location TEXT,
ADD COLUMN IF NOT EXISTS birth_time_unknown BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS human_design_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.birth_date IS 'User date of birth for Human Design calculations';
COMMENT ON COLUMN profiles.birth_time IS 'User time of birth for precise Human Design chart';
COMMENT ON COLUMN profiles.birth_location IS 'Birth location for accurate chart calculations';
COMMENT ON COLUMN profiles.birth_time_unknown IS 'Flag indicating if birth time is unknown (defaults to noon)';
COMMENT ON COLUMN profiles.human_design_data IS 'Stores processed Human Design chart data including type, strategy, authority, profile, centers, gates, channels, and incarnation cross';