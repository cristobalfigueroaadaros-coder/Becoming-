import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMomentumData } from "@/hooks/useMomentumData";
import { SprintReviewTab } from "@/components/momentum/SprintReviewTab";
import { CompoundGrowthTab } from "@/components/momentum/CompoundGrowthTab";
import { CapabilityMapTab } from "@/components/momentum/CapabilityMapTab";
import { WeeklyRitualFlow } from "@/components/momentum/WeeklyRitualFlow";

const MomentumDashboard = () => {
  const navigate = useNavigate();
  const { weeklyData, pastReports, capabilities, loading, refetch } = useMomentumData();
  const [ritualOpen, setRitualOpen] = useState(false);

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

        <div>
          <h1 className="text-2xl font-bold">Momentum</h1>
          <p className="text-sm text-muted-foreground">Your weekly execution intelligence.</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sprint" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="sprint" className="flex-1">Sprint Review</TabsTrigger>
            <TabsTrigger value="growth" className="flex-1">Growth</TabsTrigger>
            <TabsTrigger value="capabilities" className="flex-1">Capabilities</TabsTrigger>
          </TabsList>

          <TabsContent value="sprint">
            {weeklyData && <SprintReviewTab data={weeklyData} />}
          </TabsContent>
          <TabsContent value="growth">
            <CompoundGrowthTab pastReports={pastReports} currentStreak={currentStreak} />
          </TabsContent>
          <TabsContent value="capabilities">
            <CapabilityMapTab capabilities={capabilities} />
          </TabsContent>
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
