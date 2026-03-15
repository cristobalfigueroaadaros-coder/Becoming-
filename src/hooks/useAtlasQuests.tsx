import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ATLAS_QUESTS, AtlasQuestDefinition } from "@/data/atlasQuests";
import { useAtlas } from "./useAtlas";
import type { AggregatedSignal } from "@/lib/atlasSignalEngine";

export function useAtlasQuests() {
  const { clusters } = useAtlas();

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

  // Aggregate signals by name
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
  const lastCompletedCluster = (completedQuery.data || [])
    .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0]
    ?.cluster_id;

  function getNextQuest(): { quest: AtlasQuestDefinition; clusterId: string } | null {
    const available = ATLAS_QUESTS.filter(q => !completedKeys.has(q.questKey));
    if (available.length === 0) return null;

    const weighted = available.map(q => {
      const cluster = clusters.find(c => c.slug === q.clusterSlug);
      if (!cluster) return { quest: q, clusterId: "", weight: 1 };
      const dotPenalty = cluster.dotCount * 2;
      const lastPenalty = cluster.id === lastCompletedCluster ? 5 : 0;
      return { quest: q, clusterId: cluster.id, weight: Math.max(1, 10 - dotPenalty - lastPenalty) };
    }).filter(w => w.clusterId);

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
    if (!cluster) return null;
    const quest = ATLAS_QUESTS.find(q => q.clusterSlug === cluster.slug && !completedKeys.has(q.questKey));
    if (!quest) return null;
    return { quest, clusterId };
  }

  return {
    completedQuests: completedQuery.data || [],
    completedKeys,
    aggregatedSignals,
    detectedPatternKeys,
    isLoading: completedQuery.isLoading,
    getNextQuest,
    getQuestForCluster,
  };
}
