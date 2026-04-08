import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AtlasMetaDomain {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface AtlasCluster {
  id: string;
  name: string;
  slug: string;
  meta_domain_id: string | null;
  description: string | null;
  sort_order: number;
  cluster_category: string | null;
  meta_domain?: AtlasMetaDomain;
}

export interface AtlasDot {
  id: string;
  user_id: string;
  cluster_id: string | null;
  title: string;
  short_description: string | null;
  confidence_score: number | null;
  dot_type: string | null;
  dot_category: string | null;
  signal_sources: any;
  signal_strength: number | null;
  source_system: string | null;
  created_at: string | null;
}

export type GrowthLevel = "dormant" | "activated" | "growing" | "resonant" | "mature";
export type ClusterState = "locked" | "dormant" | "activated" | "growing" | "resonant" | "mature";

export interface ClusterWithState extends AtlasCluster {
  dots: AtlasDot[];
  dotCount: number;
  computedState: ClusterState;
  growthLevel: GrowthLevel;
  unlockPhase: number;
}

// Phase unlock thresholds (total dots across all clusters)
const PHASE_THRESHOLDS = [0, 0, 3, 6, 8, 8]; // phase 1 always, 2 at 3+, 3 at 6+, 4 at 8+, 5 at 8+

const PHASE_SLUGS: Record<number, Set<string>> = {
  1: new Set(["passions", "skills", "personal-frustrations", "experiments", "golden-moments"]),
  2: new Set(["natural-talents", "aha-moments", "life-events"]),
  3: new Set(["values", "inspirations", "childhood-signals"]),
  4: new Set(["ideal-life", "vision-for-a-better-world", "external-reflections"]),
  5: new Set(["who-i-serve", "how-i-create-impact"]),
};

function getUnlockPhase(slug: string): number {
  for (const [phase, slugs] of Object.entries(PHASE_SLUGS)) {
    if (slugs.has(slug)) return Number(phase);
  }
  return 4;
}

function isClusterUnlocked(slug: string, totalDots: number): boolean {
  const phase = getUnlockPhase(slug);
  return totalDots >= PHASE_THRESHOLDS[phase];
}

function computeGrowthLevel(dotCount: number): GrowthLevel {
  if (dotCount === 0) return "dormant";
  if (dotCount === 1) return "activated";
  if (dotCount <= 4) return "growing";
  if (dotCount <= 8) return "resonant";
  return "mature";
}

function computeState(dotCount: number, unlocked: boolean): ClusterState {
  if (!unlocked) return "locked";
  return computeGrowthLevel(dotCount);
}

export const DOMAIN_COLORS: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  // Person → hot magenta/pink (distinct from button purple which is 265)
  Person: { bg: "hsl(330 85% 62%)", text: "hsl(330 70% 90%)", glow: "hsl(330 85% 62% / 0.4)", border: "hsl(330 80% 50%)" },
  // Process → electric cyan-blue (more vivid)
  Process: { bg: "hsl(205 95% 60%)", text: "hsl(205 80% 90%)", glow: "hsl(205 95% 60% / 0.4)", border: "hsl(205 90% 48%)" },
  // Product → neon emerald
  Product: { bg: "hsl(155 75% 52%)", text: "hsl(155 60% 90%)", glow: "hsl(155 75% 52% / 0.4)", border: "hsl(155 70% 40%)" },
  // Environment → neon amber/orange
  Environment: { bg: "hsl(35 100% 58%)", text: "hsl(35 85% 90%)", glow: "hsl(35 100% 58% / 0.4)", border: "hsl(35 95% 45%)" },
};

export const CLUSTER_COLORS: Record<string, { bg: string; glow: string }> = {
  "golden-moments": { bg: "hsl(45 100% 58%)", glow: "hsl(45 100% 58% / 0.45)" },
  project: { bg: "hsl(0 80% 58%)", glow: "hsl(0 80% 58% / 0.45)" },
};

export const DOT_TYPE_COLORS: Record<string, string> = {
  strength: "hsl(195 90% 60%)",
  shadow: "hsl(330 75% 58%)",
  life_imprint: "hsl(45 100% 58%)",
};

export function getDotColor(dot: AtlasDot): string {
  const cat = dot.dot_category || "strength";
  return DOT_TYPE_COLORS[cat] || DOT_TYPE_COLORS.strength;
}

export const GROWTH_LEVEL_LABELS: Record<GrowthLevel, string> = {
  dormant: "Dormant",
  activated: "Activated",
  growing: "Growing",
  resonant: "Resonant",
  mature: "Mature",
};

