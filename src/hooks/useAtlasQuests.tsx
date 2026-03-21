import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ATLAS_QUESTS, AtlasQuestDefinition } from "@/data/atlasQuests";
import { useAtlas } from "./useAtlas";
import type { AggregatedSignal } from "@/lib/atlasSignalEngine";

const STRENGTH_CLUSTERS = new Set(["passions", "skills", "natural-talents", "experiments", "values", "inspirations", "ideal-life", "vision-for-a-better-world"]);
const LIFE_IMPRINT_CLUSTERS = new Set(["life-events", "childhood-signals", "aha-moments"]);
const SHADOW_CLUSTERS = new Set(["personal-frustrations", "external-reflections"]);

export function useAtlasQuests() {
  const { clusters, totalDots } = useAtlas();

  const completedQuery = useQuery({
    queryKey: ["atlas-quests-completed"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("atlas_quests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed");
      if (error) throw error;
      return data || [];
    },
  });

  const signalsQuery = useQuery({
    queryKey: ["atlas-signals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("atlas_signals")
        .select("signal_name, strength")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
  });

  const patternsQuery = useQuery({
    queryKey: ["atlas-patterns"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("atlas_patterns")
        .select("pattern_key")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
  });

  const aggregatedSignals: AggregatedSignal[] = (() => {
    const map = new Map<string, number>();
    for (const s of signalsQuery.data || []) {
      map.set(s.signal_name, (map.get(s.signal_name) || 0) + s.strength);
    }
    return Array.from(map.entries()).map(([signalName, totalStrength]) => ({
      signalName,
      totalStrength,
    }));
  })();

  const detectedPatternKeys = new Set(
    (patternsQuery.data || []).map((p: any) => p.pattern_key)
  );

  const completedKeys = new Set((completedQuery.data || []).map((q: any) => q.quest_key));
  const completedCount = completedKeys.size;

  // Track last 2 completed cluster IDs for rotation enforcement
  const recentCompleted = (completedQuery.data || [])
    .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  const lastCompletedCluster = recentCompleted[0]?.cluster_id;
  const lastTwoClusterIds = recentCompleted.slice(0, 2).map((q: any) => q.cluster_id);

  function getPreferredClusterSlugs(): Set<string> {
    if (completedCount < 3) return STRENGTH_CLUSTERS;
    if (completedCount === 3) return LIFE_IMPRINT_CLUSTERS;
    if (completedCount >= 5 && completedCount % 4 === 1) return SHADOW_CLUSTERS;
    return STRENGTH_CLUSTERS;
  }

  function getNextQuest(): { quest: AtlasQuestDefinition; clusterId: string } | null {
    // Only consider quests for unlocked clusters
    const unlockedSlugs = new Set(
      clusters.filter(c => c.computedState !== "locked").map(c => c.slug)
    );

    const available = ATLAS_QUESTS.filter(q =>
      !completedKeys.has(q.questKey) && unlockedSlugs.has(q.clusterSlug)
    );
    if (available.length === 0) return null;

    const preferredSlugs = getPreferredClusterSlugs();

    // Max-2 rotation: if last 2 quests were in the same cluster, exclude it entirely
    const sameClusterTwice = lastTwoClusterIds.length === 2 && lastTwoClusterIds[0] === lastTwoClusterIds[1];
    const excludedClusterId = sameClusterTwice ? lastTwoClusterIds[0] : null;

    const weighted = available.map(q => {
      const cluster = clusters.find(c => c.slug === q.clusterSlug);
      if (!cluster) return { quest: q, clusterId: "", weight: 0 };
      // Exclude cluster that appeared 2x in a row
      if (excludedClusterId && cluster.id === excludedClusterId) return { quest: q, clusterId: "", weight: 0 };
      const dotPenalty = cluster.dotCount * 2;
      const lastPenalty = cluster.id === lastCompletedCluster ? 5 : 0;
      const preferenceBonus = preferredSlugs.has(q.clusterSlug) ? 8 : 0;
      // Boost weight for newly unlocked clusters (activated/dormant with 0-1 dots)
      const newlyUnlockedBonus = cluster.dotCount <= 1 && cluster.computedState !== "locked" ? 4 : 0;
      return { quest: q, clusterId: cluster.id, weight: Math.max(1, 10 - dotPenalty - lastPenalty + preferenceBonus + newlyUnlockedBonus) };
    }).filter(w => w.clusterId && w.weight > 0);

    if (weighted.length === 0) return null;

    const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const w of weighted) {
      rand -= w.weight;
      if (rand <= 0) return { quest: w.quest, clusterId: w.clusterId };
    }
    return { quest: weighted[0].quest, clusterId: weighted[0].clusterId };
  }

  function getQuestForCluster(clusterId: string): { quest: AtlasQuestDefinition; clusterId: string } | null {
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster || cluster.computedState === "locked") return null;
    const quest = ATLAS_QUESTS.find(q => q.clusterSlug === cluster.slug && !completedKeys.has(q.questKey));
    if (!quest) return null;
    return { quest, clusterId };
  }

  return {
    completedQuests: completedQuery.data || [],
    completedKeys,
    completedCount,
    aggregatedSignals,
    detectedPatternKeys,
    isLoading: completedQuery.isLoading,
    getNextQuest,
    getQuestForCluster,
  };
}
