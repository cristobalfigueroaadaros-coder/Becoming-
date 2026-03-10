import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket } from "lucide-react";
import { MicroGuide } from "@/components/MicroGuide";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMomentumData } from "@/hooks/useMomentumData";
import { SprintReviewTab } from "@/components/momentum/SprintReviewTab";
import { CompoundGrowthTab } from "@/components/momentum/CompoundGrowthTab";
import { CapabilityMapTab } from "@/components/momentum/CapabilityMapTab";
import { WeeklyRitualFlow } from "@/components/momentum/WeeklyRitualFlow";

const MomentumDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { tab?: string; fromStarterQuest?: boolean } | null;
  const defaultTab = locationState?.tab || "sprint";
  const fromStarterQuest = locationState?.fromStarterQuest || false;
  const { weeklyData, pastReports, capabilities, capabilityMapUnlocked, systemInsight, insightLoading, loading, refetch } = useMomentumData();
  const [ritualOpen, setRitualOpen] = useState(false);
  const forceCapabilities = defaultTab === "capabilities";

  const currentStreak = pastReports.length > 0 ? pastReports[0].streak_weeks : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading momentum...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Home
          </button>
          <Button size="sm" onClick={() => setRitualOpen(true)} className="gap-2">
            <Rocket className="h-4 w-4" /> Weekly Ritual
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold">Momentum</h1>
            <p className="text-sm text-muted-foreground">Your weekly execution intelligence.</p>
          </div>
          <MicroGuide
            guideKey="momentum"
            title="Momentum"
            description={"This is where you review your progress.\n\nEvery week you reflect on what worked, what you learned, and what can be improved or changed.\n\nYou review this together with your Console."}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sprint" className="w-full">
          <TabsList className={capabilityMapUnlocked ? "w-full" : "w-full"}>
            <TabsTrigger value="sprint" className="flex-1">Sprint Review</TabsTrigger>
            <TabsTrigger value="growth" className="flex-1">Growth</TabsTrigger>
            {capabilityMapUnlocked && (
              <TabsTrigger value="capabilities" className="flex-1">Capabilities</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="sprint">
            {weeklyData && (
              <SprintReviewTab
                data={weeklyData}
                systemInsight={systemInsight}
                insightLoading={insightLoading}
                onStartRitual={() => setRitualOpen(true)}
              />
            )}
          </TabsContent>
          <TabsContent value="growth">
            <CompoundGrowthTab pastReports={pastReports} currentStreak={currentStreak} capabilities={capabilities} />
          </TabsContent>
          {capabilityMapUnlocked && (
            <TabsContent value="capabilities">
              <CapabilityMapTab capabilities={capabilities} onCapabilitiesChanged={refetch} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Weekly Ritual Modal */}
      {weeklyData && (
        <WeeklyRitualFlow
          open={ritualOpen}
          onClose={() => setRitualOpen(false)}
          onComplete={() => {
            setRitualOpen(false);
            refetch();
          }}
          weeklyData={weeklyData}
        />
      )}
    </div>
  );
};

export default MomentumDashboard;
