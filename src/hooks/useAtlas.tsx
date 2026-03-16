import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DotCategory } from "@/data/atlasSignals";

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

export type ClusterState = "locked" | "available" | "activated" | "growing" | "rich";

export interface ClusterWithState extends AtlasCluster {
  dots: AtlasDot[];
  dotCount: number;
  computedState: ClusterState;
}

function computeState(dotCount: number): ClusterState {
  if (dotCount === 0) return "available";
  if (dotCount === 1) return "activated";
  if (dotCount <= 3) return "growing";
  return "rich";
}

export const DOMAIN_COLORS: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  Person: { bg: "hsl(270 60% 60%)", text: "hsl(270 60% 85%)", glow: "hsl(270 60% 60% / 0.3)", border: "hsl(270 60% 50%)" },
  Process: { bg: "hsl(210 80% 55%)", text: "hsl(210 80% 85%)", glow: "hsl(210 80% 55% / 0.3)", border: "hsl(210 80% 45%)" },
  Product: { bg: "hsl(155 60% 45%)", text: "hsl(155 60% 85%)", glow: "hsl(155 60% 45% / 0.3)", border: "hsl(155 60% 35%)" },
  Environment: { bg: "hsl(35 80% 55%)", text: "hsl(35 80% 85%)", glow: "hsl(35 80% 55% / 0.3)", border: "hsl(35 80% 45%)" },
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

  const clusters: ClusterWithState[] = (clustersQuery.data || []).map((c: any) => {
    const clusterDots = (dotsQuery.data || []).filter((d) => d.cluster_id === c.id);
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      meta_domain_id: c.meta_domain_id,
      description: c.description,
      sort_order: c.sort_order,
      meta_domain: c.atlas_meta_domains || undefined,
      dots: clusterDots,
      dotCount: clusterDots.length,
      computedState: computeState(clusterDots.length),
    };
  });

  return {
    domains: domainsQuery.data || [],
    clusters,
    dots: dotsQuery.data || [],
    isLoading: domainsQuery.isLoading || clustersQuery.isLoading || dotsQuery.isLoading,
    error: domainsQuery.error || clustersQuery.error || dotsQuery.error,
  };
}
