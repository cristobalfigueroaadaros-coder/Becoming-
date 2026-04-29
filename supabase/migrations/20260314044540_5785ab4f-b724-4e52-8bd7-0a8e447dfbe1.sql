
CREATE TABLE public.atlas_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cluster_id uuid REFERENCES public.atlas_clusters(id),
  quest_key text NOT NULL,
  interactions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  generated_dot_id uuid REFERENCES public.atlas_dots(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.atlas_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own quests" ON public.atlas_quests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own quests" ON public.atlas_quests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own quests" ON public.atlas_quests FOR UPDATE TO authenticated USING (user_id = auth.uid());
