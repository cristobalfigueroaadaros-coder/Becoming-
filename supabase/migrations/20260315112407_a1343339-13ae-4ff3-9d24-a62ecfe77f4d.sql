
CREATE TABLE public.atlas_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  signal_name text NOT NULL,
  signal_category text NOT NULL,
  strength int NOT NULL DEFAULT 1,
  source_quest_key text NOT NULL,
  source_interaction_index int NOT NULL,
  cluster_id uuid REFERENCES public.atlas_clusters(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.atlas_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own signals" ON public.atlas_signals
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own signals" ON public.atlas_signals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.atlas_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern_key text NOT NULL,
  pattern_title text NOT NULL,
  pattern_description text,
  signal_names text[] NOT NULL,
  total_strength int NOT NULL,
  cluster_slug text NOT NULL,
  generated_dot_id uuid REFERENCES public.atlas_dots(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pattern_key)
);

ALTER TABLE public.atlas_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own patterns" ON public.atlas_patterns
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own patterns" ON public.atlas_patterns
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
