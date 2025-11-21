import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import { SelfDiscoveryQuest } from "@/components/SelfDiscoveryQuest";
import { ConstellationSystem } from "@/components/ConstellationSystem";
import { LifeDomainsRadar } from "@/components/LifeDomainsRadar";
import { GoalHierarchy } from "@/components/GoalHierarchy";
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

const FutureSelf = () => {
  const navigate = useNavigate();
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [hasCompletedRitualToday, setHasCompletedRitualToday] = useState(false);
  
  const lifeDomainsRef = useRef<HTMLDivElement>(null);
  const goalsRef = useRef<HTMLDivElement>(null);
  const constellationRef = useRef<HTMLDivElement>(null);
  const questsRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    <div className="min-h-screen relative">
      <FutureSelfBackground />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-lg border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-center text-foreground">
          Future Self Evolution
        </h1>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Life Domains */}
          <FutureSelfDashboardCard 
            title="Life Domains"
            onClick={() => scrollToSection(lifeDomainsRef)}
          >
            <LifeDomainsCard />
          </FutureSelfDashboardCard>

          {/* Daily Ritual Stack */}
          <FutureSelfDashboardCard 
            title="Daily Ritual Stack"
            onClick={() => setRitualModalOpen(true)}
          >
            <DailyRitualCard />
          </FutureSelfDashboardCard>

          {/* Future Self */}
          <FutureSelfDashboardCard title="Future Self">
            <FutureSelfCard />
          </FutureSelfDashboardCard>

          {/* Actual Self */}
          <FutureSelfDashboardCard title="Actual Self">
            <ActualSelfCard />
          </FutureSelfDashboardCard>

          {/* Mapping & Idea Dots */}
          <FutureSelfDashboardCard 
            title="Mapping & Idea Dots"
            onClick={() => scrollToSection(constellationRef)}
          >
            <ConstellationCard />
          </FutureSelfDashboardCard>

          {/* Goal Structure */}
          <FutureSelfDashboardCard 
            title="Goal Structure"
            onClick={() => scrollToSection(goalsRef)}
          >
            <GoalStructureCard />
          </FutureSelfDashboardCard>

          {/* Self-Discovery Quests */}
          <FutureSelfDashboardCard 
            title="Self-Discovery Quests"
            onClick={() => scrollToSection(questsRef)}
          >
            <QuestsCard />
          </FutureSelfDashboardCard>

          {/* Placeholder Cards */}
          <FutureSelfDashboardCard title="Coming Soon">
            <PlaceholderCard />
          </FutureSelfDashboardCard>

          <FutureSelfDashboardCard title="Coming Soon">
            <PlaceholderCard />
          </FutureSelfDashboardCard>
        </div>
      </div>

      {/* Detailed Sections Below */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Life Domains Detailed */}
        <div ref={lifeDomainsRef} className="scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Life Domains Radar</h2>
          <LifeDomainsRadar />
        </div>

        {/* Goal Structure Detailed */}
        <div ref={goalsRef} className="scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Your Goals & Milestones</h2>
          <GoalHierarchy />
        </div>

        {/* Constellation System Detailed */}
        <div ref={constellationRef} className="scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Constellation System</h2>
          <ConstellationSystem />
        </div>

        {/* Self-Discovery Quests Detailed */}
        <div ref={questsRef} className="scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Self-Discovery Quests</h2>
          <SelfDiscoveryQuest />
        </div>
      </div>

      {/* Daily Ritual Modal */}
      <DailyRitualModal
        open={ritualModalOpen}
        onClose={() => setRitualModalOpen(false)}
        onComplete={() => {
          checkRitualStatus();
          setRitualModalOpen(false);
        }}
      />
    </div>
  );
};

export default FutureSelf;
