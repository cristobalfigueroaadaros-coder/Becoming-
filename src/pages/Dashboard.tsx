import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import { MentorWhisperNotification } from "@/components/MentorWhisperNotification";
import { useMentorWhisper } from "@/hooks/useMentorWhisper";
import { useMentorOutreach } from "@/hooks/useMentorOutreach";

// Dashboard components
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FutureSelfSpaceCard from "@/components/dashboard/FutureSelfSpaceCard";
import NarrativeSystemCard from "@/components/dashboard/NarrativeSystemCard";
import TodaysFocusCard from "@/components/dashboard/TodaysFocusCard";
import DailyRitualCard from "@/components/dashboard/DailyRitualCard";
import ComingSoonSection from "@/components/dashboard/ComingSoonSection";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [hasCompletedRitualToday, setHasCompletedRitualToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayGoal, setTodayGoal] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [showWhisperNotification, setShowWhisperNotification] = useState(false);
  const [hasQuestPending, setHasQuestPending] = useState(false);

  const {
    unreadWhisper,
    checkAndGenerateWhisper,
    markAsRead,
    latestWhisper,
  } = useMentorWhisper();

  const { generateOutreach } = useMentorOutreach();

  useEffect(() => {
    loadDashboardData();
    checkRitualStatus();
    checkFirstTimeUser();
    checkReengagementNotifications();

    const whisperTimer = setTimeout(() => {
      checkAndGenerateWhisper();
    }, 2000);

    const outreachTimer = setTimeout(() => {
      generateOutreach().catch(() => {});
    }, 3000);

    return () => {
      clearTimeout(whisperTimer);
      clearTimeout(outreachTimer);
    };
  }, []);

  // Check for re-engagement notifications when user returns
  const checkReengagementNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for unread re-engagement notifications
      const { data: reengagementNotifications } = await supabase
        .from("council_notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("notification_type", "reengagement")
        .is("read_at", null)
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (reengagementNotifications && reengagementNotifications.length > 0) {
        const notification = reengagementNotifications[0];
        toast.info(notification.title, {
          description: notification.message,
          duration: 8000,
          action: {
            label: "Let's talk",
            onClick: () => navigate("/chat/future_self"),
          },
        });

        // Mark as read
        await supabase
          .from("council_notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", notification.id);
      }
    } catch (error) {
      console.error("Error checking re-engagement notifications:", error);
    }
  };

  const checkFirstTimeUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "council_introduction_completed, display_name, council_unlocked, self_discovery_completed, first_project_created_at, gravity_transition_completed",
        )
        .eq("id", user.id)
        .single();

      // Check if user has completed the Gravity flow (has first project)
      if (profile && !profile.first_project_created_at) {
        // Self-heal: Check if a project actually exists (flag might have failed to save)
        const { data: existingProjects } = await supabase
          .from("integrator_projects")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);
        
        if (existingProjects && existingProjects.length > 0) {
          // Project exists but flag is missing - backfill it
          await supabase
            .from("profiles")
            .update({
              first_project_created_at: existingProjects[0].created_at,
              first_project_id: existingProjects[0].id
            })
            .eq("id", user.id);
          // Continue to dashboard normally (don't redirect)
        } else {
          // No project exists - redirect to appropriate Gravity step
          if (!profile.gravity_transition_completed) {
            navigate("/gravity/transition");
          } else if (!profile.council_introduction_completed) {
            navigate("/gravity/council-intro");
          } else {
            navigate("/gravity/first-project");
          }
          return;
        }
      }

      if (profile) {
        setDisplayName(profile.display_name || undefined);

        const selfDiscoveryCompleted = profile.self_discovery_completed === true;
        setHasQuestPending(!selfDiscoveryCompleted);
      }
    } catch (error: any) {
      console.error("Error checking first-time user status:", error);
    }
  };

  useEffect(() => {
    if (unreadWhisper && !showWhisperNotification) {
      setShowWhisperNotification(true);
    }
  }, [unreadWhisper]);

  const loadDashboardData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkRitualStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <DashboardHeader displayName={displayName} />

        {/* Future Self Space */}
        <FutureSelfSpaceCard hasQuestPending={hasQuestPending} />

        {/* Narrative System - Connection between values and actions */}
        <NarrativeSystemCard />

        {/* Today's Focus - PRIMARY ANCHOR */}
        <TodaysFocusCard />

        {/* Daily Ritual */}
        <DailyRitualCard 
          hasCompletedToday={hasCompletedRitualToday}
          currentStreak={currentStreak}
          todayGoal={todayGoal}
          onStartRitual={() => setRitualModalOpen(true)}
        />

        {/* Coming Soon */}
        <ComingSoonSection />
      </div>

      {/* Modals */}
      <DailyRitualModal 
        open={ritualModalOpen} 
        onClose={() => setRitualModalOpen(false)}
        onComplete={() => {
          setHasCompletedRitualToday(true);
          setCurrentStreak(prev => prev + 1);
          setRitualModalOpen(false);
        }}
      />
      {/* Whisper Notification */}
      {showWhisperNotification && latestWhisper && (
        <MentorWhisperNotification
          whisper={latestWhisper}
          onDismiss={() => {
            markAsRead(latestWhisper.id);
            setShowWhisperNotification(false);
          }}
          onReply={() => {
            markAsRead(latestWhisper.id);
            setShowWhisperNotification(false);
            navigate(`/chat/${latestWhisper.mentor_type}`);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
