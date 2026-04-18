import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ATLAS_QUESTS, ONBOARDING_QUESTS, ONBOARDING_QUEST_SEQUENCE, CONNECTION_MOMENT_AFTER, AtlasQuestDefinition } from "@/data/atlasQuests";
import { useAtlas } from "./useAtlas";
import type { AggregatedSignal } from "@/lib/atlasSignalEngine";

const STRENGTH_CLUSTERS = new Set(["passions", "skills", "natural-talents", "experiments", "values", "inspirations", "ideal-life", "vision-for-a-better-world"]);
const LIFE_IMPRINT_CLUSTERS = new Set(["life-events", "childhood-signals", "aha-moments"]);
const SHADOW_CLUSTERS = new Set(["personal-frustrations", "external-reflections"]);
const SERVICE_CLUSTERS = new Set(["who-i-serve", "how-i-create-impact"]);
// Phase-specific pre-council cluster slugs (must match AtlasPage PHASE1_SLUGS_BY_STATE)
const PHASE_PRE_COUNCIL_SLUGS: Record<string, string[]> = {
  BUILD:    ["skills", "passions"],
  GROW:     ["skills", "passions", "life-events"],
  DISCOVER: ["skills", "passions", "life-events", "experiments"],
};

// Order is driven by ONBOARDING_QUEST_SEQUENCE — DO NOT sort by array position
const CORE_ONBOARDING_QUESTS = ONBOARDING_QUEST_SEQUENCE
  .map(slug => ONBOARDING_QUESTS.find(q => q.clusterSlug === slug && q.questKey.startsWith("onboarding_")))
  .filter((q): q is AtlasQuestDefinition => q !== undefined);
