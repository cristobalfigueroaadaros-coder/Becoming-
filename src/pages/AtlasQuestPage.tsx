import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useAtlasQuests } from "@/hooks/useAtlasQuests";
import { AtlasQuestFlow } from "@/components/atlas/AtlasQuestFlow";
import { useAtlas } from "@/hooks/useAtlas";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";

const AtlasQuestPage = () => {
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("cluster");
  const { isLoading, clusters } = useAtlas();
  const { getNextQuest, getQuestForCluster: getClusterQuest, isLoading: questsLoading, isFetching: questsFetching, isOnboarding } = useAtlasQuests();

  // Lock in the quest once after all data is fresh — prevents stale cache from picking
  // a wrong quest, and prevents Math.random() from drifting on re-renders.
  // We must wait for isFetching too: after quest completion, the query is invalidated
  // and the cache is stale until the refetch finishes. Locking with stale data would
  // pick the just-completed quest again or the wrong next one.
  type QuestData = { quest: any; clusterId: string; onboardingIndex?: number } | null;
  const location = useLocation();
  const [lockedQuestData, setLockedQuestData] = useState<QuestData | "none">("none");
  // Reset locked quest every time we navigate to this page
  // (location.key changes on each navigation, even same-URL navigations with state).
  // Wait for fresh quest data so the just-completed quest cannot be selected again.
  useEffect(() => {
    setLockedQuestData("none");
  }, [location.key]);

  useEffect(() => {
    const ready = !isLoading && !questsLoading && !questsFetching;
    if (!ready) return;
    if (lockedQuestData !== "none") return; // already locked
    const data = clusterId ? getClusterQuest(clusterId) : getNextQuest();
    setLockedQuestData(data ?? null);
  }, [clusterId, getClusterQuest, getNextQuest, isLoading, lockedQuestData, questsFetching, questsLoading]);

  // Only gate on lockedQuestData — the loading flags control when we lock,
  // but must not block the render once the lock is set (or timed out).
  if (lockedQuestData === "none") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Compass className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  const questData = lockedQuestData;

  if (!questData) {
    // Detect if this is a locked pre-council cluster (user tapped a cluster they already explored)
    const tappedCluster = clusterId ? clusters.find(c => c.id === clusterId) : null;
    const isLockedPreCouncil = isOnboarding && tappedCluster && tappedCluster.dotCount > 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Compass className="w-10 h-10 text-primary" />
        {isLockedPreCouncil ? (
          <>
            <h2 className="text-lg font-semibold text-foreground">You've already explored this</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              This step is done. Complete the remaining steps on your path to Council, then you can go deeper here.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground">All quests completed</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              You've explored every available quest. Keep adding dots and mini-dots to deepen your Atlas.
            </p>
          </>
        )}
        <button
          onClick={() => window.history.back()}
          className="mt-2 text-sm text-primary underline"
        >
          Back to Atlas
        </button>
      </div>
    );
  }

  return <AtlasQuestFlow quest={questData.quest} clusterId={questData.clusterId} onboardingIndex={questData.onboardingIndex} />;
};

export default AtlasQuestPage;
