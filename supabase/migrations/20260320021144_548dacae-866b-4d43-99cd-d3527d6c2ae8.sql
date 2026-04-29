
-- Dot evolution tracking columns
ALTER TABLE public.atlas_dots
  ADD COLUMN IF NOT EXISTS evolution_stage int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS evolution_type text,
  ADD COLUMN IF NOT EXISTS evolved_from_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_gold_moment boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_validated boolean,
  ADD COLUMN IF NOT EXISTS user_edited boolean DEFAULT false;

-- Cross-cluster connections
CREATE TABLE public.atlas_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dot_id_a uuid REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  dot_id_b uuid REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  connection_type text NOT NULL DEFAULT 'signal_overlap',
  shared_signals jsonb DEFAULT '[]',
  strength int DEFAULT 0,
  insight_text text,
  is_gold_moment boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(dot_id_a, dot_id_b)
);
ALTER TABLE public.atlas_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own connections" ON public.atlas_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.atlas_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.atlas_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.atlas_connections FOR DELETE USING (auth.uid() = user_id);

-- Dot evolution history
CREATE TABLE public.atlas_dot_evolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dot_id uuid REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  previous_title text NOT NULL,
  new_title text NOT NULL,
  previous_description text,
  new_description text,
  evolution_type text NOT NULL,
  trigger_reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.atlas_dot_evolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own evolutions" ON public.atlas_dot_evolutions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evolutions" ON public.atlas_dot_evolutions FOR INSERT WITH CHECK (auth.uid() = user_id);
