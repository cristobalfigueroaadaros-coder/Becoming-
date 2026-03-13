

# Atlas Core Architecture + Navigation Integration

## Summary

Introduce the Atlas as a new core feature: a visual identity map with 13 discovery clusters organized into 4 meta domains. Add it to bottom navigation, create the database schema, seed initial data, and build the Atlas screen with cluster/dot interaction.

## Database Schema

Create 5 tables via migration:

```sql
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
  state text NOT NULL DEFAULT 'available', -- locked, available, activated, growing, rich
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

-- Meta domains & clusters are public read (reference data)
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

-- Connections: users manage via dot/project ownership (simplified)
CREATE POLICY "Users read own dot-project connections" ON public.atlas_dot_project_connections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.atlas_dots WHERE id = dot_id AND user_id = auth.uid()));
CREATE POLICY "Users insert own dot-project connections" ON public.atlas_dot_project_connections FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.atlas_dots WHERE id = dot_id AND user_id = auth.uid()));

CREATE POLICY "Users read own cluster-project connections" ON public.atlas_cluster_project_connections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.atlas_project_nodes WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users insert own cluster-project connections" ON public.atlas_cluster_project_connections FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.atlas_project_nodes WHERE id = project_id AND user_id = auth.uid()));
```

## Seed Data (via insert tool)

Insert 4 meta domains: Person, Process, Product, Environment.

Insert 13 clusters mapped to domains:
- **Person**: Life Events, Passions, Values, Natural Talents, Childhood Signals
- **Process**: Skills, Aha Moments, Experiments
- **Product**: Vision for a Better World, Ideal Life
- **Environment**: Personal Frustrations, Inspirations, External Reflections

Insert sample dots (7-8 dots across several clusters) for visual testing.

## Navigation Update

**File: `src/components/layout/BottomNavigation.tsx`**

Update `navItems` to 5 tabs in new order:
1. Home → `/dashboard` (LayoutGrid icon)
2. Atlas → `/atlas` (Compass icon from lucide)
3. Creators → `/creators` (Globe icon)
4. Chats → `/council` (Users icon)
5. Projects → `/creation-lab` (FlaskConical icon, label changed from "Creation Lab" to "Projects")

Remove Profile from bottom nav (accessible from Dashboard header or settings).

## New Files

### `src/pages/AtlasPage.tsx`
Main Atlas screen. Fetches clusters + user dots from database. Renders cluster map as an organic visual layout (not a grid/spreadsheet). Each cluster is a visual node showing name, dot count, and state-based styling.

### `src/components/atlas/AtlasClusterNode.tsx`
Visual cluster component. Props: cluster data + dot count. States:
- **Locked**: dimmed, lock icon
- **Available**: subtle glow, tap to explore
- **Activated**: small dots visible, gentle pulse
- **Growing**: more dots, brighter glow
- **Rich**: full glow, particle effect

Tap opens cluster detail panel.

### `src/components/atlas/AtlasClusterDetail.tsx`
Slide-up panel (using Sheet/Drawer). Shows:
- Cluster title + description
- List of dots collected
- Empty state: "This area will grow as you explore yourself."
- Placeholder sections for future quests/insights

### `src/components/atlas/AtlasDotCard.tsx`
Individual dot display. Shows title, short description, timestamp. Tap opens dot detail modal.

### `src/components/atlas/AtlasDotDetailModal.tsx`
Dialog showing full dot info: title, cluster source, explanation, created date.

### `src/components/atlas/index.ts`
Barrel exports.

### `src/hooks/useAtlas.tsx`
Custom hook. Fetches:
- All clusters (with meta domain join)
- User's dots (grouped by cluster_id)
- Computes cluster states based on dot count (0=available, 1=activated, 2-3=growing, 4+=rich)
- Returns clusters with computed state + dot counts

## Route Addition

**File: `src/App.tsx`**

Add route:
```tsx
<Route path="/atlas" element={session ? <AppLayout><AtlasPage /></AppLayout> : <Navigate to="/" />} />
```

## Visual Design Direction

The Atlas screen layout:
- Dark background with subtle radial gradient
- Clusters arranged in an organic scattered layout (not a rigid grid)
- 4 meta-domain color families: Person (violet), Process (blue), Product (emerald), Environment (amber)
- Clusters use soft glowing circles/cards with the domain color
- Dots rendered as small luminous circles around their parent cluster
- Framer Motion animations for entrance and state transitions
- Empty clusters show a soft dashed outline with muted text

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/AtlasPage.tsx` | Create |
| `src/components/atlas/AtlasClusterNode.tsx` | Create |
| `src/components/atlas/AtlasClusterDetail.tsx` | Create |
| `src/components/atlas/AtlasDotCard.tsx` | Create |
| `src/components/atlas/AtlasDotDetailModal.tsx` | Create |
| `src/components/atlas/index.ts` | Create |
| `src/hooks/useAtlas.tsx` | Create |
| `src/components/layout/BottomNavigation.tsx` | Edit (new nav structure) |
| `src/App.tsx` | Edit (add Atlas route) |

