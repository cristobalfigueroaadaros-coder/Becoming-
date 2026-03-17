# PDR 5 — Atlas Cluster Growth and Progressive Discovery

## Summary

Implement progressive cluster unlocking (4 phases), 5 visual growth levels (Dormant→Mature), multi-orbit dot distribution around cluster nodes, growth insight messages, and quest weight adjustments for balanced exploration.

## Database Migration

Add per-user cluster tracking table (clusters themselves are shared reference data, but growth state is per-user):

```sql
CREATE TABLE public.atlas_cluster_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cluster_id uuid REFERENCES public.atlas_clusters(id) ON DELETE CASCADE,
  unlock_phase int NOT NULL DEFAULT 0,        -- 1-4
  growth_level int NOT NULL DEFAULT 0,        -- 0-4 (dormant/activated/growing/resonant/mature)
  activated_at timestamptz,
  last_interaction_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cluster_id)
);

ALTER TABLE public.atlas_cluster_progress ENABLE ROW LEVEL SECURITY;
-- Standard user-owns-row SELECT/INSERT/UPDATE policies
```

Also add `cluster_category` column to `atlas_clusters`:

```sql
ALTER TABLE public.atlas_clusters 
  ADD COLUMN IF NOT EXISTS cluster_category text DEFAULT 'identity';
-- identity | experience | vision

UPDATE public.atlas_clusters SET cluster_category = 'identity' WHERE slug IN ('natural-talents','childhood-signals','passions','values','external-reflections');
UPDATE public.atlas_clusters SET cluster_category = 'experience' WHERE slug IN ('life-events','aha-moments','personal-frustrations','experiments','skills');
UPDATE public.atlas_clusters SET cluster_category = 'vision' WHERE slug IN ('vision-for-a-better-world','ideal-life','inspirations');
```

## Unlock Phases

Computed client-side based on total dot count across all clusters:


| Phase         | Clusters Unlocked                                           | Trigger          |
| ------------- | ----------------------------------------------------------- | ---------------- |
| 1 — Entry     | Passions, Skills, Life Events, Personal Frustrations        | Always available |
| 2 — Discovery | Natural Talents, Values, Experiments                        | 3+ total dots    |
| 3 — Depth     | Childhood Signals, Inspirations, Aha Moments                | 6+ total dots    |
| 4 — Vision    | Ideal Life, Vision for a Better World, External Reflections | 10+ total dots   |


## Growth Levels (computed from dot count per cluster)


| Level | Name      | Dots      | Visual                            |
| ----- | --------- | --------- | --------------------------------- |
| 0     | Dormant   | 0, locked | Hidden or faint lock icon         |
| 1     | Activated | 1         | Soft pulse, visible               |
| 2     | Growing   | 2-4       | Moderate glow                     |
| 3     | Resonant  | 5-8       | Strong glow, slightly larger node |
| 4     | Mature    | 9+        | Full intensity, largest node      |


## Multi-Orbit Dot Layout

New utility in `AtlasClusterNode.tsx` — position dots in concentric rings:

- Orbit 1 (radius ~20px): first 6 dots, evenly spaced angularly
- Orbit 2 (radius ~34px): dots 7-14
- Orbit 3 (radius ~48px): dots 15+

Each dot rendered as a small colored circle at its computed angular position around the cluster center.

## Growth Insight Messages

When a cluster transitions to a new growth level, show a toast notification with contextual messages. Detected by comparing previous dot count state in `AtlasQuestFlow.tsx` after saving a new dot.

## Files to Create/Edit


| File                                                  | Action                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Migration (atlas_cluster_progress + cluster_category) | Create                                                                                                                                |
| `src/hooks/useAtlas.tsx`                              | Edit — add unlock phase logic, update `ClusterState` to 5 levels (dormant/activated/growing/resonant/mature), compute locked clusters |
| `src/components/atlas/AtlasClusterNode.tsx`           | Edit — 5-level visual system (size, glow, opacity, pulse), multi-orbit dot rendering                                                  |
| `src/pages/AtlasPage.tsx`                             | Edit — filter/dim locked clusters, show unlock progress hint                                                                          |
| `src/components/atlas/AtlasClusterDetail.tsx`         | Edit — show growth level label, poetic cluster description                                                                            |
| `src/hooks/useAtlasQuests.tsx`                        | Edit — boost quest weight for newly unlocked clusters                                                                                 |
| `src/components/atlas/AtlasQuestFlow.tsx`             | Edit — detect growth level transitions, show insight toast                                                                            |
