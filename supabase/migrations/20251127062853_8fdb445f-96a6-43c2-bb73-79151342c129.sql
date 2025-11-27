-- Add whisper tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_whisper_date date;

-- Add whisper metadata to daily_whispers
ALTER TABLE daily_whispers ADD COLUMN IF NOT EXISTS whisper_type text DEFAULT 'encouragement';
ALTER TABLE daily_whispers ADD COLUMN IF NOT EXISTS trigger_reason text;
ALTER TABLE daily_whispers ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;