// Service quests are in ATLAS_QUESTS, not ONBOARDING_QUESTS — include them in discovery pool
const DISCOVERY_QUESTS = ATLAS_QUESTS;

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

  const profileQuery = useQuery({
    queryKey: ["profile-onboarding-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_quest_completed, entry_state" as any)
        .eq("id", user.id)
        .single();
      return data;
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

  const isOnboardingCompleted = (profileQuery.data as any)?.onboarding_quest_completed === true;
  const isOnboarding = !isOnboardingCompleted;
  const entryState: string = (profileQuery.data as any)?.entry_state || "DISCOVER";

  // Count completed onboarding quests specifically
  const completedOnboardingCount = CORE_ONBOARDING_QUESTS.filter(q => completedKeys.has(q.questKey)).length;

  // Track last 2 completed cluster IDs for rotation enforcement
  const recentCompleted = (completedQuery.data || [])
    .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  const lastCompletedCluster = recentCompleted[0]?.cluster_id;
  const lastTwoClusterIds = recentCompleted.slice(0, 2).map((q: any) => q.cluster_id);

  function getPreferredClusterSlugs(): Set<string> {
    if (completedCount < 4) return STRENGTH_CLUSTERS;
    if (completedCount === 4) return LIFE_IMPRINT_CLUSTERS;
    if (completedCount >= 10) return SERVICE_CLUSTERS;
    if (completedCount >= 5 && completedCount % 4 === 1) return SHADOW_CLUSTERS;
    return STRENGTH_CLUSTERS;
  }

  function getNextOnboardingQuest(): { quest: AtlasQuestDefinition; clusterId: string; onboardingIndex: number } | null {
    const preCouncilSlugs = PHASE_PRE_COUNCIL_SLUGS[entryState] || PHASE_PRE_COUNCIL_SLUGS.DISCOVER;

    // Check whether all pre-council clusters already have at least one dot
    const preCouncilComplete = preCouncilSlugs.every(slug => {
      const cluster = clusters.find(c => c.slug === slug);
      return cluster && cluster.dotCount > 0;
    });

    if (!preCouncilComplete) {
      // Guide the user through the phase-specific pre-council sequence first
      for (const slug of preCouncilSlugs) {
        const cluster = clusters.find(c => c.slug === slug);
        if (!cluster) continue;
        // Only offer the quest if the cluster has no dots yet (hasn't been explored)
        if (cluster.dotCount > 0) continue;
        const questIndex = CORE_ONBOARDING_QUESTS.findIndex(q => q.clusterSlug === slug && !completedKeys.has(q.questKey));
        if (questIndex !== -1) {
          return { quest: CORE_ONBOARDING_QUESTS[questIndex], clusterId: cluster.id, onboardingIndex: questIndex };
        }
      }
    }

    // Pre-council done (or all pre-council clusters explored): continue full sequence
    for (let i = 0; i < CORE_ONBOARDING_QUESTS.length; i++) {
      const quest = CORE_ONBOARDING_QUESTS[i];
      if (!completedKeys.has(quest.questKey)) {
        const cluster = clusters.find(c => c.slug === quest.clusterSlug);
        if (cluster) {
          return { quest, clusterId: cluster.id, onboardingIndex: i };
        }
      }
    }
    return null;
  }

  function getNextQuest(): { quest: AtlasQuestDefinition; clusterId: string; onboardingIndex?: number } | null {
    // During onboarding, use fixed sequence
    if (isOnboarding) {
      return getNextOnboardingQuest();
    }

    // Post-onboarding: weighted selection from ATLAS_QUESTS
    const unlockedSlugs = new Set(
      clusters.filter(c => c.computedState !== "locked").map(c => c.slug)
    );

    const available = DISCOVERY_QUESTS.filter(q =>
      !completedKeys.has(q.questKey) && unlockedSlugs.has(q.clusterSlug)
    );
    if (available.length === 0) return null;

    const preferredSlugs = getPreferredClusterSlugs();

    const sameClusterTwice = lastTwoClusterIds.length === 2 && lastTwoClusterIds[0] === lastTwoClusterIds[1];
    const excludedClusterId = sameClusterTwice ? lastTwoClusterIds[0] : null;

    const weighted = available.map(q => {
      const cluster = clusters.find(c => c.slug === q.clusterSlug);
      if (!cluster) return { quest: q, clusterId: "", weight: 0 };
      if (excludedClusterId && cluster.id === excludedClusterId) return { quest: q, clusterId: "", weight: 0 };
      const dotPenalty = cluster.dotCount * 2;
      const lastPenalty = cluster.id === lastCompletedCluster ? 5 : 0;
      const preferenceBonus = preferredSlugs.has(q.clusterSlug) ? 8 : 0;
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
    if (!cluster) return null;
    // During onboarding bypass the lock check — users can explore any cluster.
    // Post-onboarding, locked clusters are off-limits.
    if (!isOnboarding && cluster.computedState === "locked") return null;

    // During onboarding: if this cluster is one of the pre-council steps AND it already
    // has a dot, lock it — the user must complete the other pre-council clusters first.
    // This prevents doing 2+ quests for the same step (e.g. 2 skills quests).
    if (isOnboarding) {
      const preCouncilSlugs = PHASE_PRE_COUNCIL_SLUGS[entryState] || PHASE_PRE_COUNCIL_SLUGS.DISCOVER;
      if (preCouncilSlugs.includes(cluster.slug) && cluster.dotCount > 0) return null;
    }

    // During onboarding, prefer the onboarding quest for this cluster so the
    // pre-council sequence uses the right quest definitions. ATLAS_QUESTS also
    // contain quests for these clusters and would be picked first otherwise.
    if (isOnboarding) {
      const onboardingQuest = ONBOARDING_QUESTS.find(
        q => q.clusterSlug === cluster.slug && !completedKeys.has(q.questKey)
      );
      if (onboardingQuest) return { quest: onboardingQuest, clusterId };
    }

    // Post-onboarding: search ATLAS_QUESTS first, then ONBOARDING_QUESTS for
    // clusters like who-i-serve / how-i-create-impact that only exist there.
    const quest = [...DISCOVERY_QUESTS, ...ONBOARDING_QUESTS].find(
      q => q.clusterSlug === cluster.slug && !completedKeys.has(q.questKey)
    );
    if (!quest) return null;
    return { quest, clusterId };
  }

  // Check if current quest should show a connection moment after completing
  function shouldShowConnectionMoment(onboardingIndex: number): boolean {
    return isOnboarding && CONNECTION_MOMENT_AFTER.includes(onboardingIndex);
  }

  function isIdentityMoment(onboardingIndex: number): boolean {
    return onboardingIndex === 12; // After quest 13 (index 12)
  }

  return {
    completedQuests: completedQuery.data || [],
    completedKeys,
    completedCount,
    completedOnboardingCount,
    aggregatedSignals,
    detectedPatternKeys,
    isLoading: completedQuery.isLoading || profileQuery.isLoading,
    isFetching: completedQuery.isFetching || profileQuery.isFetching,
    isOnboarding,
    isOnboardingCompleted,
    entryState,
    getNextQuest,
    getNextOnboardingQuest,
    getQuestForCluster,
    shouldShowConnectionMoment,
    isIdentityMoment,
  };
}
