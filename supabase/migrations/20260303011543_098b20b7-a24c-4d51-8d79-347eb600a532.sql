
-- Add capability identity columns to momentum_capabilities
ALTER TABLE public.momentum_capabilities
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS acquisition_channel TEXT DEFAULT 'behavioral_detected',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'execution';

-- Add capability map unlock flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS capability_map_unlocked BOOLEAN DEFAULT false;
