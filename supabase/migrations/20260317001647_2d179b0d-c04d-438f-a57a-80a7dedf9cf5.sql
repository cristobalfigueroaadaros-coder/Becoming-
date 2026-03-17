
CREATE TABLE public.atlas_cluster_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cluster_id uuid REFERENCES public.atlas_clusters(id) ON DELETE CASCADE,
  unlock_phase int NOT NULL DEFAULT 0,
  growth_level int NOT NULL DEFAULT 0,
  activated_at timestamptz,
  last_interaction_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cluster_id)
);

ALTER TABLE public.atlas_cluster_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cluster progress"
  ON public.atlas_cluster_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cluster progress"
  ON public.atlas_cluster_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cluster progress"
  ON public.atlas_cluster_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.atlas_clusters 
  ADD COLUMN IF NOT EXISTS cluster_category text DEFAULT 'identity';
