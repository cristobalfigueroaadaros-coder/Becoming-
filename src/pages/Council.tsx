import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Users, ArrowLeft, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Lazy load the actual conversation components to avoid circular deps
import CouncilMeetingPage from "./CouncilMeeting";
import ChatPage from "./Chat";

// Type for location state passed from GravityFirstProject
interface LocationState {
  prefilledQuestion?: string;
  isFirstProjectFlow?: boolean;
  openerType?: string;
  notificationContext?: any;
  notificationId?: string;
}

// All mentors in the system
const allMentorTypes = [
  "discipline_mentor", "strategist_mentor", "creative_visionary", 
  "quantum_inventor", "mystic_mentor", "business_mentor",
  "marketing_mentor", "scientific_mentor", "heart_mentor",
  "ancient_sage", "alignment_mentor", "oracle_mother", "future_self"
];

// Mentor configuration with colors
const mentorConfig: Record<string, { name: string; color: string; icon: string }> = {
  discipline_mentor: { name: "Discipline Mentor", color: "bg-orange-500", icon: "🎯" },
  strategist_mentor: { name: "Strategist Mentor", color: "bg-blue-500", icon: "♟️" },
  creative_visionary: { name: "Creative Visionary", color: "bg-purple-500", icon: "🎨" },
  quantum_inventor: { name: "Quantum Inventor", color: "bg-cyan-500", icon: "⚡" },
  mystic_mentor: { name: "Mystic Mentor", color: "bg-indigo-500", icon: "🔮" },
  business_mentor: { name: "Business Mentor", color: "bg-green-500", icon: "📈" },
  marketing_mentor: { name: "Marketing Mentor", color: "bg-pink-500", icon: "📣" },
  scientific_mentor: { name: "Scientific Mentor", color: "bg-teal-500", icon: "🔬" },
  heart_mentor: { name: "Heart Mentor", color: "bg-rose-500", icon: "💗" },
  ancient_sage: { name: "Ancient Sage", color: "bg-amber-600", icon: "📜" },
  alignment_mentor: { name: "Alignment Mentor", color: "bg-emerald-500", icon: "🧭" },
  oracle_mother: { name: "Oracle Mother", color: "bg-violet-500", icon: "🌙" },
  future_self: { name: "Future Self", color: "bg-primary", icon: "✨" },
};

