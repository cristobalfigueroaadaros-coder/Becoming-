-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (everyone can read)
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert predefined achievements
INSERT INTO public.achievements (achievement_key, title, description, icon, tier, xp_reward, requirement_type, requirement_value) VALUES
  ('first_ritual', 'Morning Warrior', 'Complete your first morning ritual', '🌅', 'bronze', 50, 'ritual_count', 1),
  ('ritual_streak_7', 'Week Warrior', 'Maintain a 7-day ritual streak', '🔥', 'silver', 150, 'ritual_streak', 7),
  ('ritual_streak_30', 'Month Master', 'Maintain a 30-day ritual streak', '⚡', 'gold', 500, 'ritual_streak', 30),
  ('ritual_streak_100', 'Centurion', 'Maintain a 100-day ritual streak', '👑', 'diamond', 1500, 'ritual_streak', 100),
  
  ('first_task', 'Task Tackler', 'Complete your first task', '✓', 'bronze', 50, 'task_count', 1),
  ('tasks_10', 'Getting Things Done', 'Complete 10 tasks', '📋', 'silver', 200, 'task_count', 10),
  ('tasks_50', 'Productivity Pro', 'Complete 50 tasks', '🎯', 'gold', 750, 'task_count', 50),
  ('tasks_100', 'Task Master', 'Complete 100 tasks', '💎', 'diamond', 2000, 'task_count', 100),
  
  ('weekly_goals_all', 'Weekly Winner', 'Complete all weekly goals', '🏆', 'silver', 200, 'weekly_complete', 1),
  ('monthly_goals_all', 'Monthly Champion', 'Complete all monthly goals', '🥇', 'gold', 500, 'monthly_complete', 1),
  ('yearly_goals_all', 'Year Conqueror', 'Complete all yearly goals', '🎆', 'diamond', 1000, 'yearly_complete', 1),
  
  ('shadow_encounter_1', 'Shadow Seeker', 'Face your first shadow', '👻', 'bronze', 100, 'shadow_count', 1),
  ('shadow_encounter_5', 'Shadow Walker', 'Face 5 shadow encounters', '🌑', 'silver', 300, 'shadow_count', 5),
  ('shadow_encounter_10', 'Shadow Master', 'Face 10 shadow encounters', '🌚', 'gold', 750, 'shadow_count', 10),
  
  ('council_meeting_1', 'Council Initiate', 'Attend your first council meeting', '🏛️', 'bronze', 75, 'council_count', 1),
  ('council_meeting_10', 'Council Regular', 'Attend 10 council meetings', '🗣️', 'silver', 250, 'council_count', 10),
  
  ('level_10', 'Rising Star', 'Reach evolution level 10', '⭐', 'silver', 300, 'evolution_level', 10),
  ('level_25', 'Transformation Adept', 'Reach evolution level 25', '🌟', 'gold', 750, 'evolution_level', 25),
  ('level_50', 'Ascended Being', 'Reach evolution level 50', '💫', 'diamond', 2000, 'evolution_level', 50),
  
  ('vision_set', 'Visionary', 'Set your 10-year vision', '🔮', 'silver', 200, 'vision_set', 1);