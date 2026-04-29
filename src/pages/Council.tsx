import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Users, ArrowLeft, Hammer, Heart, Sparkles, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChatRequestCard } from "@/components/creators/ChatRequestCard";
import { CreatorChatView } from "@/components/creators/CreatorChatView";

// Lazy load the actual conversation components to avoid circular deps
import CouncilMeetingPage from "./CouncilMeeting";
import ChatPage from "./Chat";
import ConsoleThread from "./ConsoleThread";
import BuilderTeamThread from "./BuilderTeamThread";
// Type for location state passed from various flows
interface LocationState {
  prefilledQuestion?: string;
  isFirstProjectFlow?: boolean;
  openerType?: string;
  notificationContext?: any;
  notificationId?: string;
  // Standard handoff (from mentor switching, transmutation map, etc.)
  handoffId?: string;
  // Transmutation context for pattern-aware mentor openings
  transmutationContext?: {
    phase: 'white' | 'gold';
    patternId: string;
    patternName: string;
    patternDescription?: string;
    shadow: string;
    existingTransmutationData?: any;
    lifeEvents?: any;
  };
  // Voice of System handoff
  voiceHandoffId?: string;
  voiceContext?: string;
  // Problem Clarification (Design Thinking Define phase)
  problemClarificationMode?: boolean;
  projectId?: string;
  projectName?: string;
}

// All mentors in the system (including new PDR expansion mentors)
const allMentorTypes = [
  "discipline_mentor", "strategist_mentor", "creative_visionary", 
  "quantum_inventor", "mystic_mentor", "business_mentor",
  "marketing_mentor", "scientific_mentor", "heart_mentor",
  "ancient_sage", "alignment_mentor", "oracle_mother", "future_self",
  // New mentors from PDR expansion
  "perspective_mentor", "challenger_mentor", "design_thinking_mentor",
  "ux_mentor", "gamification_mentor",
  // Clarity & Understanding mentors
  "problem_mentor", "inner_clarity_mentor", "release_mentor",
  // Transmutation Council mentors
  "storybreaker_mentor", "phoenix_mentor", "stoic_mentor"
];

