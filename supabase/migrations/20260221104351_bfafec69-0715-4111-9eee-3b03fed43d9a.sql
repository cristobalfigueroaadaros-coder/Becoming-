
-- Create momentum_weekly_reports table
CREATE TABLE public.momentum_weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  tasks_skipped INTEGER DEFAULT 0,
  avg_usefulness_rating NUMERIC,
  insights_captured INTEGER DEFAULT 0,
  wins_captured INTEGER DEFAULT 0,
  top_wins JSONB DEFAULT '[]'::jsonb,
  top_insights JSONB DEFAULT '[]'::jsonb,
  friction_points JSONB DEFAULT '[]'::jsonb,
  phases_active JSONB DEFAULT '[]'::jsonb,
  evolution_narrative TEXT,
  self_ratings JSONB,
  ritual_completed_at TIMESTAMPTZ,
  streak_weeks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create momentum_capabilities table
CREATE TABLE public.momentum_capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  capability_name TEXT NOT NULL,
  source_type TEXT DEFAULT 'task',
  activation_count INTEGER DEFAULT 1,
  first_activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.momentum_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momentum_capabilities ENABLE ROW LEVEL SECURITY;

-- RLS policies for momentum_weekly_reports
CREATE POLICY "Users can view their own reports"
  ON public.momentum_weekly_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
  ON public.momentum_weekly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.momentum_weekly_reports FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for momentum_capabilities
CREATE POLICY "Users can view their own capabilities"
  ON public.momentum_capabilities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own capabilities"
  ON public.momentum_capabilities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capabilities"
  ON public.momentum_capabilities FOR UPDATE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_momentum_reports_user_id ON public.momentum_weekly_reports(user_id);
CREATE INDEX idx_momentum_reports_week ON public.momentum_weekly_reports(user_id, week_start);
CREATE INDEX idx_momentum_capabilities_user_id ON public.momentum_capabilities(user_id);
CREATE INDEX idx_momentum_capabilities_name ON public.momentum_capabilities(user_id, capability_name);
