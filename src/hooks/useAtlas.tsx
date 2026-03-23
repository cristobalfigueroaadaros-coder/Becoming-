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
const PHASE_THRESHOLDS = [0, 0, 3, 6, 10, 10]; // phase 1 always, 2 at 3+, 3 at 6+, 4 at 10+, 5 at 10+

const PHASE_SLUGS: Record<number, Set<string>> = {
  1: new Set(["passions", "skills", "life-events", "personal-frustrations", "golden-moments"]),
  2: new Set(["natural-talents", "values", "experiments"]),
  3: new Set(["childhood-signals", "inspirations", "aha-moments"]),
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
  Person: { bg: "hsl(270 60% 60%)", text: "hsl(270 60% 85%)", glow: "hsl(270 60% 60% / 0.3)", border: "hsl(270 60% 50%)" },
  Process: { bg: "hsl(210 80% 55%)", text: "hsl(210 80% 85%)", glow: "hsl(210 80% 55% / 0.3)", border: "hsl(210 80% 45%)" },
  Product: { bg: "hsl(155 60% 45%)", text: "hsl(155 60% 85%)", glow: "hsl(155 60% 45% / 0.3)", border: "hsl(155 60% 35%)" },
  Environment: { bg: "hsl(35 80% 55%)", text: "hsl(35 80% 85%)", glow: "hsl(35 80% 55% / 0.3)", border: "hsl(35 80% 45%)" },
};

export const CLUSTER_COLORS: Record<string, { bg: string; glow: string }> = {
  "golden-moments": { bg: "hsl(40 90% 55%)", glow: "hsl(40 90% 55% / 0.4)" },
};

export const DOT_TYPE_COLORS: Record<string, string> = {
  strength: "hsl(195 80% 55%)",
  shadow: "hsl(280 60% 50%)",
  life_imprint: "hsl(40 80% 55%)",
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
      const { data, error } = await supabase
        .from("atlas_clusters")
        .select("*, atlas_meta_domains(*)")
        .order("sort_order");
      if (error) throw error;
      return data as any[];
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

  const allDots = dotsQuery.data || [];
  const totalDots = allDots.length;

  const clusters: ClusterWithState[] = (clustersQuery.data || []).map((c: any) => {
    const clusterDots = allDots.filter((d) => d.cluster_id === c.id);
    const unlocked = isClusterUnlocked(c.slug, totalDots);
    const phase = getUnlockPhase(c.slug);
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

  return {
    domains: domainsQuery.data || [],
    clusters,
    dots: allDots,
    totalDots,
    isLoading: domainsQuery.isLoading || clustersQuery.isLoading || dotsQuery.isLoading,
    error: domainsQuery.error || clustersQuery.error || dotsQuery.error,
  };
}
