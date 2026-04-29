import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Sparkles, Brain, Mountain, Heart, Briefcase, Palette, Compass, Star, Target, Users, Flag } from "lucide-react";

const mentorIcons: Record<string, any> = {
  "Mamba Mentor": Zap,
  "Creative Visionary": Sparkles,
  "Quantum Inventor": Brain,
  "Ancient Sage": Mountain,
  "Compassionate Elder": Heart,
  "Business Mentor": Briefcase,
  "Creator Mentor": Palette,
  "Mystic Mentor": Compass,
  "Heart Mentor": Heart,
  "Strategist Mentor": Target,
  "Explorer Mentor": Flag,
  "Future Self": Star,
};

export const MentorProgressCard = ({ mentorName, mentorType }: { mentorName: string, mentorType: string }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any>(null);
  const Icon = mentorIcons[mentorName] || Zap;

  useEffect(() => {
    loadProgress();
  }, [mentorName]);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("mentor_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("mentor_name", mentorName)
        .maybeSingle();

      setProgress(data || { xp: 0, level: 1 });
    } catch (error) {
      console.error("Error loading mentor progress:", error);
      setProgress({ xp: 0, level: 1 });
    }
  };

  if (!progress) return null;

  const levelThresholds = [0, 50, 150];
  const currentThreshold = levelThresholds[progress.level - 1];
  const nextThreshold = levelThresholds[progress.level] || 150;
  const progressPercent = progress.level >= 3 
    ? 100 
    : ((progress.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/chat/${mentorType}`)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{mentorName}</h3>
              <Badge variant="secondary" className="text-xs">Level {progress.level}</Badge>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">{progress.xp} XP</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </CardContent>
    </Card>
  );
};