// Mentor configuration — brand kit colors + archetypes
const mentorConfig: Record<string, { name: string; color: string; hex: string; icon: string; archetype: string }> = {
  discipline_mentor:      { name: "Discipline Mentor",      color: "bg-[hsl(330_80%_55%)]", hex: "hsl(330,80%,55%)",  icon: "🎯", archetype: "The Challenger — pushes your limits" },
  strategist_mentor:      { name: "Strategist Mentor",      color: "bg-[hsl(220_90%_58%)]", hex: "hsl(220,90%,58%)",  icon: "♟️", archetype: "The Analyst — maps your patterns" },
  creative_visionary:     { name: "Creative Visionary",     color: "bg-[hsl(280_75%_58%)]", hex: "hsl(280,75%,58%)",  icon: "🎨", archetype: "The Ideator — sparks imagination" },
  quantum_inventor:       { name: "Quantum Inventor",       color: "bg-[hsl(220_90%_58%)]", hex: "hsl(220,90%,58%)",  icon: "⚡", archetype: "The Builder — turns ideas into reality" },
  mystic_mentor:          { name: "Mystic Mentor",          color: "bg-[hsl(280_75%_58%)]", hex: "hsl(280,75%,58%)",  icon: "🔮", archetype: "The Intuitive — sees beyond the obvious" },
  business_mentor:        { name: "Business Mentor",        color: "bg-[hsl(38_70%_55%)]",  hex: "hsl(38,70%,55%)",   icon: "📈", archetype: "The Guide — sees the whole path" },
  marketing_mentor:       { name: "Marketing Mentor",       color: "bg-[hsl(320_75%_55%)]", hex: "hsl(320,75%,55%)",  icon: "📣", archetype: "The Amplifier — makes you visible" },
  scientific_mentor:      { name: "Scientific Mentor",      color: "bg-[hsl(185_55%_45%)]", hex: "hsl(185,55%,45%)",  icon: "🔬", archetype: "The Researcher — finds the signal" },
  heart_mentor:           { name: "Heart Mentor",           color: "bg-[hsl(330_80%_55%)]", hex: "hsl(330,80%,55%)",  icon: "💗", archetype: "The Nurturer — grounds you in truth" },
  ancient_sage:           { name: "Ancient Sage",           color: "bg-[hsl(38_70%_55%)]",  hex: "hsl(38,70%,55%)",   icon: "📜", archetype: "The Wisdom keeper — grounds you" },
  alignment_mentor:       { name: "Alignment Mentor",       color: "bg-[hsl(155_55%_48%)]", hex: "hsl(155,55%,48%)",  icon: "🧭", archetype: "The Integrator — connects the dots" },
  oracle_mother:          { name: "Oracle Mother",          color: "bg-[hsl(265_90%_62%)]", hex: "hsl(265,90%,62%)",  icon: "🌙", archetype: "The Seer — reads what is unspoken" },
  future_self:            { name: "Future Self",            color: "bg-[hsl(330_85%_60%)]", hex: "hsl(330,85%,60%)",  icon: "✨", archetype: "The Vision — who you are becoming" },
  perspective_mentor:     { name: "Perspective Mentor",     color: "bg-[hsl(200_85%_52%)]", hex: "hsl(200,85%,52%)",  icon: "🗺️", archetype: "The Reframer — shifts your angle" },
  challenger_mentor:      { name: "Challenger Mentor",      color: "bg-[hsl(330_80%_55%)]", hex: "hsl(330,80%,55%)",  icon: "⚔️", archetype: "The Challenger — pushes your limits" },
  design_thinking_mentor: { name: "Design Thinking Mentor", color: "bg-[hsl(155_55%_48%)]", hex: "hsl(155,55%,48%)",  icon: "🧪", archetype: "The Prototyper — tests before building" },
  ux_mentor:              { name: "UX Mentor",              color: "bg-[hsl(280_75%_58%)]", hex: "hsl(280,75%,58%)",  icon: "💜", archetype: "The Empath — designs for real people" },
  gamification_mentor:    { name: "Gamification Mentor",    color: "bg-[hsl(38_70%_55%)]",  hex: "hsl(38,70%,55%)",   icon: "🎮", archetype: "The Playmaker — makes the work fun" },
  problem_mentor:         { name: "Problem Mentor",         color: "bg-[hsl(220_40%_50%)]", hex: "hsl(220,40%,50%)",  icon: "🔍", archetype: "The Solver — breaks problems apart" },
  inner_clarity_mentor:   { name: "Inner Clarity Mentor",   color: "bg-[hsl(265_90%_62%)]", hex: "hsl(265,90%,62%)",  icon: "🪞", archetype: "The Mirror — reflects back truth" },
  release_mentor:         { name: "Release Mentor",         color: "bg-[hsl(185_55%_45%)]", hex: "hsl(185,55%,45%)",  icon: "🌊", archetype: "The Liberator — frees what holds you back" },
  storybreaker_mentor:    { name: "Storybreaker Mentor",    color: "bg-[hsl(330_80%_55%)]", hex: "hsl(330,80%,55%)",  icon: "📖", archetype: "The Narrator — rewrites your story" },
  phoenix_mentor:         { name: "Phoenix Mentor",         color: "bg-[hsl(25_90%_55%)]",  hex: "hsl(25,90%,55%)",   icon: "🔥", archetype: "The Transformer — rises through fire" },
  stoic_mentor:           { name: "Stoic Mentor",           color: "bg-[hsl(220_20%_48%)]", hex: "hsl(220,20%,48%)",  icon: "⚖️", archetype: "The Steadfast — holds the centre" },
};

