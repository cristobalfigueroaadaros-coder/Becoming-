-- Create daily_rituals table to track morning ritual completion
CREATE TABLE IF NOT EXISTS public.daily_rituals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_in_text TEXT NOT NULL,
  voice_note_url TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  streak_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_goals table for daily intentions
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_awarded BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.daily_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_rituals
CREATE POLICY "Users can view own rituals"
  ON public.daily_rituals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rituals"
  ON public.daily_rituals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rituals"
  ON public.daily_rituals FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_goals
CREATE POLICY "Users can view own goals"
  ON public.daily_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.daily_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.daily_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.daily_goals FOR DELETE
  USING (auth.uid() = user_id);