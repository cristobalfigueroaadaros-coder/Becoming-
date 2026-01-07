import { motion } from "framer-motion";
import { FutureSelfInbox } from "@/components/becoming/FutureSelfInbox";
import { IdealLifeSnapshot } from "@/components/becoming/IdealLifeSnapshot";
import { SelfDiscoveryQuests } from "@/components/becoming/SelfDiscoveryQuests";
import { CoreDiscoveries } from "@/components/becoming/CoreDiscoveries";
import { DailyJournal } from "@/components/becoming/DailyJournal";
import { ActualSelfSummaryCard } from "@/components/becoming/ActualSelfSummaryCard";
import { LifeDomainsRadar } from "@/components/LifeDomainsRadar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Sparkles } from "lucide-react";

export const BecomingPath = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Becoming Path
                <Sparkles className="w-5 h-5 text-violet-500" />
              </CardTitle>
              <CardDescription>
                Discover who you are becoming through reflection and self-understanding
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

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
