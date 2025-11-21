import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lightbulb, Zap, Trees, Heart, Sparkles, Users, BookOpen, Crown, LogOut, CheckSquare, Briefcase, Palette, Compass, Target, Flag, Ghost, Sunrise, Flame } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FutureSelfWidget } from "@/components/FutureSelfWidget";
import { LifeDomainsRadar } from "@/components/LifeDomainsRadar";
import { DailyRitualModal } from "@/components/DailyRitualModal";

const mentorIcons = {
  mamba_mentor: Brain,
  creative_visionary: Lightbulb,
  quantum_inventor: Zap,
  ancient_sage: Trees,
  compassionate_elder: Heart,
  future_self: Sparkles,
  business_mentor: Briefcase,
  creator_mentor: Palette,
  mystic_mentor: Compass,
  heart_mentor: Heart,
  strategist_mentor: Target,
  explorer_mentor: Flag,
};

const mentorColors = {
  mamba_mentor: "bg-mentor-mamba",
  creative_visionary: "bg-mentor-creative",
  quantum_inventor: "bg-mentor-quantum",
  ancient_sage: "bg-mentor-sage",
  compassionate_elder: "bg-mentor-elder",
  future_self: "bg-mentor-future",
  business_mentor: "bg-primary",
  creator_mentor: "bg-accent",
  mystic_mentor: "bg-secondary",
  heart_mentor: "bg-mentor-elder",
  strategist_mentor: "bg-mentor-quantum",
  explorer_mentor: "bg-mentor-sage",
};

const mentorNames = {
  mamba_mentor: "Mamba Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  compassionate_elder: "Compassionate Elder",
  future_self: "Future Self",
  business_mentor: "Business Mentor",
  creator_mentor: "Creator Mentor",
  mystic_mentor: "Mystic Mentor",
  heart_mentor: "Heart Mentor",
  strategist_mentor: "Strategist Mentor",
  explorer_mentor: "Explorer Mentor",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<any[]>([]);
  const [latestWhisper, setLatestWhisper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [hasCompletedRitualToday, setHasCompletedRitualToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayGoal, setTodayGoal] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    checkRitualStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load user's mentors
      const { data: mentorsData, error: mentorsError } = await supabase
        .from("user_mentors")
        .select("*")
        .eq("user_id", user.id);

      if (mentorsError) throw mentorsError;
      setMentors(mentorsData || []);

      // Load latest whisper
      const { data: whisperData, error: whisperError } = await supabase
        .from("daily_whispers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (whisperError && whisperError.code !== "PGRST116") throw whisperError;
      setLatestWhisper(whisperData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleFaceShadow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Random shadow type
      const shadowTypes = ['fear', 'shame', 'impostor', 'procrastination', 'perfectionism', 'anger', 'control', 'isolation'];
      const randomShadow = shadowTypes[Math.floor(Math.random() * shadowTypes.length)];

      const { error } = await supabase.functions.invoke('trigger-shadow', {
        body: { 
          shadowType: randomShadow, 
          triggeredBy: 'manual',
          context: { source: 'face_shadow_button' }
        }
      });

      if (error) throw error;
      toast.success("A shadow has emerged...", { description: "Check the encounter modal" });
    } catch (error: any) {
      if (error.message?.includes("Active encounter already exists")) {
        toast.info("You already have an active shadow encounter");
      } else {
        toast.error(error.message);
      }
    }
  };

  const checkRitualStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if ritual completed today
      const { data: rituals } = await supabase
        .from("daily_rituals")
        .select("completed_at, streak_count")
        .eq("user_id", user.id)
        .gte("completed_at", today.toISOString())
        .order("completed_at", { ascending: false })
        .limit(1);

      if (rituals && rituals.length > 0) {
        setHasCompletedRitualToday(true);
        setCurrentStreak(rituals[0].streak_count);
      } else {
        setHasCompletedRitualToday(false);
        // Calculate streak from last ritual
        const { data: lastRitual } = await supabase
          .from("daily_rituals")
          .select("completed_at, streak_count")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(1);

        if (lastRitual && lastRitual.length > 0) {
          const lastDate = new Date(lastRitual[0].completed_at);
          const diffTime = Math.abs(today.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            setCurrentStreak(lastRitual[0].streak_count);
          } else {
            setCurrentStreak(0);
          }
        }
      }

      // Load today's goal
      const { data: goals } = await supabase
        .from("daily_goals")
        .select("goal_text, completed")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (goals && goals.length > 0) {
        setTodayGoal(goals[0].goal_text);
      }
    } catch (error: any) {
      console.error("Error checking ritual status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your council...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Your Transformation Journey</h1>
            <p className="text-muted-foreground mt-2">Guided by your mentors and Future Self</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Future Self Section - Central Feature */}
        <div className="grid lg:grid-cols-2 gap-6">
          <FutureSelfWidget />
          <LifeDomainsRadar />
        </div>

        {/* Daily Ritual Status */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sunrise className="w-5 h-5 text-primary" />
              Morning Ritual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasCompletedRitualToday ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Ritual Complete ✨</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-500">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-bold">{currentStreak} day streak</span>
                  </div>
                </div>
                {todayGoal && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Today's Intention:</p>
                    <p className="text-sm font-medium">{todayGoal}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Start your day with intention. Complete your morning ritual to set yourself up for success.
                </p>
                <Button 
                  onClick={() => setRitualModalOpen(true)}
                  className="w-full"
                >
                  <Sunrise className="w-4 h-4 mr-2" />
                  Begin Morning Ritual
                </Button>
                {currentStreak > 0 && (
                  <div className="flex items-center gap-2 text-orange-500 justify-center">
                    <Flame className="w-4 h-4" />
                    <span className="text-xs">Keep your {currentStreak}-day streak alive!</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons Row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Council Meeting */}
          <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="w-12 h-12 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold">Ask the Council</h2>
                <p className="opacity-90 text-sm">Get wisdom from all mentors</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate("/council-meeting")}
              >
                Start
              </Button>
            </CardContent>
          </Card>

          {/* Face a Shadow */}
          <Card className="bg-gradient-to-r from-destructive/90 to-destructive text-destructive-foreground shadow-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <Ghost className="w-12 h-12 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold">Face a Shadow</h2>
                <p className="opacity-90 text-sm">Confront what holds you back</p>
              </div>
              <Button
                variant="secondary"
                onClick={handleFaceShadow}
              >
                Begin
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Mentors Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your AI Mentors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mentors.map((mentor) => {
              const Icon = mentorIcons[mentor.mentor_type as keyof typeof mentorIcons];
              const color = mentorColors[mentor.mentor_type as keyof typeof mentorColors];
              const name = mentorNames[mentor.mentor_type as keyof typeof mentorNames];

              return (
                <Card
                  key={mentor.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => navigate(`/chat/${mentor.mentor_type}`)}
                >
                  <CardContent className="pt-6 text-center space-y-3">
                    <div className={cn("w-14 h-14 mx-auto rounded-2xl flex items-center justify-center", color)}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-medium text-sm">{name}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Daily Whisper */}
        {latestWhisper && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Daily Whisper
              </CardTitle>
              <CardDescription>
                From {mentorNames[latestWhisper.mentor_type as keyof typeof mentorNames]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg italic">{latestWhisper.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate("/my-tasks")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">My Tasks</h3>
                <p className="text-sm text-muted-foreground">Track your progress</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate("/council-log")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Council Log</h3>
                <p className="text-sm text-muted-foreground">View your history</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate("/premium")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Unlock Premium</h3>
                <p className="text-sm text-muted-foreground">Get unlimited access</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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

export default Dashboard;
