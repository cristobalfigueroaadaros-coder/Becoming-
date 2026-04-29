import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Bell, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FutureSelfSpaceCardProps {
  hasQuestPending?: boolean;
}

const XP_PER_LEVEL = 100;

const FutureSelfSpaceCard = ({ hasQuestPending = false }: FutureSelfSpaceCardProps) => {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("future_self_progress")
        .select("evolution_level, global_xp")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setLevel(data.evolution_level || 1);
        setXp(data.global_xp || 0);
      }

      // Streak from latest ritual
      const { data: ritualData } = await supabase
        .from("daily_rituals")
        .select("streak_count")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(1);

      if (ritualData && ritualData.length > 0) {
        setStreak(ritualData[0].streak_count || 0);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const xpInLevel = xp % XP_PER_LEVEL;
  const progress = Math.min((xpInLevel / XP_PER_LEVEL) * 100, 100);

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] relative overflow-hidden",
        hasQuestPending && "ring-2 ring-destructive/50"
      )}
      onClick={() => navigate("/creation-lab?type=becoming")}
    >
      {hasQuestPending && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg animate-pulse z-10">
          <Bell className="w-3 h-3" />
        </div>
      )}

      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent pointer-events-none" />

      <CardContent className="p-5 relative">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>

          {/* Progress info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">Your Journey</span>
              <div className="flex items-center gap-3">
                {streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{streak}</span>
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  Level <span className="text-primary font-bold">{level}</span>
                </span>
              </div>
            </div>

            {/* XP Progress bar */}
            <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {xpInLevel} / {XP_PER_LEVEL} XP
              </span>
              <span className="text-xs text-muted-foreground">
                {hasQuestPending ? "Complete a quest to earn XP" : "Keep going"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FutureSelfSpaceCard;
