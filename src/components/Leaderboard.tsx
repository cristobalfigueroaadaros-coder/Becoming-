import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Zap, Target, Flame } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { ProfileBadges } from "./ProfileBadges";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar: string;
  total_xp: number;
  level: number;
  achievement_count: number;
  max_streak: number;
  completed_tasks: number;
  shadows_faced: number;
  joined_at: string;
  badges?: any[];
}

type LeaderboardCategory = "xp" | "achievements" | "streak" | "tasks";

export const Leaderboard = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("all");
  const [category, setCategory] = useState<LeaderboardCategory>("xp");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    getCurrentUser();
  }, [timeframe, category]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("leaderboard_stats")
        .select("*");

      // Apply timeframe filter
      if (timeframe !== "all") {
        const now = new Date();
        let startDate: Date;

        if (timeframe === "week") {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        query = query.gte("joined_at", startDate.toISOString());
      }

      // Apply category sorting
      const sortColumn =
        category === "xp" ? "total_xp" :
        category === "achievements" ? "achievement_count" :
        category === "streak" ? "max_streak" :
        "completed_tasks";

      const { data, error } = await query.order(sortColumn, { ascending: false }).limit(100);

      if (error) throw error;

      // Load badges for all users
      const userIds = data?.map((entry) => entry.user_id).filter(Boolean) || [];
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select(`
          user_id,
          badge_key,
          profile_badges (
            badge_key,
            name,
            description,
            icon,
            color,
            priority
          )
        `)
        .in("user_id", userIds)
        .eq("is_visible", true);

      // Merge badges with entries
      const entriesWithBadges = data?.map((entry) => ({
        ...entry,
        badges: badgesData
          ?.filter((b) => b.user_id === entry.user_id)
          .map((b) => b.profile_badges)
          .filter(Boolean) || [],
      }));

      setEntries(entriesWithBadges || []);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm text-muted-foreground font-medium">#{rank}</span>;
  };

  const getCategoryValue = (entry: LeaderboardEntry) => {
    switch (category) {
      case "xp": return `${entry.total_xp.toLocaleString()} XP`;
      case "achievements": return `${entry.achievement_count} badges`;
      case "streak": return `${entry.max_streak} days`;
      case "tasks": return `${entry.completed_tasks} tasks`;
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case "xp": return <Zap className="w-4 h-4" />;
      case "achievements": return <Award className="w-4 h-4" />;
      case "streak": return <Flame className="w-4 h-4" />;
      case "tasks": return <Target className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Community Leaderboard
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Click on any profile to view their stats and achievements
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeframe selector */}
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category selector */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setCategory("xp")}
            className={`p-3 rounded-lg border transition-all ${
              category === "xp"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Zap className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-medium">XP</p>
          </button>
          <button
            onClick={() => setCategory("achievements")}
            className={`p-3 rounded-lg border transition-all ${
              category === "achievements"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Award className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-medium">Badges</p>
          </button>
          <button
            onClick={() => setCategory("streak")}
            className={`p-3 rounded-lg border transition-all ${
              category === "streak"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Flame className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-medium">Streak</p>
          </button>
          <button
            onClick={() => setCategory("tasks")}
            className={`p-3 rounded-lg border transition-all ${
              category === "tasks"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Target className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-medium">Tasks</p>
          </button>
        </div>

        {/* Leaderboard list */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading rankings...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No entries yet</div>
          ) : (
            entries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.user_id === currentUserId;

              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                    isCurrentUser
                      ? "bg-primary/10 border-2 border-primary"
                      : rank <= 3
                      ? "bg-accent/50 hover:bg-accent/70"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                  onClick={() => navigate(`/profile/${entry.user_id}`)}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(rank)}
                  </div>

                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="text-lg">
                      {entry.avatar}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">
                        {entry.display_name}
                        {isCurrentUser && <span className="text-primary"> (You)</span>}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Lv {entry.level}
                      </Badge>
                      {entry.badges && entry.badges.length > 0 && (
                        <ProfileBadges badges={entry.badges} maxDisplay={2} size="small" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getCategoryIcon()}
                      <span>{getCategoryValue(entry)}</span>
                    </div>
                  </div>

                  {rank <= 3 && (
                    <div className="text-2xl">
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
