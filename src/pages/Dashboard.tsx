import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import { useMentorOutreach } from "@/hooks/useMentorOutreach";
import { VoiceOfSystemModal } from "@/components/voice/VoiceOfSystemModal";
import IntakeNotification from "@/components/console-thread/IntakeNotification";
import AtlasProgressCard from "@/components/dashboard/AtlasProgressCard";

// Dashboard components
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FutureSelfSpaceCard from "@/components/dashboard/FutureSelfSpaceCard";
import MomentumCard from "@/components/dashboard/MomentumCard";
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
  
  const [hasQuestPending, setHasQuestPending] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showIntakeNotification, setShowIntakeNotification] = useState(false);




  const { generateOutreach } = useMentorOutreach();

  useEffect(() => {
    loadDashboardData();
    checkRitualStatus();
    checkFirstTimeUser();
    checkReengagementNotifications();
    checkAtlasGuidance();


    const outreachTimer = setTimeout(() => {
      generateOutreach().catch(() => {});
    }, 3000);

    return () => {


    };
  }, []);

  // Guide users to Cris's Atlas first if they haven't built enough discovery yet.
  // Threshold mirrors useProgressiveUnlock (chat unlock thresholds by entry state).
  const checkAtlasGuidance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("entry_state, atlas_guidance_dismissed" as any)
        .eq("id", user.id)
        .maybeSingle();

      const p = profile as any;
      // Once user dismisses or progresses past threshold, never redirect again
      if (p?.atlas_guidance_dismissed) return;

      const entryState: string = p?.entry_state || "DISCOVER";
      const COUNCIL_THRESHOLDS: Record<string, number> = { DISCOVER: 4, GROW: 3, BUILD: 2 };
      const threshold = COUNCIL_THRESHOLDS[entryState] ?? 4;

      const { count: completedQuestCount } = await supabase
        .from("atlas_quests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      const completed = completedQuestCount || 0;

      if (completed < threshold) {
        const timer = window.setTimeout(() => {
          navigate("/atlas");
        }, 5000);
        return () => window.clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error checking Atlas guidance:", error);
    }
  };

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
          "council_introduction_completed, display_name, birth_name, council_unlocked, self_discovery_completed, first_project_created_at, gravity_transition_completed",
        )
        .eq("id", user.id)
        .single();

      // Self-heal: backfill first_project flag if project exists but flag is missing
      if (profile && !profile.first_project_created_at) {
        const { data: existingProjects } = await supabase
          .from("integrator_projects")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);
        
        if (existingProjects && existingProjects.length > 0) {
          await supabase
            .from("profiles")
            .update({
              first_project_created_at: existingProjects[0].created_at,
              first_project_id: existingProjects[0].id
            })
            .eq("id", user.id);
        }
        // No redirect to legacy pages — dashboard + intake notification handles it
      }

      if (profile) {
        // Self-heal: if display_name is missing but birth_name exists, derive and backfill it
        let resolvedName = profile.display_name;
        if (!resolvedName && (profile as any).birth_name) {
          resolvedName = (profile as any).birth_name.split(' ')[0];
          supabase.from("profiles").update({ display_name: resolvedName }).eq("id", user.id);
        }
        setDisplayName(resolvedName || undefined);

        const selfDiscoveryCompleted = profile.self_discovery_completed === true;
        setHasQuestPending(!selfDiscoveryCompleted);

        // Show intake notification if quest completed but no project yet
        if (!profile.first_project_created_at) {
          // Check if quest was completed (new column)
          const { data: questCheck } = await supabase
            .from("profiles")
            .select("onboarding_quest_completed, console_intake_completed" as any)
            .eq("id", user.id)
            .single();
          const qc = questCheck as any;
          if (qc?.onboarding_quest_completed && !qc?.console_intake_completed) {
            setShowIntakeNotification(true);
          }
        }
      }
    } catch (error: any) {
      console.error("Error checking first-time user status:", error);
    }
  };


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
    <div className="min-h-screen bg-cosmic p-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <DashboardHeader displayName={displayName} />

        {/* Daily Ritual — return ritual, first thing on open */}
        <DailyRitualCard
          hasCompletedToday={hasCompletedRitualToday}
          currentStreak={currentStreak}
          todayGoal={todayGoal}
          onStartRitual={() => setRitualModalOpen(true)}
        />

        {/* Journey Progress — XP + Level */}
        <FutureSelfSpaceCard hasQuestPending={hasQuestPending} />

        {/* Today's Focus - PRIMARY ANCHOR */}
        <TodaysFocusCard onOpenVoice={() => setShowVoiceModal(true)} />

        {/* Atlas Progress */}
        <AtlasProgressCard />

        {/* Console Intake Notification */}
        {showIntakeNotification && <IntakeNotification />}

        {/* Momentum Dashboard */}
        <MomentumCard />

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
      
      {/* Voice of the System Modal */}
      <VoiceOfSystemModal 
        open={showVoiceModal} 
        onOpenChange={setShowVoiceModal} 
      />
    </div>
  );
};

export default Dashboard;
