-- Create creative_space_pages table first (referenced by tiles)
CREATE TABLE public.creative_space_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.integrator_projects(id) ON DELETE CASCADE,
  page_name TEXT DEFAULT 'Page 1',
  page_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_space_pages ENABLE ROW LEVEL SECURITY;

-- RLS policies for pages
CREATE POLICY "Users can view own pages" ON public.creative_space_pages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pages" ON public.creative_space_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pages" ON public.creative_space_pages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pages" ON public.creative_space_pages
  FOR DELETE USING (auth.uid() = user_id);

-- Create creative_space_tiles table
CREATE TABLE public.creative_space_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.integrator_projects(id) ON DELETE CASCADE,
  tile_type TEXT NOT NULL DEFAULT 'insight',
  title TEXT NOT NULL,
  content TEXT,
  source_type TEXT,
  source_id UUID,
  source_label TEXT,
  position_x REAL NOT NULL DEFAULT 100,
  position_y REAL NOT NULL DEFAULT 100,
  color TEXT DEFAULT '#60a5fa',
  page_id UUID REFERENCES public.creative_space_pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_space_tiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for tiles
CREATE POLICY "Users can view own tiles" ON public.creative_space_tiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tiles" ON public.creative_space_tiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tiles" ON public.creative_space_tiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tiles" ON public.creative_space_tiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create creative_space_connections table
CREATE TABLE public.creative_space_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.integrator_projects(id) ON DELETE CASCADE,
  from_tile_id UUID NOT NULL REFERENCES public.creative_space_tiles(id) ON DELETE CASCADE,
  to_tile_id UUID NOT NULL REFERENCES public.creative_space_tiles(id) ON DELETE CASCADE,
  connection_color TEXT DEFAULT '#a78bfa',
  page_id UUID REFERENCES public.creative_space_pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_space_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for connections
CREATE POLICY "Users can view own connections" ON public.creative_space_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.creative_space_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.creative_space_connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.creative_space_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Create creative_space_patterns table for AI-detected patterns
CREATE TABLE public.creative_space_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.integrator_projects(id) ON DELETE CASCADE,
  pattern_description TEXT NOT NULL,
  related_tile_ids UUID[] NOT NULL,
  dismissed BOOLEAN DEFAULT false,
  engaged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_space_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for patterns
CREATE POLICY "Users can view own patterns" ON public.creative_space_patterns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON public.creative_space_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns" ON public.creative_space_patterns
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patterns" ON public.creative_space_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for tiles
CREATE TRIGGER update_creative_space_tiles_updated_at
  BEFORE UPDATE ON public.creative_space_tiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();