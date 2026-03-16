
ALTER TABLE public.atlas_dots 
  ADD COLUMN IF NOT EXISTS dot_category text NOT NULL DEFAULT 'strength',
  ADD COLUMN IF NOT EXISTS signal_sources jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS signal_strength int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT 'quest_system';
