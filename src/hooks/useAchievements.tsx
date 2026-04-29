import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useProfileBadges } from "./useProfileBadges";

interface Achievement {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  achievement_key: string;
  unlocked_at: string;
  progress: number;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { checkAndAwardBadges } = useProfileBadges(currentUserId || undefined);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      // Load all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .order("tier", { ascending: true })
        .order("requirement_value", { ascending: true });

      // Load user achievements
      const { data: userAchs } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      setAchievements(allAchievements || []);
      setUserAchievements(userAchs || []);
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  };

  const checkAndAwardAchievement = async (
    achievementKey: string,
    currentProgress?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already unlocked
      const existing = userAchievements.find(
        (ua) => ua.achievement_key === achievementKey
      );
      if (existing) return;

      const achievement = achievements.find(
        (a) => a.achievement_key === achievementKey
      );
      if (!achievement) return;

      // Check if requirement is met
      const progress = currentProgress ?? achievement.requirement_value;
      if (progress >= achievement.requirement_value) {
        // Award achievement
        const { error } = await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_key: achievementKey,
          progress: achievement.requirement_value,
        });

        if (!error) {
          // Trigger celebration
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6347'],
          });

          toast.success(`🎖️ Achievement Unlocked!`, {
            description: `${achievement.icon} ${achievement.title} (+${achievement.xp_reward} XP)`,
            duration: 5000,
          });

          await loadAchievements();
          
          // Trigger badge check
          if (user.id) {
            const { data: stats } = await supabase
              .from("leaderboard_stats")
              .select("total_xp, max_streak, shadows_faced, achievement_count")
              .eq("user_id", user.id)
              .single();
            
            if (stats) {
              await checkAndAwardBadges({
                xp: stats.total_xp || 0,
                maxStreak: stats.max_streak || 0,
                shadowsFaced: stats.shadows_faced || 0,
                achievementCount: stats.achievement_count || 0,
              }, user.id);
            }
          }
        }
      } else {
        // Update progress
        await supabase
          .from("user_achievements")
          .upsert({
            user_id: user.id,
            achievement_key: achievementKey,
            progress,
          });
      }
    } catch (error) {
      console.error("Error awarding achievement:", error);
    }
  };

  const checkMultipleAchievements = async (stats: {
    ritualCount?: number;
    ritualStreak?: number;
    taskCount?: number;
    shadowCount?: number;
    councilCount?: number;
    evolutionLevel?: number;
    weeklyGoalsComplete?: boolean;
    monthlyGoalsComplete?: boolean;
    yearlyGoalsComplete?: boolean;
    visionSet?: boolean;
  }) => {
    const checks: Array<[string, number | undefined]> = [];

    if (stats.ritualCount !== undefined) {
      if (stats.ritualCount >= 1) checks.push(["first_ritual", stats.ritualCount]);
    }

    if (stats.ritualStreak !== undefined) {
      if (stats.ritualStreak >= 7) checks.push(["ritual_streak_7", stats.ritualStreak]);
      if (stats.ritualStreak >= 30) checks.push(["ritual_streak_30", stats.ritualStreak]);
      if (stats.ritualStreak >= 100) checks.push(["ritual_streak_100", stats.ritualStreak]);
    }

    if (stats.taskCount !== undefined) {
      if (stats.taskCount >= 1) checks.push(["first_task", stats.taskCount]);
      if (stats.taskCount >= 10) checks.push(["tasks_10", stats.taskCount]);
      if (stats.taskCount >= 50) checks.push(["tasks_50", stats.taskCount]);
      if (stats.taskCount >= 100) checks.push(["tasks_100", stats.taskCount]);
    }

    if (stats.shadowCount !== undefined) {
      if (stats.shadowCount >= 1) checks.push(["shadow_encounter_1", stats.shadowCount]);
      if (stats.shadowCount >= 5) checks.push(["shadow_encounter_5", stats.shadowCount]);
      if (stats.shadowCount >= 10) checks.push(["shadow_encounter_10", stats.shadowCount]);
    }

    if (stats.councilCount !== undefined) {
      if (stats.councilCount >= 1) checks.push(["council_meeting_1", stats.councilCount]);
      if (stats.councilCount >= 10) checks.push(["council_meeting_10", stats.councilCount]);
    }

    if (stats.evolutionLevel !== undefined) {
      if (stats.evolutionLevel >= 10) checks.push(["level_10", stats.evolutionLevel]);
      if (stats.evolutionLevel >= 25) checks.push(["level_25", stats.evolutionLevel]);
      if (stats.evolutionLevel >= 50) checks.push(["level_50", stats.evolutionLevel]);
    }

    if (stats.weeklyGoalsComplete) checks.push(["weekly_goals_all", 1]);
    if (stats.monthlyGoalsComplete) checks.push(["monthly_goals_all", 1]);
    if (stats.yearlyGoalsComplete) checks.push(["yearly_goals_all", 1]);
    if (stats.visionSet) checks.push(["vision_set", 1]);

    // Check all achievements
    for (const [key, progress] of checks) {
      await checkAndAwardAchievement(key, progress);
    }
  };

  return {
    achievements,
    userAchievements,
    loadAchievements,
    checkAndAwardAchievement,
    checkMultipleAchievements,
  };
};
