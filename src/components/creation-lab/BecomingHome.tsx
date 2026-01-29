import { motion } from "framer-motion";
import { FutureSelfInbox } from "@/components/becoming/FutureSelfInbox";
import { IdealLifeSnapshot } from "@/components/becoming/IdealLifeSnapshot";
import { SelfDiscoveryQuests } from "@/components/becoming/SelfDiscoveryQuests";
import { CoreDiscoveries } from "@/components/becoming/CoreDiscoveries";
import { DailyJournal } from "@/components/becoming/DailyJournal";
import { ActualSelfSummaryCard } from "@/components/becoming/ActualSelfSummaryCard";
import { LifeDomainsRadar } from "@/components/LifeDomainsRadar";

export const BecomingHome = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Primary Journey */}
        <div className="space-y-6">
          {/* Future Self Inbox - Primary communication */}
          <FutureSelfInbox />

          {/* Self-Discovery Quests */}
          <SelfDiscoveryQuests />

          {/* Daily Journal */}
          <DailyJournal />
        </div>

        {/* Right Column - Discoveries & Vision */}
        <div className="space-y-6">
          {/* Actual Self - Pattern Profile */}
          <ActualSelfSummaryCard />

          {/* Ideal Life Snapshot - Visual north star */}
          <IdealLifeSnapshot />

          {/* Core Discoveries - Living insights */}
          <CoreDiscoveries />

          {/* Life Domains Radar - Awareness view */}
          <LifeDomainsRadar />
        </div>
      </div>
    </motion.div>
  );
};
