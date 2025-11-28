import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Zap, Trees, Sparkles, Users, BookOpen, Crown, LogOut, CheckSquare, Briefcase, Compass, Target, Flag, Ghost, Sunrise, Flame, User, Network, Clock, Telescope, TrendingUp, Megaphone, FlaskConical, Scale, Moon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FutureSelfWidget } from "@/components/FutureSelfWidget";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import { GoalHierarchy } from "@/components/GoalHierarchy";
import { ProfileBadges } from "@/components/ProfileBadges";
import { useProfileBadges } from "@/hooks/useProfileBadges";
import { PurposeOnboardingModal } from "@/components/PurposeOnboardingModal";
import { CurrentChallengeCard } from "@/components/CurrentChallengeCard";
import { TodaysChallengeWidget } from "@/components/TodaysChallengeWidget";
import { ConstellationRecommendations } from "@/components/ConstellationRecommendations";
import { FutureSelfTriggerButton } from "@/components/FutureSelfTriggerButton";
import { MentorWhisperNotification } from "@/components/MentorWhisperNotification";
import { useMentorWhisper } from "@/hooks/useMentorWhisper";
import { History, Rocket } from "lucide-react";

const mentorIcons = {
  discipline_mentor: Target,
  creative_visionary: Lightbulb,
  quantum_inventor: Zap,
  ancient_sage: Trees,
  future_self: Sparkles,
  business_mentor: Briefcase,
  mystic_mentor: Compass,
  strategist_mentor: TrendingUp,
  marketing_mentor: Megaphone,
  scientific_mentor: FlaskConical,
  alignment_mentor: Scale,
  oracle_mother: Moon,
  heart_mentor: Sparkles,
};

const mentorColors = {
  discipline_mentor: "bg-primary",
  creative_visionary: "bg-mentor-creative",
  quantum_inventor: "bg-mentor-quantum",
  ancient_sage: "bg-mentor-sage",
  future_self: "bg-mentor-future",
  business_mentor: "bg-primary",
  mystic_mentor: "bg-secondary",
  strategist_mentor: "bg-mentor-quantum",
  marketing_mentor: "bg-accent",
  scientific_mentor: "bg-mentor-quantum",
  alignment_mentor: "bg-secondary",
  oracle_mother: "bg-mentor-elder",
  heart_mentor: "bg-rose-600",
};

