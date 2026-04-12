import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAtlasQuests } from "@/hooks/useAtlasQuests";
import { AtlasQuestFlow } from "@/components/atlas/AtlasQuestFlow";
import { useAtlas } from "@/hooks/useAtlas";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";

const AtlasQuestPage = () => {
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("cluster");
  const { isLoading } = useAtlas();
  const { getNextQuest, getQuestForCluster: getClusterQuest, isLoading: questsLoading, isFetching: questsFetching } = useAtlasQuests();

  // Lock in the quest once after all data is fresh — prevents stale cache from picking
  // a wrong quest, and prevents Math.random() from drifting on re-renders.
  // We must wait for isFetching too: after quest completion, the query is invalidated
  // and the cache is stale until the refetch finishes. Locking with stale data would
  // pick the just-completed quest again or the wrong next one.
  type QuestData = { quest: any; clusterId: string; onboardingIndex?: number } | null;
  const [lockedQuestData, setLockedQuestData] = useState<QuestData | "none">("none");
  // Safety valve: after 4 s, force-proceed regardless of loading state so the
  // spinner can never be permanently stuck (e.g. due to a background-refetch loop).
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const ready = timedOut || (!isLoading && !questsLoading && !questsFetching);
    if (!ready) return;
    if (lockedQuestData !== "none") return; // already locked
    const data = clusterId ? getClusterQuest(clusterId) : getNextQuest();
    setLockedQuestData(data ?? null);
  }, [isLoading, questsLoading, questsFetching, timedOut]);

  if (isLoading || questsLoading || questsFetching || lockedQuestData === "none") {
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Compass className="w-10 h-10 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">All quests completed</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          You've explored every available quest. Keep adding dots and mini-dots to deepen your Atlas.
        </p>
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
