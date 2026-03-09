
-- Creator posts table
CREATE TABLE public.creator_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement text NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('creating', 'working_on_self', 'looking_for_help', 'offering_help')),
  goal text,
  next_step text,
  location text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Creator updates (thread system)
CREATE TABLE public.creator_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Creator resonances
CREATE TABLE public.creator_resonances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resonance_type text NOT NULL CHECK (resonance_type IN ('inspires_me', 'creating_similar', 'want_to_help', 'needed_this')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, resonance_type)
);

-- Creator comments
CREATE TABLE public.creator_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Storage bucket for creator images
INSERT INTO storage.buckets (id, name, public) VALUES ('creator-images', 'creator-images', true);

-- Enable RLS
ALTER TABLE public.creator_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_resonances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_comments ENABLE ROW LEVEL SECURITY;

-- RLS: Everyone authenticated can read all posts
CREATE POLICY "Anyone can read creator posts" ON public.creator_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own posts" ON public.creator_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.creator_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.creator_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read creator updates" ON public.creator_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own updates" ON public.creator_updates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own updates" ON public.creator_updates FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read resonances" ON public.creator_resonances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own resonances" ON public.creator_resonances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own resonances" ON public.creator_resonances FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read comments" ON public.creator_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON public.creator_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.creator_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage RLS for creator-images
CREATE POLICY "Anyone can view creator images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'creator-images');
CREATE POLICY "Users can upload creator images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'creator-images');
CREATE POLICY "Users can delete own creator images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'creator-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_resonances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_comments;