const mentorNames = {
  discipline_mentor: "Discipline Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  future_self: "Future Self",
  business_mentor: "Business Mentor",
  mystic_mentor: "Mystic Mentor",
  strategist_mentor: "Strategist Mentor",
  marketing_mentor: "Marketing Mentor",
  scientific_mentor: "Scientific Mentor",
  alignment_mentor: "Alignment Mentor",
  oracle_mother: "Oracle Mother",
  heart_mentor: "Heart Mentor",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [hasCompletedRitualToday, setHasCompletedRitualToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayGoal, setTodayGoal] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { getUserBadgesWithDetails, loading: badgesLoading } = useProfileBadges(currentUserId || undefined);
  const userBadges = getUserBadgesWithDetails();
  const [purposeModalOpen, setPurposeModalOpen] = useState(false);
  const [userPurpose, setUserPurpose] = useState<string | null>(null);
  const [constellationInsights, setConstellationInsights] = useState<any>(null);
  const [showWhisperNotification, setShowWhisperNotification] = useState(false);
  
  const { 
    unreadWhisper, 
    checkAndGenerateWhisper, 
    markAsRead,
    latestWhisper 
  } = useMentorWhisper();

  useEffect(() => {
    loadDashboardData();
    checkRitualStatus();
    checkPurposeStatus();
    loadConstellationInsights();
    // Check for whisper after a short delay
    const whisperTimer = setTimeout(() => {
      checkAndGenerateWhisper();
    }, 2000);
    return () => clearTimeout(whisperTimer);
  }, []);

  // Show notification when unread whisper arrives
  useEffect(() => {
    if (unreadWhisper && !showWhisperNotification) {
      setShowWhisperNotification(true);
    }
  }, [unreadWhisper]);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setCurrentUserId(user.id);

      // Load user's mentors
      const { data: mentorsData, error: mentorsError } = await supabase
        .from("user_mentors")
        .select("*")
        .eq("user_id", user.id);

      if (mentorsError) throw mentorsError;
      setMentors(mentorsData || []);
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

  const checkPurposeStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("main_mission")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserPurpose(profile.main_mission);
        // Show modal if no purpose is set
        if (!profile.main_mission) {
          setPurposeModalOpen(true);
        }
      }
    } catch (error: any) {
      console.error("Error checking purpose status:", error);
    }
  };

  const loadConstellationInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("constellation_insights")
        .eq("id", user.id)
        .single();

      if (profile?.constellation_insights) {
        setConstellationInsights(profile.constellation_insights);
      }
    } catch (error: any) {
      console.error("Error loading constellation insights:", error);
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
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Your Transformation Journey</h1>
            <p className="text-muted-foreground">Guided by your mentors and Future Self</p>
            {!badgesLoading && userBadges && userBadges.length > 0 && (
              <ProfileBadges badges={userBadges as any} maxDisplay={4} size="small" />
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/profile")}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <FutureSelfTriggerButton context="dashboard" variant="outline" />
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Future Self - Primary Navigation Card */}
        <Card 
          className="cursor-pointer hover:shadow-2xl transition-all bg-gradient-to-br from-mentor-future/10 via-accent/5 to-transparent border-mentor-future/30 hover:scale-[1.02]"
          onClick={() => navigate("/future-self")}
        >
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mentor-future to-accent flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Enter Future Self Space</h2>
                    <p className="text-muted-foreground">Your sacred space for evolution and growth</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Daily Ritual</div>
                    <div className="text-sm font-medium">Visualization & Intention</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Life Domains</div>
                    <div className="text-sm font-medium">Track Your Progress</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Goal Structure</div>
                    <div className="text-sm font-medium">Weekly to 10-Year Vision</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Self-Discovery</div>
                    <div className="text-sm font-medium">Coming Soon</div>
                  </div>
                </div>
              </div>
              <Button size="lg" className="bg-gradient-to-r from-mentor-future to-accent">
                Explore →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Overview */}
        <div className="max-w-2xl">
          <FutureSelfWidget />
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
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(var(--primary), 0)",
                      "0 0 0 8px rgba(var(--primary), 0.1)",
                      "0 0 0 0 rgba(var(--primary), 0)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Button 
                    onClick={() => setRitualModalOpen(true)}
                    className="w-full"
                  >
                    <Sunrise className="w-4 h-4 mr-2" />
                    Begin Morning Ritual
                  </Button>
                </motion.div>
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

        {/* Challenge System */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Daily Challenges</h2>
            <Button
              variant="outline"
              onClick={() => navigate("/challenge-history")}
            >
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <CurrentChallengeCard />
            <TodaysChallengeWidget />
          </div>
        </div>

        {/* Constellation Insights */}
        {constellationInsights && (
          <ConstellationRecommendations
            summary={constellationInsights.summary}
            recommendations={constellationInsights.challenge_suggestions}
            onActionClick={(rec) => {
              toast.info(`Opening: ${rec.title}`);
              navigate("/constellation");
            }}
            compact={false}
          />
        )}

        {/* Action Buttons Row */}
        <div className="grid md:grid-cols-4 gap-4">
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

          {/* Energetic Dashboard */}
          <Card className="bg-gradient-to-r from-accent to-secondary text-primary-foreground shadow-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <Zap className="w-12 h-12 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <h2 className="text-xl font-bold">Energy Field</h2>
                <p className="opacity-90 text-sm">Track your vibrational state</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate("/energetic-dashboard")}
              >
                View
              </Button>
            </CardContent>
          </Card>

          {/* Optimal Timing */}
          <Card className="bg-gradient-to-r from-secondary to-primary text-primary-foreground shadow-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="w-12 h-12 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold">Optimal Timing</h2>
                <p className="opacity-90 text-sm">When to take action</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate("/optimal-timing")}
              >
                View
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

        {/* Daily Whisper - Compact */}
        {latestWhisper && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {mentorNames[latestWhisper.mentor_type as keyof typeof mentorNames]}
                  </p>
                  <p className="text-sm italic line-clamp-2">{latestWhisper.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow"
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
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => navigate("/community-hub")}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Community Hub</h3>
                  <p className="text-sm text-muted-foreground">Achievements & rankings</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => navigate("/council-log")}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Council Log</h3>
                  <p className="text-sm text-muted-foreground">Past wisdom</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow border-2 border-primary/30"
              onClick={() => navigate("/future-self/constellation")}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-500 rounded-xl flex items-center justify-center">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Mapping Ideas & Dots</h3>
                  <p className="text-sm text-muted-foreground">Connect your journey</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-primary/10 to-accent/10"
              onClick={() => navigate("/premium")}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Unlock Premium</h3>
                  <p className="text-sm text-muted-foreground">Enhanced features</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5"
              onClick={() => navigate("/dot-connection-engine")}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent via-primary to-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Dot Connection Engine</h3>
                  <p className="text-sm text-muted-foreground">Reveal your genius</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-purple-500/10"
              onClick={() => navigate("/purpose-evolution-engine")}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary via-purple-500 to-accent rounded-xl flex items-center justify-center">
                  <Telescope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Purpose Evolution</h3>
                  <p className="text-sm text-muted-foreground">Refine from your journey</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card
              className="cursor-pointer hover:shadow-xl transition-shadow border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5"
              onClick={() => navigate("/creation-lab")}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Creation Lab</h3>
                  <p className="text-sm text-muted-foreground">Build from insights</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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

      <PurposeOnboardingModal
        open={purposeModalOpen}
        onClose={() => {
          setPurposeModalOpen(false);
          checkPurposeStatus();
        }}
        existingPurpose={userPurpose}
      />

      {/* Whisper Notification */}
      {showWhisperNotification && unreadWhisper && (
        <MentorWhisperNotification
          whisper={unreadWhisper}
          onDismiss={() => {
            setShowWhisperNotification(false);
            markAsRead(unreadWhisper.id);
          }}
          onReply={() => {
            setShowWhisperNotification(false);
            markAsRead(unreadWhisper.id);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
