import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DailyRitualModal } from "@/components/DailyRitualModal";
import { MentorWhisperNotification } from "@/components/MentorWhisperNotification";
import { useMentorWhisper } from "@/hooks/useMentorWhisper";
import { useMentorOutreach } from "@/hooks/useMentorOutreach";
import { useCouncilNotifications } from "@/hooks/useCouncilNotifications";

// Dashboard components
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FutureSelfSpaceCard from "@/components/dashboard/FutureSelfSpaceCard";
import TodaysFocusCard from "@/components/dashboard/TodaysFocusCard";
import DailyRitualCard from "@/components/dashboard/DailyRitualCard";
import GuidanceCreationSection from "@/components/dashboard/GuidanceCreationSection";
import MentorsSection from "@/components/dashboard/MentorsSection";
import ComingSoonSection from "@/components/dashboard/ComingSoonSection";

const mentorNames: Record<string, string> = {
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
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [showWhisperNotification, setShowWhisperNotification] = useState(false);
  const [mentorNotifications, setMentorNotifications] = useState<Record<string, number>>({});
  const [processingMentor, setProcessingMentor] = useState<string | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isCouncilLocked, setIsCouncilLocked] = useState(false);
  const [isCreationLabLocked, setIsCreationLabLocked] = useState(true);
  const [hasQuestPending, setHasQuestPending] = useState(false);
  const [areMentorsLocked, setAreMentorsLocked] = useState(false);

  const {
    unreadWhisper,
    checkAndGenerateWhisper,
    markAsRead,
    latestWhisper,
  } = useMentorWhisper();

  const { outreach: mentorOutreach, generateOutreach } = useMentorOutreach();

  const { unreadCount: councilNotificationCount } = useCouncilNotifications();

  useEffect(() => {
    loadDashboardData();
    checkRitualStatus();
    loadMentorNotifications();
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

      // Check if user has had any council meetings
      const { count: councilMeetingsCount } = await supabase
        .from("council_meetings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const hasHadCouncilMeeting = (councilMeetingsCount || 0) > 0;

      if (profile) {
        setDisplayName(profile.display_name || undefined);

        // Check if council is locked
        const councilUnlocked = profile.council_unlocked === true;
        const selfDiscoveryCompleted = profile.self_discovery_completed === true;

        setIsCouncilLocked(!councilUnlocked);
        setHasQuestPending(!selfDiscoveryCompleted);

        // Creation Lab unlocks after first project (for now, keep locked until council is unlocked)
        setIsCreationLabLocked(!councilUnlocked);

        // Mentors unlock after first council meeting
        setAreMentorsLocked(!hasHadCouncilMeeting);

        if (!profile.council_introduction_completed && councilUnlocked) {
          setIsFirstTimeUser(true);
        }
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

      setCurrentUserId(user.id);

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


  const loadMentorNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: privateNotifications } = await supabase
        .from("mentor_private_messages")
        .select("mentor_type")
        .eq("user_id", user.id)
        .eq("read", false);

      const { data: outreachNotifications } = await supabase
        .from("mentor_daily_outreach")
        .select("mentor_type")
        .eq("user_id", user.id)
        .is("read_at", null);

      const counts: Record<string, number> = {};
      privateNotifications?.forEach((n) => {
        counts[n.mentor_type] = (counts[n.mentor_type] || 0) + 1;
      });
      outreachNotifications?.forEach((n) => {
        counts[n.mentor_type] = (counts[n.mentor_type] || 0) + 1;
      });
      
      setMentorNotifications(counts);
    } catch (error: any) {
      console.error("Error loading mentor notifications:", error);
    }
  };

  const handleMentorClick = async (mentorType: string) => {
    if (processingMentor) return;
    
    const hasNotifications = mentorNotifications[mentorType] > 0;
    
    if (hasNotifications) {
      setProcessingMentor(mentorType);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        
        const { data: messages } = await supabase
          .from("mentor_private_messages")
          .select("id, message")
          .eq("user_id", user.id)
          .eq("mentor_type", mentorType)
          .eq("read", false)
          .order("created_at", { ascending: true });
        
        if (messages && messages.length > 0) {
          const messageIds = messages.map(m => m.id);
          
          await supabase
            .from("mentor_private_messages")
            .update({ read: true })
            .in("id", messageIds);
          
          setMentorNotifications(prev => ({
            ...prev,
            [mentorType]: 0
          }));
          
          for (const msg of messages) {
            await supabase.from("chats").insert({
              user_id: user.id,
              mentor_type: mentorType as any,
              role: "assistant",
              content: msg.message,
            });
          }
          
          toast.success(`${mentorNames[mentorType]} wants to chat!`);
        }
      } catch (error: any) {
        console.error("Error handling mentor notifications:", error);
      } finally {
        setProcessingMentor(null);
      }
    }
    
    navigate(`/chat/${mentorType}`);
  };

  const handleCouncilClick = async () => {
    if (councilNotificationCount > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: notifications } = await supabase
            .from("council_notifications")
            .select("*")
            .eq("user_id", user.id)
            .eq("dismissed", false)
            .order("created_at", { ascending: false })
            .limit(1);
          
          if (notifications && notifications.length > 0) {
            const notification = notifications[0];
            const contextData = notification.context_data as Record<string, any> | null;
            navigate("/council-meeting", {
              state: {
                notificationContext: contextData,
                prefilledQuestion: contextData?.suggested_question,
                openerType: notification.notification_type === "breakthrough_followup" 
                  ? "breakthrough_followup" 
                  : "check_in",
                notificationId: notification.id
              }
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching notification context:", error);
      }
    }
    navigate("/council-meeting", {
      state: isFirstTimeUser ? { openerType: "first_meeting" } : undefined
    });
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

        {/* Today's Focus - PRIMARY ANCHOR */}
        <TodaysFocusCard />

        {/* Daily Ritual */}
        <DailyRitualCard 
          hasCompletedToday={hasCompletedRitualToday}
          currentStreak={currentStreak}
          todayGoal={todayGoal}
          onStartRitual={() => setRitualModalOpen(true)}
        />

        {/* Guidance & Creation */}
        <GuidanceCreationSection 
          isFirstTimeUser={isFirstTimeUser}
          councilNotificationCount={councilNotificationCount}
          onCouncilClick={handleCouncilClick}
          isCouncilLocked={isCouncilLocked}
          isCreationLabLocked={isCreationLabLocked}
        />

        {/* Your Mentors */}
        <MentorsSection 
          mentors={mentors}
          mentorNotifications={mentorNotifications}
          processingMentor={processingMentor}
          onMentorClick={handleMentorClick}
          isLocked={areMentorsLocked}
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
