import { useSearchParams, Navigate } from "react-router-dom";
import { useAtlasQuests } from "@/hooks/useAtlasQuests";
import { AtlasQuestFlow } from "@/components/atlas/AtlasQuestFlow";
import { getQuestForCluster } from "@/data/atlasQuests";
import { useAtlas } from "@/hooks/useAtlas";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";

const AtlasQuestPage = () => {
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("cluster");
  const { clusters, isLoading } = useAtlas();
  const { getNextQuest, getQuestForCluster: getClusterQuest } = useAtlasQuests();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Compass className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  let questData: { quest: any; clusterId: string; onboardingIndex?: number } | null = null;

  if (clusterId) {
    questData = getClusterQuest(clusterId);
  } else {
    questData = getNextQuest();
  }

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
