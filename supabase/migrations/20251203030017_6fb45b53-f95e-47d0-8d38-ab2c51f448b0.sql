-- Add Council Introduction columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_foundation_story TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_foundation_audio_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS council_introduction_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_foundation_summary JSONB DEFAULT '{}'::jsonb;