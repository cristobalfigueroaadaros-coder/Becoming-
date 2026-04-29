ALTER TABLE public.momentum_weekly_reports 
  ADD COLUMN IF NOT EXISTS reflection_rate INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS focus_category TEXT;