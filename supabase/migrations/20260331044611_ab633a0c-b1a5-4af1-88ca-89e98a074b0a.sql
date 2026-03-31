
CREATE TABLE public.atlas_mini_dots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_dot_id UUID NOT NULL REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT 'user',
  cluster_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.atlas_mini_dots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mini-dots" ON public.atlas_mini_dots
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.atlas_dots ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'quest';
