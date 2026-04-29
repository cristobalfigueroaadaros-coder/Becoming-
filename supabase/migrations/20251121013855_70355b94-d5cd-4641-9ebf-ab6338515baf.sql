-- Create profile_badges table
CREATE TABLE public.profile_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_key TEXT NOT NULL REFERENCES public.profile_badges(badge_key) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER,
  UNIQUE(user_id, badge_key)
);

-- Enable RLS
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_badges
CREATE POLICY "Anyone can view badges"
ON public.profile_badges
FOR SELECT
USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Anyone can view user badges"
ON public.user_badges
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own badges"
ON public.user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges"
ON public.user_badges
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert initial badge definitions
INSERT INTO public.profile_badges (badge_key, name, description, icon, color, criteria_type, criteria_value, priority) VALUES
('verified', 'Verified', 'Verified member', '✓', 'blue', 'manual', NULL, 100),
('top_contributor', 'Top Contributor', 'Top 10% by XP', '⭐', 'gold', 'auto_xp', 10, 90),
('streak_champion', 'Streak Champion', '30+ day streak', '🔥', 'orange', 'auto_streak', 30, 85),
('shadow_master', 'Shadow Master', '10+ shadows faced', '👻', 'purple', 'auto_shadows', 10, 80),
('achievement_hunter', 'Achievement Hunter', '15+ achievements unlocked', '🏆', 'yellow', 'auto_achievements', 15, 75),
('early_adopter', 'Early Adopter', 'Among first 100 users', '🌟', 'cyan', 'auto_early', 100, 95),
('quest_master', 'Quest Master', '5+ quests completed', '🗺️', 'green', 'auto_quests', 5, 70),
('community_leader', 'Community Leader', 'Top 3 in any leaderboard', '👑', 'pink', 'auto_leader', 3, 92);