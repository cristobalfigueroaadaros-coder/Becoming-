-- Add new columns to council_meetings table for enhanced council flow
ALTER TABLE council_meetings
ADD COLUMN IF NOT EXISTS banter TEXT,
ADD COLUMN IF NOT EXISTS resolution TEXT,
ADD COLUMN IF NOT EXISTS shadow_triggers JSONB DEFAULT '{}'::jsonb;