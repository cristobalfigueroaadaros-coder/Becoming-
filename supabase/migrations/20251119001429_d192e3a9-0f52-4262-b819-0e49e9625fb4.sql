-- Add new fields to profiles table for expanded Future Self system
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS priority_growth_area text,
ADD COLUMN IF NOT EXISTS future_self_voice_note text,
ADD COLUMN IF NOT EXISTS future_self_avatar text;

-- Update mentor_type enum to include all 12 mentors
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'business_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'creator_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'mystic_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'heart_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'strategist_mentor';
ALTER TYPE public.mentor_type ADD VALUE IF NOT EXISTS 'explorer_mentor';

-- Create future_self_progress table
CREATE TABLE IF NOT EXISTS public.future_self_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  global_xp integer NOT NULL DEFAULT 0,
  evolution_level integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.future_self_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own future self progress"
ON public.future_self_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own future self progress"
ON public.future_self_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own future self progress"
ON public.future_self_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create shadow_progress table
CREATE TABLE IF NOT EXISTS public.shadow_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shadow_name text NOT NULL,
  encounters integer NOT NULL DEFAULT 0,
  integrations integer NOT NULL DEFAULT 0,
  last_triggered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, shadow_name)
);

ALTER TABLE public.shadow_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shadow progress"
ON public.shadow_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shadow progress"
ON public.shadow_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shadow progress"
ON public.shadow_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create mentor_progress table
CREATE TABLE IF NOT EXISTS public.mentor_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_name text NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, mentor_name)
);

ALTER TABLE public.mentor_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentor progress"
ON public.mentor_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentor progress"
ON public.mentor_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentor progress"
ON public.mentor_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create quests table
CREATE TABLE IF NOT EXISTS public.quests (
  quest_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_name text NOT NULL,
  description text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  reward_xp integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quests"
ON public.quests FOR SELECT
USING (true);

-- Create quest_progress table
CREATE TABLE IF NOT EXISTS public.quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES public.quests(quest_id) ON DELETE CASCADE,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quest progress"
ON public.quest_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quest progress"
ON public.quest_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quest progress"
ON public.quest_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create actual_self_journal table
CREATE TABLE IF NOT EXISTS public.actual_self_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_text text,
  voice_note_url text,
  emotional_tone text,
  shadow_detected text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.actual_self_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries"
ON public.actual_self_journal FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
ON public.actual_self_journal FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
ON public.actual_self_journal FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
ON public.actual_self_journal FOR DELETE
USING (auth.uid() = user_id);

-- Create transformation_timeline table
CREATE TABLE IF NOT EXISTS public.transformation_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.transformation_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timeline"
ON public.transformation_timeline FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timeline events"
ON public.transformation_timeline FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create seasonal_events table
CREATE TABLE IF NOT EXISTS public.seasonal_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  description text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasonal events"
ON public.seasonal_events FOR SELECT
USING (true);

-- Create daily_portal_entries table
CREATE TABLE IF NOT EXISTS public.daily_portal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_message text,
  future_self_message text,
  one_sentence_truth text,
  mini_challenge text,
  shadow_warning text,
  quest_step text,
  evolution_reminder text,
  created_at timestamp with time zone DEFAULT now(),
  shown_at timestamp with time zone
);

ALTER TABLE public.daily_portal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portal entries"
ON public.daily_portal_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portal entries"
ON public.daily_portal_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portal entries"
ON public.daily_portal_entries FOR UPDATE
USING (auth.uid() = user_id);

-- Insert initial quests
INSERT INTO public.quests (quest_name, description, steps, reward_xp) VALUES
('Warrior Discipline Quest', 'Build unshakable discipline through daily practice', 
 '["Complete 3 Mamba Mentor tasks", "Log 7 consecutive days", "Complete a Shadow Integration task"]'::jsonb, 100),
('Creator Sprint', 'Unleash your creative power', 
 '["Complete 3 Creative Visionary tasks", "Complete 3 Creator Mentor tasks", "Share your creation"]'::jsonb, 100),
('Shadow Hunt', 'Face and integrate your shadows', 
 '["Encounter 3 different shadows", "Complete 2 Shadow Integration tasks", "Write a shadow reflection"]'::jsonb, 150),
('Heart Week', 'Deepen your connections', 
 '["Complete 3 Heart Mentor tasks", "Complete 2 Compassionate Elder tasks", "Practice vulnerability"]'::jsonb, 100),
('Future Self Alignment Quest', 'Align with your highest vision', 
 '["Complete 5 Future Self tasks", "Reach Evolution Level 3", "Update your Future Self profile"]'::jsonb, 200)
ON CONFLICT DO NOTHING;

-- Add trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_future_self_progress_updated_at BEFORE UPDATE ON public.future_self_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_progress_updated_at BEFORE UPDATE ON public.mentor_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quest_progress_updated_at BEFORE UPDATE ON public.quest_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();