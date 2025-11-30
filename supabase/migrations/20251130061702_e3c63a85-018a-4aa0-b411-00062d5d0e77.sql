-- Add display_name to profiles for personalization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;