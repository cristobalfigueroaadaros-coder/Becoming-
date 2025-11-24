-- Add constellation_insights column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS constellation_insights JSONB DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN profiles.constellation_insights IS 'Stores AI-generated constellation insights including summary, challenge suggestions, and recommended actions';

-- Create index for faster queries on constellation insights
CREATE INDEX IF NOT EXISTS idx_profiles_constellation_insights 
ON profiles USING GIN (constellation_insights) 
WHERE constellation_insights IS NOT NULL;