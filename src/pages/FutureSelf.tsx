import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import FutureSelfBackground from "@/components/FutureSelfBackground";
import FutureSelfDashboardCard from "@/components/FutureSelfDashboardCard";
import LifeDomainsCard from "@/components/dashboard-cards/LifeDomainsCard";
import DailyRitualCard from "@/components/dashboard-cards/DailyRitualCard";
import ActualSelfCard from "@/components/dashboard-cards/ActualSelfCard";
import FutureSelfCard from "@/components/dashboard-cards/FutureSelfCard";
import ConstellationCard from "@/components/dashboard-cards/ConstellationCard";
import GoalStructureCard from "@/components/dashboard-cards/GoalStructureCard";
import QuestsCard from "@/components/dashboard-cards/QuestsCard";
import PlaceholderCard from "@/components/dashboard-cards/PlaceholderCard";
import ChallengeHistoryCard from "@/components/dashboard-cards/ChallengeHistoryCard";

const FutureSelf = () => {
  const navigate = useNavigate();
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [hasCompletedRitualToday, setHasCompletedRitualToday] = useState(false);

  useEffect(() => {
    checkRitualStatus();
  }, []);

  const checkRitualStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: rituals } = await supabase
        .from("daily_rituals")
        .select("completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", today.toISOString())
        .limit(1);

      setHasCompletedRitualToday(rituals && rituals.length > 0);
    } catch (error) {
      console.error("Error checking ritual status:", error);
    }
  };

  return (
    <motion.div 
      className="min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FutureSelfBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 py-12 space-y-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-center bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Future Self Evolution
        </h1>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Life Domains */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <FutureSelfDashboardCard 
              title="Life Domains"
              onClick={() => navigate("/future-self/life-domains")}
            >
              <LifeDomainsCard />
            </FutureSelfDashboardCard>
          </motion.div>

          {/* Daily Ritual Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <FutureSelfDashboardCard 
              title="Daily Ritual Stack"
              onClick={() => setRitualModalOpen(true)}
            >
              <DailyRitualCard />
            </FutureSelfDashboardCard>
          </motion.div>

          {/* Future Self */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <FutureSelfDashboardCard 
              title="Future Self"
              onClick={() => navigate("/future-self/detail")}
            >
              <FutureSelfCard />
            </FutureSelfDashboardCard>
          </motion.div>

          {/* Actual Self */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <FutureSelfDashboardCard 
              title="Actual Self"
              onClick={() => navigate("/future-self/actual-self")}
            >
              <ActualSelfCard />
            </FutureSelfDashboardCard>
          </motion.div>

          {/* Mapping & Idea Dots */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <FutureSelfDashboardCard 
              title="Mapping & Idea Dots"
              onClick={() => navigate("/future-self/constellation")}
            >
              <ConstellationCard />
            </FutureSelfDashboardCard>
          </motion.div>

          {/* Goal Structure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <FutureSelfDashboardCard 
              title="Goal Structure"
              onClick={() => navigate("/future-self/goals")}
            >
              <GoalStructureCard />
            </FutureSelfDashboardCard>
          </motion.div>

          {/* Self-Discovery Quests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <FutureSelfDashboardCard 
              title="Self-Discovery Quests"
              onClick={() => navigate("/future-self/quests")}
            >
              <QuestsCard showNotification={true} />
            </FutureSelfDashboardCard>
          </motion.div>

          {/* Challenge History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <FutureSelfDashboardCard 
              title="Challenge History"
              onClick={() => navigate("/challenge-history")}
            >
              <ChallengeHistoryCard />
            </FutureSelfDashboardCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <FutureSelfDashboardCard title="Coming Soon">
              <PlaceholderCard />
            </FutureSelfDashboardCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Daily Ritual Modal */}
      <DailyRitualModal
        open={ritualModalOpen}
        onClose={() => setRitualModalOpen(false)}
        onComplete={() => {
          checkRitualStatus();
          setRitualModalOpen(false);
        }}
      />
    </motion.div>
  );
};

export default FutureSelf;
