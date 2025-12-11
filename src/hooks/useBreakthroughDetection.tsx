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

export const useBreakthroughDetection = (mentorType?: string) => {
  const [latestBreakthrough, setLatestBreakthrough] = useState<Breakthrough | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Check for new breakthroughs after messages
  const checkForBreakthrough = useCallback(async (
    messages: Array<{ role: string; content: string }>,
    currentMentorType: string
  ) => {
    // Only check every 5-8 messages for efficiency
    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length < 5 || userMessages.length % 5 !== 0) {
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
  }, []);

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

  useEffect(() => {
    loadLatestBreakthrough();
  }, [loadLatestBreakthrough]);

  return {
    latestBreakthrough,
    loading,
    checkForBreakthrough,
    dismissBreakthrough,
    clearBreakthrough,
    refreshBreakthroughs: loadLatestBreakthrough,
  };
};
