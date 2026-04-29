-- Create user theme preferences table
CREATE TABLE public.user_theme_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme_color TEXT NOT NULL DEFAULT 'purple',
  background_style TEXT NOT NULL DEFAULT 'gradient',
  card_style TEXT NOT NULL DEFAULT 'default',
  show_stats_publicly BOOLEAN NOT NULL DEFAULT true,
  show_timeline_publicly BOOLEAN NOT NULL DEFAULT false,
  show_achievements_publicly BOOLEAN NOT NULL DEFAULT true,
  accent_color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_theme_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view theme preferences"
  ON public.user_theme_preferences
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own theme preferences"
  ON public.user_theme_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own theme preferences"
  ON public.user_theme_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_theme_preferences_updated_at
  BEFORE UPDATE ON public.user_theme_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();