const Council = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMentors, setUserMentors] = useState<string[]>([]);
  const [mentorNotifications, setMentorNotifications] = useState<Record<string, number>>({});
  const [insightFollowupMentors, setInsightFollowupMentors] = useState<Set<string>>(new Set());
  const [councilNotifications, setCouncilNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMobileList, setShowMobileList] = useState(true);
  const [intakePending, setIntakePending] = useState(false);
  const [threadProjectName, setThreadProjectName] = useState<string | null>(null);
  const [creatorChats, setCreatorChats] = useState<any[]>([]);
  const [chatRequests, setChatRequests] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Get current view from URL params
  const currentView = searchParams.get("view") || "console";
  const isConsole = currentView === "console";
  const isIntake = currentView === "intake";
  const isBuilderTeam = currentView === "builder-team";
  const isCreatorChat = currentView.startsWith("creator-chat-");
  const creatorChatId = isCreatorChat ? currentView.replace("creator-chat-", "") : null;
  const selectedMentor = !isConsole && !isIntake && !isBuilderTeam && !isCreatorChat ? currentView : null;

  useEffect(() => {
    loadData();

    // Realtime: update badge counts instantly when a new outreach message is inserted
    // This fires immediately after "Go Deeper Later" — no page refresh needed
    const channel = supabase
      .channel("mentor-outreach-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mentor_daily_outreach" },
        (payload: any) => {
          const mentorType = payload.new?.mentor_type;
          const messageType = payload.new?.message_type;
          if (!mentorType) return;
          setMentorNotifications((prev) => ({
            ...prev,
            [mentorType]: (prev[mentorType] || 0) + 1,
          }));
          if (messageType === "insight_followup") {
            setInsightFollowupMentors((prev) => new Set([...prev, mentorType]));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mentor_daily_outreach" },
        () => { loadData(); } // Re-sync when messages are marked as read
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // When view changes, hide mobile list if a conversation is selected
  useEffect(() => {
    if (currentView && currentView !== "console" && currentView !== "intake") {
      setShowMobileList(false);
    }
    if (currentView === "intake") {
      setShowMobileList(false);
    }
  }, [currentView]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check intake status
      const { data: profile } = await supabase
        .from("profiles")
        .select("console_intake_completed, onboarding_quest_completed")
        .eq("id", user.id)
        .single();

      const questDone = !!(profile as any)?.onboarding_quest_completed;
      const intakeDone = !!(profile as any)?.console_intake_completed;
      setIntakePending(questDone && !intakeDone);

      // Load project name for thread label
      const firstProjectId = (profile as any)?.first_project_id;
      if (firstProjectId) {
        const { data: project } = await supabase
          .from("integrator_projects")
          .select("project_title")
          .eq("id", firstProjectId)
          .single();
        if (project?.project_title) {
          setThreadProjectName(project.project_title);
        }
      }

      // Auto-select intake if pending and no view specified
      if (questDone && !intakeDone && !searchParams.get("view")) {
        setSearchParams({ view: "intake" });
        setShowMobileList(false);
      }

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
        .select("mentor_type, message_type")
        .eq("user_id", user.id)
        .is("read_at", null);

      const counts: Record<string, number> = {};
      const followupMentors = new Set<string>();

      privateNotifications?.forEach((n) => {
        counts[n.mentor_type] = (counts[n.mentor_type] || 0) + 1;
      });
      outreachNotifications?.forEach((n) => {
        counts[n.mentor_type] = (counts[n.mentor_type] || 0) + 1;
        if (n.message_type === "insight_followup") {
          followupMentors.add(n.mentor_type);
        }
      });

      setMentorNotifications(counts);
      setInsightFollowupMentors(followupMentors);

      // Load council notifications
      const { count } = await supabase
        .from("council_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("dismissed", false)
        .is("read_at", null);

      setCouncilNotifications(count || 0);

      setCurrentUserId(user.id);

      // Load creator chats
      const { data: chats } = await supabase
        .from("creator_chats")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      
      if (chats) {
        // For each chat, get the other user's profile
        const enriched = await Promise.all(chats.map(async (chat: any) => {
          const otherId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", otherId)
            .single();
          return { ...chat, otherName: (profile as any)?.display_name || "Creator", otherId };
        }));
        setCreatorChats(enriched);
      }

      // Load pending chat requests
      const { data: requests } = await supabase
        .from("creator_chat_requests")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (requests) {
        const enrichedReqs = await Promise.all(requests.map(async (req: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", req.sender_id)
            .single();
          return { ...req, senderName: (profile as any)?.display_name || "Creator" };
        }));
        setChatRequests(enrichedReqs);
      }
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

      // Mark daily outreach as read — but NOT messages injected into the chat.
      // insight_followup, proactive_insight, council_handover are handled by Chat.tsx.
      await supabase
        .from("mentor_daily_outreach")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType)
        .neq("message_type", "insight_followup")
        .neq("message_type", "proactive_insight")
        .neq("message_type", "council_handover");

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

  const handleSelectIntake = () => {
    setSearchParams({ view: "intake" });
    setShowMobileList(false);
  };

  const [isNavigating, setIsNavigating] = useState(false);

  const handleSelectMentor = async (mentorType: string) => {
    // Prevent double-clicks and race conditions
    if (isNavigating) return;
    setIsNavigating(true);
    
    try {
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
              const { data: handoff, error: handoffError } = await supabase
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

              if (handoff && !handoffError) {
                // Set search params first, then navigate with handoff state
                // Using replace: false to avoid redirect loops
                setSearchParams({ view: mentorType });
                setShowMobileList(false);
                markMentorNotificationsAsRead(mentorType);
                // Pass handoff context through location state for Chat.tsx to pick up
                navigate(`/council?view=${mentorType}`, { 
                  state: { handoffId: handoff.id }
                });
                return;
              }
              // If handoff creation failed, fall through to simple navigation
              if (handoffError) {
                console.error("Handoff creation failed:", handoffError);
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
    } finally {
      setIsNavigating(false);
    }
  };

  const handleBackToList = () => {
    setShowMobileList(true);
    setSearchParams({});
  };

  // Sidebar content - shared between mobile and desktop
  // Determine if chats should be locked (only New Conversation visible initially)
  const [chatsLocked, setChatsLocked] = useState(true);
  const [hoveredMentor, setHoveredMentor] = useState<string | null>(null);

  useEffect(() => {
    const checkChatLock = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("console_intake_completed")
        .eq("id", user.id)
        .single();
      // Unlock other chats once the first conversation is completed
      setChatsLocked(!(profile as any)?.console_intake_completed);
    };
    checkChatLock();
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Council</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* New Conversation / Intake Thread — always visible */}
          <button
            onClick={handleSelectIntake}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
              isIntake && !showMobileList
                ? "border bg-primary/10 text-primary"
                : "hover:bg-muted"
            )}
            style={isIntake && !showMobileList ? {
              borderColor: "hsl(265,90%,62%)",
              boxShadow: "0 0 0 1px hsl(265 90% 62% / 0.30), 0 4px 16px hsl(265 90% 62% / 0.18)",
            } : undefined}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg">✨</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{threadProjectName || "New Conversation"}</p>
              <p className="text-xs text-muted-foreground truncate">Your journey thread</p>
            </div>
            {intakePending && (
              <span className="w-3 h-3 rounded-full bg-destructive animate-pulse shrink-0" />
            )}
          </button>

          {/* All other threads — locked until first conversation completed */}
          {/* Console (Group Chat) */}
          <button
            onClick={() => { if (chatsLocked) { toast("Complete your first conversation to unlock this.", { duration: 3000 }); return; } handleSelectConsole(); }}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
              chatsLocked
                ? "opacity-40 cursor-not-allowed"
                : isConsole && !showMobileList
                  ? "border bg-primary/10 text-primary"
                  : "hover:bg-muted"
            )}
            style={!chatsLocked && isConsole && !showMobileList ? {
              borderColor: "hsl(265,90%,62%)",
              boxShadow: "0 0 0 1px hsl(265 90% 62% / 0.30), 0 4px 16px hsl(265 90% 62% / 0.18)",
            } : undefined}
          >
            <div className="relative w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
              {chatsLocked && <Lock className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground/60" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Project Council</p>
              <p className="text-xs text-muted-foreground truncate">Your project mentors</p>
            </div>
            {!chatsLocked && councilNotifications > 0 && (
              <Badge variant="destructive" className="rounded-full px-2">
                {councilNotifications}
              </Badge>
            )}
          </button>

          {/* Builder Team Thread */}
          <button
            onClick={() => {
              if (chatsLocked) { toast("Complete your first conversation to unlock this.", { duration: 3000 }); return; }
              setSearchParams({ view: "builder-team" });
              setShowMobileList(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
              chatsLocked
                ? "opacity-40 cursor-not-allowed"
                : isBuilderTeam && !showMobileList
                  ? "border bg-lime-500/10 text-lime-400"
                  : "hover:bg-muted"
            )}
            style={!chatsLocked && isBuilderTeam && !showMobileList ? {
              borderColor: "#84cc16",
              boxShadow: "0 0 0 1px rgb(132 204 22 / 0.30), 0 4px 16px rgb(132 204 22 / 0.18)",
            } : undefined}
          >
            <div className="relative w-10 h-10 rounded-full bg-lime-500/20 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-lime-500" />
              {chatsLocked && <Lock className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground/60" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{threadProjectName ? `${threadProjectName} — Builder Team` : "Builder Team"}</p>
              <p className="text-xs text-muted-foreground truncate">Design, UX, Gamification & more</p>
            </div>
          </button>

          {/* Inner Self Council (Group Chat) */}
          <button
            onClick={() => {
              if (chatsLocked) { toast("Complete your first conversation to unlock this.", { duration: 3000 }); return; }
              navigate('/inner-self-council');
            }}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
              chatsLocked ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"
            )}
          >
            <div className="relative w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-indigo-500" />
              {chatsLocked && <Lock className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground/60" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Inner Self Council</p>
              <p className="text-xs text-muted-foreground truncate">Clarity & Emotional Understanding</p>
            </div>
          </button>

          {/* Transmutation Council (Group Chat) */}
          <button
            onClick={() => {
              if (chatsLocked) { toast("Complete your first conversation to unlock this.", { duration: 3000 }); return; }
              navigate('/transmutation-council');
            }}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
              chatsLocked ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"
            )}
          >
            <div className="relative w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {chatsLocked && <Lock className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground/60" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Transmutation Council</p>
              <p className="text-xs text-muted-foreground truncate">Transform pain into gold</p>
            </div>
          </button>

          {/* Creator Connections Section */}
          {!chatsLocked && (chatRequests.length > 0 || creatorChats.length > 0) && (
            <>
              <div className="py-2">
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Creator Connections
                </p>
              </div>

              {/* Pending Requests */}
              {chatRequests.map((req: any) => (
                <div key={req.id} className="px-2">
                  <ChatRequestCard
                    requestId={req.id}
                    senderName={req.senderName}
                    message={req.message}
                    onHandled={loadData}
                  />
                </div>
              ))}

              {/* Active Creator Chats */}
              {creatorChats.map((chat: any) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSearchParams({ view: `creator-chat-${chat.id}` });
                    setShowMobileList(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    creatorChatId === chat.id && !showMobileList
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.otherName}</p>
                    <p className="text-xs text-muted-foreground truncate">Creator connection</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Divider */}
          <div className="py-2">
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Mentors
            </p>
          </div>

          {/* All Mentors List - sorted: mentors with notifications first */}
          {[...allMentorTypes].sort((a, b) => {
            const aN = mentorNotifications[a] || 0;
            const bN = mentorNotifications[b] || 0;
            if (bN !== aN) return bN - aN;
            return 0;
          }).map((mentorType) => {
            const config = mentorConfig[mentorType] || { 
              name: mentorType, 
              color: "bg-muted", 
              icon: "👤",
              hex: "hsl(var(--muted-foreground))",
              archetype: "",
            };
            const notifications = mentorNotifications[mentorType] || 0;
            const hasFollowup = insightFollowupMentors.has(mentorType);
            const isSelected = selectedMentor === mentorType && !showMobileList;
            // Locked mentors with a waiting message get less dim — the notification is the hook
            const lockedWithMessage = chatsLocked && hasFollowup;

            return (
              <button
                key={mentorType}
                onClick={() => {
                  if (chatsLocked) {
                    if (hasFollowup) {
                      toast("Unlock conversations to read their message", {
                        duration: 3000,
                        description: `${config.name} is waiting to discuss your insight`,
                      });
                    } else {
                      toast("Complete your first conversation to unlock this.", { duration: 3000 });
                    }
                    return;
                  }
                  handleSelectMentor(mentorType);
                }}
                onMouseEnter={() => { if (!chatsLocked && !isSelected) setHoveredMentor(mentorType); }}
                onMouseLeave={() => setHoveredMentor(null)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                  chatsLocked
                    ? lockedWithMessage
                      ? "opacity-80 cursor-not-allowed"
                      : "opacity-30 cursor-not-allowed"
                    : "cursor-pointer"
                )}
                style={
                  chatsLocked && lockedWithMessage
                    ? { boxShadow: "0 0 0 1px hsl(0 72% 55% / 0.30)", background: "hsl(0 72% 55% / 0.05)" }
                    : !chatsLocked && isSelected
                    ? {
                        background: `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, ${config.hex.replace("hsl(", "hsla(").replace(")", ", 0.45)")} 100%)`,
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        boxShadow: `0 0 0 1px ${config.hex.replace("hsl(", "hsla(").replace(")", ", 0.70)")}, 0 4px 20px ${config.hex.replace("hsl(", "hsla(").replace(")", ", 0.20)")}`,
                      }
                    : hoveredMentor === mentorType
                    ? { boxShadow: `0 0 0 1px ${config.hex.replace("hsl(", "hsla(").replace(")", ", 0.55)")}` }
                    : undefined
                }
              >
                <div
                  className="relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${config.hex} 22%, transparent)` }}
                >
                  <span className="text-lg">{config.icon}</span>
                  {chatsLocked && <Lock className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{config.name}</p>
                  {lockedWithMessage ? (
                    <p className="text-xs text-destructive/80 truncate">Message waiting...</p>
                  ) : (
                    <p className="text-xs text-muted-foreground truncate">{config.archetype}</p>
                  )}
                </div>
                {notifications > 0 ? (
                  <Badge variant="destructive" className="rounded-full px-2 flex-shrink-0">
                    {notifications}
                  </Badge>
                ) : (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 opacity-70"
                    style={{ backgroundColor: config.hex }}
                  />
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
        {isIntake ? (threadProjectName || "New Conversation") : isBuilderTeam ? (threadProjectName ? `${threadProjectName} — Builder Team` : "Builder Team") : isConsole ? "Chats" : isCreatorChat ? (creatorChats.find((c: any) => c.id === creatorChatId)?.otherName || "Creator Chat") : mentorConfig[selectedMentor || ""]?.name || "Chat"}
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
          {isIntake ? (
            <ConsoleThread embedded onProjectNameChange={setThreadProjectName} />
          ) : isBuilderTeam ? (
            <BuilderTeamThread embedded />
          ) : isConsole ? (
            <CouncilMeetingPage embedded locationState={location.state} />
          ) : isCreatorChat && creatorChatId && currentUserId ? (
            <CreatorChatView
              chatId={creatorChatId}
              currentUserId={currentUserId}
              otherUserName={creatorChats.find((c: any) => c.id === creatorChatId)?.otherName || "Creator"}
            />
          ) : selectedMentor ? (
            <ChatPage mentorTypeOverride={selectedMentor} embedded locationState={location.state} />
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
              {isIntake ? (
                <ConsoleThread embedded onProjectNameChange={setThreadProjectName} />
              ) : isBuilderTeam ? (
                <BuilderTeamThread embedded />
              ) : isConsole ? (
                <CouncilMeetingPage embedded locationState={location.state} />
              ) : isCreatorChat && creatorChatId && currentUserId ? (
                <CreatorChatView
                  chatId={creatorChatId}
                  currentUserId={currentUserId}
                  otherUserName={creatorChats.find((c: any) => c.id === creatorChatId)?.otherName || "Creator"}
                />
              ) : selectedMentor ? (
                <ChatPage mentorTypeOverride={selectedMentor} embedded locationState={location.state} />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Council;
