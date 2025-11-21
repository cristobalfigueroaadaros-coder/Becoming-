-- Create a table to store user display names (optional, allows users to customize)
CREATE TABLE public.user_display_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_display_names ENABLE ROW LEVEL SECURITY;

-- Policies for display names
CREATE POLICY "Anyone can view display names"
  ON public.user_display_names
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own display name"
  ON public.user_display_names
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own display name"
  ON public.user_display_names
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_display_names_updated_at
  BEFORE UPDATE ON public.user_display_names
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create leaderboard view that aggregates user stats
CREATE OR REPLACE VIEW public.leaderboard_stats AS
SELECT 
  p.id as user_id,
  COALESCE(udn.display_name, SUBSTRING(p.id::text, 1, 8)) as display_name,
  COALESCE(p.future_self_avatar, '👤') as avatar,
  COALESCE(fsp.global_xp, 0) as total_xp,
  COALESCE(fsp.evolution_level, 1) as level,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = p.id) as achievement_count,
  COALESCE((SELECT MAX(streak_count) FROM daily_rituals WHERE user_id = p.id), 0) as max_streak,
  (SELECT COUNT(*) FROM tasks WHERE user_id = p.id AND status = 'done') as completed_tasks,
  (SELECT COUNT(*) FROM shadow_encounters WHERE user_id = p.id AND status = 'completed') as shadows_faced,
  p.created_at as joined_at
FROM profiles p
LEFT JOIN future_self_progress fsp ON fsp.user_id = p.id
LEFT JOIN user_display_names udn ON udn.user_id = p.id;