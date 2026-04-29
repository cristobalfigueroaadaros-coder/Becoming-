-- Create mentor learning modules table
CREATE TABLE public.mentor_learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_type public.mentor_type NOT NULL,
  module_title TEXT NOT NULL,
  module_content TEXT NOT NULL,
  quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  skill_focus TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user mentor badges table
CREATE TABLE public.user_mentor_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_type public.mentor_type NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quiz_score INTEGER NOT NULL,
  UNIQUE(user_id, mentor_type, badge_name)
);

-- Create insight dots table (central system for all insights)
CREATE TABLE public.insight_dots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('council_meeting', 'mentor_chat', 'journal', 'ritual', 'shadow_work', 'constellation', 'quest')),
  source_id UUID,
  source_mentor TEXT,
  insight_text TEXT NOT NULL,
  core_theme TEXT NOT NULL,
  skill_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  emotional_tone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  user_reflection TEXT,
  connection_ids UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Create dot connections table
CREATE TABLE public.dot_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dot_id_1 UUID NOT NULL REFERENCES public.insight_dots(id) ON DELETE CASCADE,
  dot_id_2 UUID NOT NULL REFERENCES public.insight_dots(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL,
  connection_insight TEXT NOT NULL,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(dot_id_1, dot_id_2)
);

-- Create dot review prompts table
CREATE TABLE public.dot_review_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN NOT NULL DEFAULT false,
  dots_reviewed UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Enable RLS on all new tables
ALTER TABLE public.mentor_learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mentor_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_dots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dot_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dot_review_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_learning_modules (public read)
CREATE POLICY "Anyone can view learning modules"
  ON public.mentor_learning_modules
  FOR SELECT
  USING (true);

-- RLS Policies for user_mentor_badges
CREATE POLICY "Users can view own badges"
  ON public.user_mentor_badges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.user_mentor_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for insight_dots
CREATE POLICY "Users can view own insight dots"
  ON public.insight_dots
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insight dots"
  ON public.insight_dots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insight dots"
  ON public.insight_dots
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insight dots"
  ON public.insight_dots
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dot_connections
CREATE POLICY "Users can view own dot connections"
  ON public.dot_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dot connections"
  ON public.dot_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dot connections"
  ON public.dot_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dot_review_prompts
CREATE POLICY "Users can view own review prompts"
  ON public.dot_review_prompts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review prompts"
  ON public.dot_review_prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review prompts"
  ON public.dot_review_prompts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_insight_dots_user_id ON public.insight_dots(user_id);
CREATE INDEX idx_insight_dots_source_type ON public.insight_dots(source_type);
CREATE INDEX idx_insight_dots_created_at ON public.insight_dots(created_at DESC);
CREATE INDEX idx_insight_dots_core_theme ON public.insight_dots(core_theme);
CREATE INDEX idx_dot_connections_user_id ON public.dot_connections(user_id);
CREATE INDEX idx_user_mentor_badges_user_id ON public.user_mentor_badges(user_id);