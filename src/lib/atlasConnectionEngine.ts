import type { AtlasDot } from "@/hooks/useAtlas";

export interface AtlasConnection {
  dotIdA: string;
  dotIdB: string;
  connectionType: "signal_overlap" | "gold_moment";
  sharedSignals: string[];
  strength: number;
  isGoldMoment: boolean;
}

// Clusters whose dots represent frustrations/shadows
const FRUSTRATION_CLUSTERS = new Set(["personal-frustrations"]);

// Clusters whose dots represent strengths/skills
const STRENGTH_CLUSTERS = new Set(["skills", "natural-talents", "experiments"]);

export function detectConnections(
  dots: AtlasDot[],
  existingPairs: Set<string>,
  clusterSlugMap: Record<string, string> // clusterId -> slug
): AtlasConnection[] {
  const newConnections: AtlasConnection[] = [];

  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const a = dots[i];
      const b = dots[j];

      // Skip same cluster
      if (a.cluster_id === b.cluster_id) continue;

      // Skip existing
      const pairKey = [a.id, b.id].sort().join(":");
      if (existingPairs.has(pairKey)) continue;

      const aSignals: string[] = Array.isArray(a.signal_sources) ? a.signal_sources : [];
      const bSignals: string[] = Array.isArray(b.signal_sources) ? b.signal_sources : [];

      const aSet = new Set(aSignals);
      const shared = bSignals.filter(s => aSet.has(s));

      // Gold moments need 2 shared signals, regular connections need 3
      const aSlugPrecheck = a.cluster_id ? clusterSlugMap[a.cluster_id] : "";
      const bSlugPrecheck = b.cluster_id ? clusterSlugMap[b.cluster_id] : "";
      const isGoldCandidate =
        (FRUSTRATION_CLUSTERS.has(aSlugPrecheck) && STRENGTH_CLUSTERS.has(bSlugPrecheck)) ||
        (FRUSTRATION_CLUSTERS.has(bSlugPrecheck) && STRENGTH_CLUSTERS.has(aSlugPrecheck));
      const minShared = isGoldCandidate ? 2 : 3;
      if (shared.length < minShared) continue;

      // Check for Gold Moment
      const aSlug = a.cluster_id ? clusterSlugMap[a.cluster_id] : "";
      const bSlug = b.cluster_id ? clusterSlugMap[b.cluster_id] : "";

      const isGold =
        (FRUSTRATION_CLUSTERS.has(aSlug) && STRENGTH_CLUSTERS.has(bSlug)) ||
        (FRUSTRATION_CLUSTERS.has(bSlug) && STRENGTH_CLUSTERS.has(aSlug));

      newConnections.push({
        dotIdA: a.id,
        dotIdB: b.id,
        connectionType: isGold ? "gold_moment" : "signal_overlap",
        sharedSignals: shared,
        strength: shared.length,
        isGoldMoment: isGold,
      });
    }
  }

  return newConnections;
}

export function findGoldMoments(connections: AtlasConnection[]): AtlasConnection[] {
  return connections.filter(c => c.isGoldMoment);
}
