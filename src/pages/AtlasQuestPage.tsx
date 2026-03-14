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

  let questData: { quest: any; clusterId: string } | null = null;

  if (clusterId) {
    questData = getClusterQuest(clusterId);
  } else {
    questData = getNextQuest();
  }

  if (!questData) {
    return <Navigate to="/atlas" replace />;
  }

  return <AtlasQuestFlow quest={questData.quest} clusterId={questData.clusterId} />;
};

export default AtlasQuestPage;
