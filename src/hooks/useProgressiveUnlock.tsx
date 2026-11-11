import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFutureSelfOnboardingProgress } from "@/lib/journeyFlow";

export interface UnlockState {
  home: boolean;
  atlas: boolean;
  chat: boolean;
  projects: boolean;
  creators: boolean;
  loading: boolean;
}

const LOCK_MESSAGES: Record<string, string> = {
  chat: "You'll unlock this after four Future Self discoveries.\nYour mentor is waiting.",
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
        .select("chat_unlocked, projects_unlocked, creators_unlocked, console_intake_completed, first_project_id" as any)
        .eq("id", user.id)
        .single();

      const p = profile as any;
      if (!p) return;

      const prevChat = !!p.chat_unlocked;
      const prevProjects = !!p.projects_unlocked;
      const prevCreators = !!p.creators_unlocked;
      let projectsUnlocked = prevProjects;
      let creatorsUnlocked = prevCreators;

      const { data: quests, error: questError } = await supabase
        .from("atlas_quests")
        .select("quest_key, status, interactions")
        .eq("user_id", user.id)
        .eq("status", "completed");
      if (questError) throw questError;

      const chatUnlocked = !!p.console_intake_completed || !!p.first_project_id
        || getFutureSelfOnboardingProgress(quests || []).consoleUnlocked;

      // Sync the DB flag to match the live computation
      if (chatUnlocked !== prevChat) {
        await supabase
          .from("profiles")
          .update({ chat_unlocked: chatUnlocked } as any)
          .eq("id", user.id);
      }

      // Projects unlock only after a real first project exists. Mentor or
      // console messages can prepare the idea, but they must not open an empty
      // Projects tab.
      let validProjectId: string | null = null;
      const profileProjectId = p.first_project_id as string | null;
      if (profileProjectId) {
        const { data: project } = await supabase
          .from("integrator_projects")
          .select("id, created_at")
          .eq("id", profileProjectId)
          .eq("user_id", user.id)
          .maybeSingle();
        validProjectId = (project as any)?.id || null;
      }

      if (!validProjectId) {
        const { data: latestProject } = await supabase
          .from("integrator_projects")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if ((latestProject as any)?.id) {
          validProjectId = (latestProject as any).id;
          await supabase
            .from("profiles")
            .update({
              first_project_id: validProjectId,
              first_project_created_at: (latestProject as any).created_at || new Date().toISOString(),
            } as any)
            .eq("id", user.id);
        }
      }

      projectsUnlocked = !!validProjectId;
      creatorsUnlocked = !!validProjectId;

      if (projectsUnlocked !== prevProjects || creatorsUnlocked !== prevCreators) {
        await supabase
          .from("profiles")
          .update({
            projects_unlocked: projectsUnlocked,
            creators_unlocked: creatorsUnlocked,
          } as any)
          .eq("id", user.id);
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
