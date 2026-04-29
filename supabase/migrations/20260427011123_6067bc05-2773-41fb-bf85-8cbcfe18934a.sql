
CREATE TABLE IF NOT EXISTS public.atlas_analysis_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  dot_count INTEGER NOT NULL DEFAULT 0,
  cluster_count INTEGER NOT NULL DEFAULT 0,
  patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  emerging_genius JSONB NOT NULL DEFAULT '[]'::jsonb,
  creation_ideas JSONB NOT NULL DEFAULT '[]'::jsonb,
  cross_connections JSONB NOT NULL DEFAULT '[]'::jsonb,
  purpose_signal TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atlas_analysis_snapshots_user
  ON public.atlas_analysis_snapshots(user_id, created_at DESC);

ALTER TABLE public.atlas_analysis_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own analysis snapshots"
  ON public.atlas_analysis_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own analysis snapshots"
  ON public.atlas_analysis_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own analysis snapshots"
  ON public.atlas_analysis_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own analysis snapshots"
  ON public.atlas_analysis_snapshots FOR DELETE
  USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.atlas_breakthroughs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  target_audience TEXT,
  approach TEXT,
  first_step TEXT,
  readiness_score INTEGER NOT NULL DEFAULT 0,
  conversation_depth INTEGER NOT NULL DEFAULT 0,
  source_mentor_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atlas_breakthroughs_user
  ON public.atlas_breakthroughs(user_id, created_at DESC);

ALTER TABLE public.atlas_breakthroughs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own breakthroughs"
  ON public.atlas_breakthroughs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own breakthroughs"
  ON public.atlas_breakthroughs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own breakthroughs"
  ON public.atlas_breakthroughs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own breakthroughs"
  ON public.atlas_breakthroughs FOR DELETE
  USING (auth.uid() = user_id);
