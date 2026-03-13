-- Meta domains (4 structural categories)
CREATE TABLE public.atlas_meta_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 13 discovery clusters
CREATE TABLE public.atlas_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  meta_domain_id uuid REFERENCES public.atlas_meta_domains(id),
  description text,
  state text NOT NULL DEFAULT 'available',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Dots (discoveries/insights per user per cluster)
CREATE TABLE public.atlas_dots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cluster_id uuid REFERENCES public.atlas_clusters(id) ON DELETE CASCADE,
  title text NOT NULL,
  short_description text,
  confidence_score float,
  dot_type text,
  created_at timestamptz DEFAULT now()
);

-- Future-ready: project nodes
CREATE TABLE public.atlas_project_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Future-ready: dot-project connections
CREATE TABLE public.atlas_dot_project_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dot_id uuid REFERENCES public.atlas_dots(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.atlas_project_nodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Future-ready: cluster-project connections
CREATE TABLE public.atlas_cluster_project_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid REFERENCES public.atlas_clusters(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.atlas_project_nodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.atlas_meta_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_dots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_project_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_dot_project_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_cluster_project_connections ENABLE ROW LEVEL SECURITY;

-- Meta domains and clusters are public read (reference data)
CREATE POLICY "Anyone can read meta domains" ON public.atlas_meta_domains FOR SELECT USING (true);
CREATE POLICY "Anyone can read clusters" ON public.atlas_clusters FOR SELECT USING (true);

-- Dots: users see only their own
CREATE POLICY "Users read own dots" ON public.atlas_dots FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own dots" ON public.atlas_dots FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own dots" ON public.atlas_dots FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own dots" ON public.atlas_dots FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Project nodes: users see only their own
CREATE POLICY "Users read own project nodes" ON public.atlas_project_nodes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own project nodes" ON public.atlas_project_nodes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Connections: users manage via dot/project ownership
CREATE POLICY "Users read own dot-project connections" ON public.atlas_dot_project_connections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.atlas_dots WHERE id = dot_id AND user_id = auth.uid()));
CREATE POLICY "Users insert own dot-project connections" ON public.atlas_dot_project_connections FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.atlas_dots WHERE id = dot_id AND user_id = auth.uid()));

CREATE POLICY "Users read own cluster-project connections" ON public.atlas_cluster_project_connections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.atlas_project_nodes WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users insert own cluster-project connections" ON public.atlas_cluster_project_connections FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.atlas_project_nodes WHERE id = project_id AND user_id = auth.uid()));