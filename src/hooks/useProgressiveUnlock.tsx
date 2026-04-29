import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UnlockState {
  home: boolean;
  atlas: boolean;
  chat: boolean;
  projects: boolean;
  creators: boolean;
  loading: boolean;
}

const LOCK_MESSAGES: Record<string, string> = {
  chat: "You'll unlock this after exploring your Atlas.\nKeep discovering — your mentor is waiting.",
  projects: "This unlocks once you start working with a mentor.\nYour first conversation will open this door.",
  creators: "This unlocks once you begin building something.\nCreate your project first.",
};

const UNLOCK_CELEBRATIONS: Record<string, { title: string; message: string }> = {
  chat: {
    title: "💬 Chat Unlocked",
    message: "Something is starting to connect.\nYou're ready to explore this with a mentor.",
  },
  projects: {
    title: "🚀 Projects Unlocked",
    message: "Now let's turn this into something real.",
  },
  creators: {
    title: "🌍 Creators Unlocked",
    message: "You're not alone. Others are building too.",
  },
};

export function useProgressiveUnlock() {
  const [unlockState, setUnlockState] = useState<UnlockState>({
    home: true,
    atlas: true,
    chat: false,
    projects: false,
    creators: false,
    loading: true,
  });

  const checkAndUpdateUnlocks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("chat_unlocked, projects_unlocked, creators_unlocked, entry_state" as any)
        .eq("id", user.id)
        .single();

      const p = profile as any;
      if (!p) return;

      const prevChat = !!p.chat_unlocked;
      const prevProjects = !!p.projects_unlocked;
      const prevCreators = !!p.creators_unlocked;
      let projectsUnlocked = prevProjects;
      let creatorsUnlocked = prevCreators;

      const entryState: string = p.entry_state || "DISCOVER";

      const COUNCIL_THRESHOLDS: Record<string, number> = { DISCOVER: 4, GROW: 3, BUILD: 2 };
      const threshold = COUNCIL_THRESHOLDS[entryState] ?? 4;

      // Use completed quest count — matches AtlasPage / AtlasQuestFlow logic exactly.
      // Any completed quest counts; no dependency on specific cluster slugs having dots.
      const { count: completedQuestCount } = await supabase
        .from("atlas_quests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      const chatUnlocked = (completedQuestCount || 0) >= threshold;

      // Sync the DB flag to match the live computation
      if (chatUnlocked !== prevChat) {
        await supabase
          .from("profiles")
          .update({ chat_unlocked: chatUnlocked } as any)
          .eq("id", user.id);
      }

      // Check projects unlock: user has sent at least one message to a mentor or console.
      // Use current chatUnlocked (not prevChat) so projects can unlock in the same pass.
      if (!projectsUnlocked && chatUnlocked) {
        const { count: threadCount } = await supabase
          .from("console_thread_messages")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("role", "user");

        const { count: chatCount } = await supabase
          .from("chats")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("role", "user");

        if ((threadCount || 0) >= 1 || (chatCount || 0) >= 1) {
          projectsUnlocked = true;
          await supabase
            .from("profiles")
            .update({ projects_unlocked: true } as any)
            .eq("id", user.id);
        }
      }

      // Check creators unlock condition: has a project (any type)
      // Use current projectsUnlocked so creators can unlock in the same pass.
      if (!creatorsUnlocked && projectsUnlocked) {
        const { count: projectCount } = await supabase
          .from("integrator_projects")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: creationCount } = await supabase
          .from("creation_projects")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Also check atlas_project_nodes (created immediately on project acceptance)
        const { count: atlasProjectCount } = await supabase
          .from("atlas_project_nodes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if ((projectCount || 0) >= 1 || (creationCount || 0) >= 1 || (atlasProjectCount || 0) >= 1) {
          creatorsUnlocked = true;
          await supabase
            .from("profiles")
            .update({ creators_unlocked: true } as any)
            .eq("id", user.id);
        }
      }

      // Fire celebrations for newly unlocked sections
      if (chatUnlocked && !prevChat) showUnlockCelebration("chat");
      if (projectsUnlocked && !prevProjects) showUnlockCelebration("projects");
      if (creatorsUnlocked && !prevCreators) showUnlockCelebration("creators");

      setUnlockState({
        home: true,
        atlas: true,
        chat: chatUnlocked,
        projects: projectsUnlocked,
        creators: creatorsUnlocked,
        loading: false,
      });
    } catch (err) {
      console.error("Error checking unlock state:", err);
      setUnlockState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkAndUpdateUnlocks();
  }, [checkAndUpdateUnlocks]);

  const getLockMessage = (section: string): string => {
    return LOCK_MESSAGES[section] || "Keep going — this will unlock soon.";
  };

  const showUnlockCelebration = (section: string) => {
    const celebration = UNLOCK_CELEBRATIONS[section];
    if (celebration) {
      toast(celebration.title, {
        description: celebration.message,
        duration: 5000,
      });
    }
  };

  const isLocked = (section: string): boolean => {
    const key = section.toLowerCase() as keyof UnlockState;
    if (key === "home" || key === "atlas" || key === "loading") return false;
    return !unlockState[key];
  };

  return {
    unlockState,
    isLocked,
    getLockMessage,
    showUnlockCelebration,
    refreshUnlocks: checkAndUpdateUnlocks,
  };
}
