
ALTER TABLE public.momentum_weekly_reports
  ADD COLUMN IF NOT EXISTS momentum_score integer,
  ADD COLUMN IF NOT EXISTS sprint_direction text,
  ADD COLUMN IF NOT EXISTS system_insight text,
  ADD COLUMN IF NOT EXISTS friction_type text,
  ADD COLUMN IF NOT EXISTS biggest_win_type text,
  ADD COLUMN IF NOT EXISTS usefulness_answer text;