const Council = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMentors, setUserMentors] = useState<string[]>([]);
  const [mentorNotifications, setMentorNotifications] = useState<Record<string, number>>({});
  const [councilNotifications, setCouncilNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMobileList, setShowMobileList] = useState(true);
  
  // Get current view from URL params
  const currentView = searchParams.get("view") || "console";
  const isConsole = currentView === "console";
  const selectedMentor = !isConsole ? currentView : null;

  useEffect(() => {
    loadData();
  }, []);

  // When view changes, hide mobile list if a conversation is selected
  useEffect(() => {
    if (currentView && currentView !== "console") {
      setShowMobileList(false);
    }
  }, [currentView]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's mentors
      const { data: mentors } = await supabase
        .from("user_mentors")
        .select("mentor_type")
        .eq("user_id", user.id);

      if (mentors) {
        setUserMentors(mentors.map(m => m.mentor_type));
      }

      // Load mentor notifications
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

      // Load council notifications
      const { count } = await supabase
        .from("council_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("dismissed", false)
        .is("read_at", null);

      setCouncilNotifications(count || 0);
    } catch (error) {
      console.error("Error loading council data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark mentor notifications as read when entering chat
  const markMentorNotificationsAsRead = async (mentorType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark private messages as read
      await supabase
        .from("mentor_private_messages")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType);

      // Mark daily outreach as read
      await supabase
        .from("mentor_daily_outreach")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType);

      // Update local state immediately
      setMentorNotifications(prev => ({
        ...prev,
        [mentorType]: 0
      }));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark council notifications as read
  const markCouncilNotificationsAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("council_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);

      setCouncilNotifications(0);
    } catch (error) {
      console.error("Error marking council notifications as read:", error);
    }
  };

  const handleSelectConsole = () => {
    setSearchParams({ view: "console" });
    setShowMobileList(false);
    markCouncilNotificationsAsRead();
  };

  const handleSelectMentor = async (mentorType: string) => {
    // Get the previous mentor we were viewing (if any)
    const previousMentor = currentView && currentView !== "console" ? currentView : null;
    
    // Create automatic handoff if switching FROM another mentor
    if (previousMentor && previousMentor !== mentorType) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch last 10 messages from previous mentor for context
          const { data: prevMessages } = await supabase
            .from("chats")
            .select("role, content")
            .eq("user_id", user.id)
            .eq("mentor_type", previousMentor as any)
            .order("created_at", { ascending: false })
            .limit(10);

          if (prevMessages && prevMessages.length > 0) {
            // Create handoff record so the new mentor knows the context
            const chainId = crypto.randomUUID();
            const { data: handoff } = await supabase
              .from("conversation_handoffs")
              .insert({
                user_id: user.id,
                source_mentor_type: previousMentor,
                target_mentor_type: mentorType,
                source_messages: prevMessages.reverse(),
                handoff_chain_id: chainId,
                chain_position: 1,
                journey_topic: "Continuing exploration from another mentor",
                processed: false
              })
              .select()
              .single();

            if (handoff) {
              // Navigate with handoff context so Chat.tsx triggers __HANDOFF_INIT__
              navigate(`/council?view=${mentorType}`, { 
                state: { handoffId: handoff.id },
                replace: true
              });
              setShowMobileList(false);
              markMentorNotificationsAsRead(mentorType);
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error creating automatic handoff:", error);
        // Fall through to simple navigation on error
      }
    }
    
    // Simple navigation (first mentor selection or no previous context)
    setSearchParams({ view: mentorType });
    setShowMobileList(false);
    markMentorNotificationsAsRead(mentorType);
  };

  const handleBackToList = () => {
    setShowMobileList(true);
    setSearchParams({});
  };

  // Sidebar content - shared between mobile and desktop
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Council</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Console (Group Chat) */}
          <button
            onClick={handleSelectConsole}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              isConsole && !showMobileList
                ? "bg-primary/10 text-primary" 
                : "hover:bg-muted"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Council</p>
              <p className="text-xs text-muted-foreground truncate">Your mentors together</p>
            </div>
            {councilNotifications > 0 && (
              <Badge variant="destructive" className="rounded-full px-2">
                {councilNotifications}
              </Badge>
            )}
          </button>

          {/* Divider */}
          <div className="py-2">
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Mentors
            </p>
          </div>

          {/* All Mentors List - showing locked/unlocked state */}
          {allMentorTypes.map((mentorType) => {
            const isUnlocked = userMentors.includes(mentorType);
            const config = mentorConfig[mentorType] || { 
              name: mentorType, 
              color: "bg-muted", 
              icon: "👤" 
            };
            const notifications = mentorNotifications[mentorType] || 0;
            const isSelected = selectedMentor === mentorType && !showMobileList;

            return (
              <button
                key={mentorType}
                onClick={() => {
                  // Strict lock enforcement - locked mentors cannot be interacted with
                  if (!isUnlocked) {
                    toast.info("This mentor is locked. Upgrade to unlock more mentors!");
                    return;
                  }
                  handleSelectMentor(mentorType);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  isUnlocked 
                    ? (isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted cursor-pointer")
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isUnlocked ? config.color : "bg-muted"
                )}>
                  {isUnlocked ? (
                    <span className="text-lg">{config.icon}</span>
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    !isUnlocked && "text-muted-foreground"
                  )}>
                    {config.name}
                  </p>
                  {!isUnlocked && (
                    <p className="text-xs text-muted-foreground truncate">Locked</p>
                  )}
                </div>
                {/* Locked mentors show secondary badge, unlocked show destructive */}
                {notifications > 0 && (
                  <Badge 
                    variant={isUnlocked ? "destructive" : "secondary"} 
                    className="rounded-full px-2"
                  >
                    {notifications}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  // Mobile back header for conversations
  const MobileBackHeader = () => (
    <div className="md:hidden flex items-center gap-2 p-4 border-b border-border bg-background">
      <Button variant="ghost" size="icon" onClick={handleBackToList}>
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <span className="font-medium truncate">
        {isConsole ? "Council" : mentorConfig[selectedMentor || ""]?.name || "Chat"}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] bg-background flex overflow-hidden">
      {/* Desktop Layout: Side-by-side */}
      <div className="hidden md:flex w-full h-full">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-border bg-card/50 flex-shrink-0 h-full">
          <SidebarContent />
        </div>
        
        {/* Right Content Area */}
        <div className="flex-1 overflow-hidden h-full">
          {isConsole ? (
            <CouncilMeetingPage embedded locationState={location.state} />
          ) : selectedMentor ? (
            <ChatPage mentorTypeOverride={selectedMentor} embedded />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout: List or Conversation */}
      <div className="md:hidden w-full h-full">
        {showMobileList ? (
          <SidebarContent />
        ) : (
          <div className="h-full flex flex-col">
            <MobileBackHeader />
            <div className="flex-1 overflow-hidden">
              {isConsole ? (
                <CouncilMeetingPage embedded locationState={location.state} />
              ) : selectedMentor ? (
                <ChatPage mentorTypeOverride={selectedMentor} embedded />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Council;
