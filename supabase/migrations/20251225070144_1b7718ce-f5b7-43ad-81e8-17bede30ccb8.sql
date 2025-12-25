-- Add birth_name and numerology data columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_name TEXT,
ADD COLUMN IF NOT EXISTS numerology_signals JSONB,
ADD COLUMN IF NOT EXISTS numerology_profile JSONB;