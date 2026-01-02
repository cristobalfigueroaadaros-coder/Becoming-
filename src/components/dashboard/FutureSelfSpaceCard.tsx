import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ChevronRight, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FutureSelfSpaceCardProps {
  hasQuestPending?: boolean;
}

const FutureSelfSpaceCard = ({ hasQuestPending = false }: FutureSelfSpaceCardProps) => {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

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
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] bg-gradient-to-r from-card to-muted/30 border-border/50 relative",
        hasQuestPending && "ring-2 ring-destructive/50"
      )}
      onClick={() => navigate("/creation-lab?type=becoming")}
    >
      {hasQuestPending && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg animate-pulse">
          <Bell className="w-3 h-3" />
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Future Self Space</h3>
              <p className="text-sm text-muted-foreground">
                {hasQuestPending 
                  ? "Complete a quick quest to unlock more features"
                  : "Your long-term vision and growth map"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-sm font-medium text-muted-foreground">Level {level}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-sm font-semibold text-primary">{xp} XP</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FutureSelfSpaceCard;
