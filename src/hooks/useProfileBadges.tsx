import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface Badge {
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria_type: string;
  criteria_value: number | null;
  priority: number;
}

interface UserBadge {
  id: string;
  badge_key: string;
  awarded_at: string;
  is_visible: boolean;
  display_order: number | null;
}

interface UserStats {
  xp?: number;
  maxStreak?: number;
  shadowsFaced?: number;
  achievementCount?: number;
  completedTasks?: number;
  userRank?: number;
}

export const useProfileBadges = (userId?: string) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBadges();
    if (userId) {
      loadUserBadges(userId);
    }
  }, [userId]);

  const loadBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("profile_badges")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error("Error loading badges:", error);
    }
  };

  const loadUserBadges = async (uid: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", uid)
        .eq("is_visible", true);

      if (error) throw error;
      setUserBadges(data || []);
    } catch (error) {
      console.error("Error loading user badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserBadgesWithDetails = () => {
    return userBadges
      .map((ub) => {
        const badge = badges.find((b) => b.badge_key === ub.badge_key);
        if (!badge) return null;
        return { ...badge, awarded_at: ub.awarded_at };
      })
      .filter(Boolean);
  };

  const awardBadge = async (badgeKey: string, userId: string, showNotification = true) => {
    try {
      // Check if already has badge
      const { data: existing } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_key", badgeKey)
        .single();

      if (existing) return;

      // Award the badge
      const { error } = await supabase
        .from("user_badges")
        .insert({
          user_id: userId,
          badge_key: badgeKey,
        });

      if (error) throw error;

      // Get badge details for notification
      const badge = badges.find((b) => b.badge_key === badgeKey);
      if (badge && showNotification) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast({
          title: "🎉 New Badge Earned!",
          description: `You've earned the ${badge.icon} ${badge.name} badge!`,
        });

        // Log to timeline
        await supabase.from("transformation_timeline").insert({
          user_id: userId,
          event_type: "badge_earned",
          event_data: {
            badge_key: badgeKey,
            badge_name: badge.name,
            badge_icon: badge.icon,
          },
        });
      }

      // Reload user badges
      await loadUserBadges(userId);
    } catch (error) {
      console.error("Error awarding badge:", error);
    }
  };

  const checkAndAwardBadges = async (stats: UserStats, userId: string) => {
    const checks = [
      {
        key: "top_contributor",
        condition: async () => {
          if (!stats.xp) return false;
          // Check if in top 10% by XP
          const { data } = await supabase
            .from("leaderboard_stats")
            .select("total_xp")
            .order("total_xp", { ascending: false });
          if (!data || data.length === 0) return false;
          const topTenPercentIndex = Math.ceil(data.length * 0.1);
          const topTenPercentThreshold = data[topTenPercentIndex - 1]?.total_xp || 0;
          return stats.xp >= topTenPercentThreshold;
        },
      },
      {
        key: "streak_champion",
        condition: async () => (stats.maxStreak || 0) >= 30,
      },
      {
        key: "shadow_master",
        condition: async () => (stats.shadowsFaced || 0) >= 10,
      },
      {
        key: "achievement_hunter",
        condition: async () => (stats.achievementCount || 0) >= 15,
      },
      {
        key: "early_adopter",
        condition: async () => {
          if (!stats.userRank) {
            // Calculate user rank by join date
            const { data } = await supabase
              .from("leaderboard_stats")
              .select("user_id, joined_at")
              .order("joined_at", { ascending: true });
            if (!data) return false;
            const userIndex = data.findIndex((u) => u.user_id === userId);
            return userIndex >= 0 && userIndex < 100;
          }
          return stats.userRank <= 100;
        },
      },
      {
        key: "community_leader",
        condition: async () => {
          // Check if in top 3 of any leaderboard category
          const { data } = await supabase
            .from("leaderboard_stats")
            .select("user_id")
            .order("total_xp", { ascending: false })
            .limit(3);
          if (!data) return false;
          const isTopXP = data.some((u) => u.user_id === userId);
          if (isTopXP) return true;

          // Could add more leaderboard checks here
          return false;
        },
      },
    ];

    for (const check of checks) {
      const shouldAward = await check.condition();
      if (shouldAward) {
        await awardBadge(check.key, userId, true);
      }
    }
  };

  return {
    badges,
    userBadges,
    loading,
    loadUserBadges,
    getUserBadgesWithDetails,
    awardBadge,
    checkAndAwardBadges,
  };
};
