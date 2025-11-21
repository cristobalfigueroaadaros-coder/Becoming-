import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Sunrise, Target, BookOpen, Star } from "lucide-react";
import { FutureSelfWidget } from "@/components/FutureSelfWidget";
import { LifeDomainsRadar } from "@/components/LifeDomainsRadar";
import { GoalHierarchy } from "@/components/GoalHierarchy";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import { SelfDiscoveryQuest } from "@/components/SelfDiscoveryQuest";

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
    <div className="min-h-screen bg-gradient-to-br from-mentor-future/5 via-background to-accent/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-mentor-future" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-mentor-future to-accent bg-clip-text text-transparent">
              Future Self
            </h1>
          </div>
          <div className="w-24" /> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-mentor-future via-primary to-accent bg-clip-text text-transparent">
            Your Sacred Space for Evolution
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This is where you connect with who you're becoming. Track your growth, 
            set intentions, and discover the patterns that shape your journey.
          </p>
        </div>

        {/* Daily Ritual Section */}
        <Card className="border-mentor-future/20 bg-gradient-to-br from-mentor-future/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sunrise className="w-6 h-6 text-mentor-future" />
              Daily Ritual Hub
            </CardTitle>
            <CardDescription>
              Start each day with intention, meditation, and visualization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasCompletedRitualToday ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-lg font-medium">Ritual Complete ✨</p>
                <p className="text-sm text-muted-foreground">You've set your intention for today</p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <p className="text-muted-foreground">
                  Take a moment to ground yourself, visualize your future, and set today's intention
                </p>
                <Button
                  size="lg"
                  onClick={() => setRitualModalOpen(true)}
                  className="bg-gradient-to-r from-mentor-future to-accent hover:opacity-90"
                >
                  <Sunrise className="w-5 h-5 mr-2" />
                  Begin Morning Ritual
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress & Domains Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <FutureSelfWidget />
          <LifeDomainsRadar />
        </div>

        {/* Goal Structure Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-mentor-future" />
            <h3 className="text-2xl font-bold">Your Goals & Milestones</h3>
          </div>
          <GoalHierarchy />
        </div>

        {/* Constellation System - Placeholder */}
        <Card className="border-dashed border-2 border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Star className="w-6 h-6 text-accent" />
              Constellation System
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Coming Soon</span>
            </CardTitle>
            <CardDescription>
              Connect the dots of your journey - books, ideas, insights, and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              This space will help you map the constellation of experiences that shape your evolution. 
              Track books you've read, ideas you've captured, and moments of insight - then watch as 
              patterns emerge to reveal your unique path.
            </p>
          </CardContent>
        </Card>

        {/* Self-Discovery Quest Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold">Self-Discovery Quests</h3>
          </div>
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
