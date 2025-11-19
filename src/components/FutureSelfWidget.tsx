import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

export const FutureSelfWidget = () => {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("future_self_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setProgress(data);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !progress) return null;

  const levelThresholds = [0, 100, 300, 700, 1500];
  const currentThreshold = levelThresholds[progress.evolution_level - 1];
  const nextThreshold = levelThresholds[progress.evolution_level] || 1500;
  const progressPercent = progress.evolution_level >= 5 
    ? 100 
    : ((progress.global_xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return (
    <Card className="bg-gradient-to-br from-mentor-future/10 to-accent/10 border-mentor-future/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-mentor-future" />
          Future Self Evolution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">Level {progress.evolution_level}</span>
          <span className="text-muted-foreground">{progress.global_xp} XP</span>
        </div>
        <Progress value={progressPercent} className="h-3" />
        <p className="text-sm text-muted-foreground">
          {progress.evolution_level >= 5 
            ? "Maximum evolution reached!" 
            : `${nextThreshold - progress.global_xp} XP to Level ${progress.evolution_level + 1}`}
        </p>
      </CardContent>
    </Card>
  );
};