export function getCurrentPhase(totalDots: number): number {
  if (totalDots >= PHASE_THRESHOLDS[5]) return 5;
  if (totalDots >= PHASE_THRESHOLDS[4]) return 4;
  if (totalDots >= PHASE_THRESHOLDS[3]) return 3;
  if (totalDots >= PHASE_THRESHOLDS[2]) return 2;
  return 1;
}

export function getNextPhaseThreshold(totalDots: number): number | null {
  for (let i = 2; i <= 5; i++) {
    if (totalDots < PHASE_THRESHOLDS[i]) return PHASE_THRESHOLDS[i];
  }
  return null;
}

export function useAtlas() {
  const domainsQuery = useQuery({
    queryKey: ["atlas-meta-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atlas_meta_domains")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as AtlasMetaDomain[];
    },
  });

  const clustersQuery = useQuery({
    queryKey: ["atlas-clusters"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: baseClusters, error: baseError } = await supabase
        .from("atlas_clusters")
        .select("*, atlas_meta_domains(*)")
        .neq("cluster_category", "project")
        .order("sort_order");

      if (baseError) throw baseError;

      const clusterMap = new Map<string, any>((baseClusters || []).map((cluster: any) => [cluster.id, cluster]));

      if (user) {
        const { data: projectNodes, error: projectNodesError } = await supabase
          .from("atlas_project_nodes")
          .select("id")
          .eq("user_id", user.id);

        if (projectNodesError) throw projectNodesError;

        const projectNodeIds = (projectNodes || []).map((node) => node.id);

        if (projectNodeIds.length > 0) {
          const { data: projectConnections, error: projectConnectionsError } = await supabase
            .from("atlas_cluster_project_connections")
            .select("cluster_id")
            .in("project_id", projectNodeIds);

          if (projectConnectionsError) throw projectConnectionsError;

          const projectClusterIds = Array.from(
            new Set((projectConnections || []).map((connection) => connection.cluster_id).filter(Boolean))
          );

          if (projectClusterIds.length > 0) {
            const { data: projectClusters, error: projectClustersError } = await supabase
              .from("atlas_clusters")
              .select("*, atlas_meta_domains(*)")
              .in("id", projectClusterIds)
              .order("created_at", { ascending: true });

            if (projectClustersError) throw projectClustersError;

            (projectClusters || []).forEach((cluster: any) => {
              clusterMap.set(cluster.id, cluster);
            });
          }
        }
      }

      return Array.from(clusterMap.values()).sort((a: any, b: any) => {
        const aProject = a.cluster_category === "project";
        const bProject = b.cluster_category === "project";
        if (aProject !== bProject) return aProject ? 1 : -1;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }) as any[];
    },
  });

  const dotsQuery = useQuery({
    queryKey: ["atlas-dots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atlas_dots")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AtlasDot[];
    },
  });

  // Fetch mini-dot counts per dot
  const miniDotCountsQuery = useQuery({
    queryKey: ["atlas-mini-dot-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atlas_mini_dots")
        .select("parent_dot_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        counts[row.parent_dot_id] = (counts[row.parent_dot_id] || 0) + 1;
      });
      return counts;
    },
  });

  const miniDotCounts = miniDotCountsQuery.data || {};
  const allDots = dotsQuery.data || [];
  const totalDots = allDots.length;

  const clusters: ClusterWithState[] = (clustersQuery.data || []).map((c: any) => {
    const clusterDots = allDots.filter((d) => d.cluster_id === c.id);
    const isProjectCluster = c.cluster_category === "project";
    const unlocked = isProjectCluster || isClusterUnlocked(c.slug, totalDots);
    const phase = isProjectCluster ? 0 : getUnlockPhase(c.slug);
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      meta_domain_id: c.meta_domain_id,
      description: c.description,
      sort_order: c.sort_order,
      cluster_category: c.cluster_category || "identity",
      meta_domain: c.atlas_meta_domains || undefined,
      dots: clusterDots,
      dotCount: clusterDots.length,
      computedState: computeState(clusterDots.length, unlocked),
      growthLevel: unlocked ? computeGrowthLevel(clusterDots.length) : "dormant",
      unlockPhase: phase,
    };
  });

  // Thread unlock ready: ≥3 quests completed, ≥2 dots across ≥2 clusters
  const uniqueClustersWithDots = new Set(allDots.map(d => d.cluster_id).filter(Boolean));
  const threadUnlockReady = totalDots >= 2 && uniqueClustersWithDots.size >= 2;

  return {
    domains: domainsQuery.data || [],
    clusters,
    dots: allDots,
    totalDots,
    threadUnlockReady,
    miniDotCounts,
    isLoading: domainsQuery.isLoading || clustersQuery.isLoading || dotsQuery.isLoading || miniDotCountsQuery.isLoading,
    error: domainsQuery.error || clustersQuery.error || dotsQuery.error,
  };
}
