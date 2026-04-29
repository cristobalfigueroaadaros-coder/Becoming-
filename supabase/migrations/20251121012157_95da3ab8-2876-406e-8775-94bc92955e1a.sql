-- Create weekly goals table
CREATE TABLE public.weekly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_awarded BOOLEAN NOT NULL DEFAULT false,
  xp_value INTEGER NOT NULL DEFAULT 50,
  week_start DATE NOT NULL
);

-- Create monthly goals table
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_awarded BOOLEAN NOT NULL DEFAULT false,
  xp_value INTEGER NOT NULL DEFAULT 150,
  month_start DATE NOT NULL
);

-- Create yearly goals table
CREATE TABLE public.yearly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_awarded BOOLEAN NOT NULL DEFAULT false,
  xp_value INTEGER NOT NULL DEFAULT 500,
  year INTEGER NOT NULL
);

-- Create vision goals table (10-year vision)
CREATE TABLE public.vision_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vision_text TEXT NOT NULL,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_goals
CREATE POLICY "Users can view own weekly goals" ON public.weekly_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly goals" ON public.weekly_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly goals" ON public.weekly_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly goals" ON public.weekly_goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for monthly_goals
CREATE POLICY "Users can view own monthly goals" ON public.monthly_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly goals" ON public.monthly_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly goals" ON public.monthly_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly goals" ON public.monthly_goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for yearly_goals
CREATE POLICY "Users can view own yearly goals" ON public.yearly_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own yearly goals" ON public.yearly_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own yearly goals" ON public.yearly_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own yearly goals" ON public.yearly_goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vision_goals
CREATE POLICY "Users can view own vision goals" ON public.vision_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vision goals" ON public.vision_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vision goals" ON public.vision_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vision goals" ON public.vision_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for vision_goals updated_at
CREATE TRIGGER update_vision_goals_updated_at
  BEFORE UPDATE ON public.vision_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();