import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Breakthrough {
  id: string;
  breakthrough_title: string;
  breakthrough_description: string;
  actionable_next_step?: string;
  mentor_type: string;
  converted_to_goal: boolean;
  dismissed: boolean;
  created_at: string;
}

// Clarity signals that indicate an idea is crystallizing
const CLARITY_SIGNALS = [
  'called', 'named', 'building', 'creating', 'my idea', 'this is',
  'i want to', 'i will', 'my project', 'the project', 'i\'m working on',
  'i\'ve decided', 'i realized', 'it\'s clear', 'what i need', 'my goal',
  'i\'m going to', 'the answer', 'i see now', 'this could be'
];

// Check if a message contains clarity signals
const containsClaritySignals = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return CLARITY_SIGNALS.some(signal => lowerMessage.includes(signal));
};

// Determine if we should check for breakthrough based on context
export const shouldCheckForBreakthrough = (
  messages: Array<{ role: string; content: string }>,
  isFirstSession: boolean,
  source: 'council' | 'mentor' = 'mentor'
): boolean => {
  const userMessages = messages.filter(m => m.role === "user");
  if (userMessages.length === 0) return false;
  
  const lastUserMsg = userMessages[userMessages.length - 1];
  
  // For Council: always check after response in first session
  if (source === 'council' && isFirstSession) {
    return userMessages.length >= 1;
  }
  
  // For first session users: check more frequently (every 2-3 messages)
  if (isFirstSession && userMessages.length >= 2) {
    return true;
  }
  
  // For returning users: check when clarity signals are present
  if (containsClaritySignals(lastUserMsg.content)) {
    return true;
  }
  
  // Check every 4 messages as a fallback (more frequent than before)
  if (userMessages.length >= 4 && userMessages.length % 4 === 0) {
    return true;
  }
  
  return false;
};

export const useBreakthroughDetection = (mentorType?: string) => {
  const [latestBreakthrough, setLatestBreakthrough] = useState<Breakthrough | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFirstSession, setIsFirstSession] = useState(false);

  // Check if this is a first session
  useEffect(() => {
    const checkFirstSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_win_completed_at")
          .eq("id", user.id)
          .single();

        setIsFirstSession(!profile?.first_win_completed_at);
      } catch (error) {
        console.error("Error checking first session:", error);
      }
    };
    
    checkFirstSession();
  }, []);

  // Load latest unconverted breakthrough for current mentor
  const loadLatestBreakthrough = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const query = supabase
        .from("conversation_breakthroughs")
        .select("*")
        .eq("user_id", user.id)
        .eq("converted_to_goal", false)
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (mentorType) {
        query.eq("mentor_type", mentorType);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Error loading breakthrough:", error);
        return;
      }

      setLatestBreakthrough(data);
    } catch (error) {
      console.error("Error loading breakthrough:", error);
    }
  }, [mentorType]);

  // Check for new breakthroughs - now adaptive based on signals
  const checkForBreakthrough = useCallback(async (
    messages: Array<{ role: string; content: string }>,
    currentMentorType: string,
    forceCheck: boolean = false,
    source: 'council' | 'mentor' = 'mentor'
  ) => {
    // Use adaptive detection unless forced
    if (!forceCheck && !shouldCheckForBreakthrough(messages, isFirstSession, source)) {
      return null;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user profile for context
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_foundation_summary, main_mission")
        .eq("id", user.id)
        .single();

      // Call AI to detect breakthrough
      const recentMessages = messages.slice(-10);
      const conversationText = recentMessages
        .map(m => `${m.role === "user" ? "USER" : "MENTOR"}: ${m.content}`)
        .join("\n\n");

      const response = await supabase.functions.invoke("detect-breakthrough", {
        body: {
          conversation: conversationText,
          mentorType: currentMentorType,
          userContext: {
            mission: profile?.main_mission,
            foundation: profile?.user_foundation_summary,
          },
          isFirstSession,
        },
      });

      if (response.error) {
        console.error("Breakthrough detection error:", response.error);
        return null;
      }

      if (response.data?.detected && response.data?.breakthrough) {
        const { title, description, next_step } = response.data.breakthrough;

        // Save breakthrough to database
        const { data: savedBreakthrough, error: saveError } = await supabase
          .from("conversation_breakthroughs")
          .insert({
            user_id: user.id,
            mentor_type: currentMentorType,
            breakthrough_title: title,
            breakthrough_description: description,
            actionable_next_step: next_step,
            source_conversation: recentMessages,
          })
          .select()
          .single();

        if (saveError) {
          console.error("Error saving breakthrough:", saveError);
          return null;
        }

        // Create council notification about the breakthrough
        await supabase
          .from("council_notifications")
          .insert({
            user_id: user.id,
            notification_type: "breakthrough_followup",
            title: `Tell us about "${title}"`,
            message: `We heard your conversation with ${currentMentorType.replace(/_/g, " ")} was productive! Would you like to explore "${title}" further with the council?`,
            breakthrough_id: savedBreakthrough.id,
            context_data: {
              breakthrough_title: title,
              breakthrough_description: description,
              suggested_question: `I've been developing an idea called "${title}". Can the council help me refine it?`,
            },
          });

        setLatestBreakthrough(savedBreakthrough);
        return savedBreakthrough;
      }

      return null;
    } catch (error) {
      console.error("Error checking for breakthrough:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isFirstSession]);

  const dismissBreakthrough = useCallback(async () => {
    if (!latestBreakthrough) return;

    try {
      await supabase
        .from("conversation_breakthroughs")
        .update({ dismissed: true })
        .eq("id", latestBreakthrough.id);

      setLatestBreakthrough(null);
    } catch (error) {
      console.error("Error dismissing breakthrough:", error);
    }
  }, [latestBreakthrough]);

  const clearBreakthrough = useCallback(() => {
    setLatestBreakthrough(null);
  }, []);

  // Mark first win as completed
  const completeFirstWin = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ first_win_completed_at: new Date().toISOString() })
        .eq("id", user.id);

      setIsFirstSession(false);
    } catch (error) {
      console.error("Error completing first win:", error);
    }
  }, []);

  useEffect(() => {
    loadLatestBreakthrough();
  }, [loadLatestBreakthrough]);

  return {
    latestBreakthrough,
    loading,
    isFirstSession,
    checkForBreakthrough,
    dismissBreakthrough,
    clearBreakthrough,
    completeFirstWin,
    refreshBreakthroughs: loadLatestBreakthrough,
  };
};
