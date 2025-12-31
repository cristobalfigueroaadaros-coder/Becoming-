import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Compass, Heart, Target, Zap, MessageCircle, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuestConfig {
  key: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  elements: string[];
  locked: boolean;
}

const quests: QuestConfig[] = [
  {
    key: "core_values",
    label: "Core Values",
    description: "Discover your non-negotiable principles",
    icon: Heart,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    elements: ["values_list"],
    locked: false,
  },
  {
    key: "ikigai",
    label: "Ikigai",
    description: "Find your reason for being",
    icon: Compass,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    elements: ["love", "good_at", "needs", "paid_for"],
    locked: false,
  },
  {
    key: "strengths",
    label: "Strengths",
    description: "Identify your natural talents",
    icon: Zap,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    elements: ["strengths_list"],
    locked: false,
  },
  {
    key: "my_why",
    label: "My Why",
    description: "Articulate your purpose statement",
    icon: Target,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    elements: ["why_statement"],
    locked: false,
  },
  {
    key: "identity",
    label: "Identity Statement",
    description: "Define who you are becoming",
    icon: Target,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    elements: ["identity_statement"],
    locked: true,
  },
];

interface QuestProgress {
  discovery_type: string;
  element_key: string;
}

export const SelfDiscoveryQuests = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<QuestProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("becoming_discoveries")
        .select("discovery_type, element_key")
        .eq("user_id", user.id);

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestProgress = (quest: QuestConfig) => {
    const completed = quest.elements.filter((el) =>
      progress.some((p) => p.discovery_type === quest.key && p.element_key === el)
    );
    return {
      completed: completed.length,
      total: quest.elements.length,
      percentage: Math.round((completed.length / quest.elements.length) * 100),
    };
  };

  const handleStartQuest = (quest: QuestConfig) => {
    // Navigate to Future Self chat with quest context
    navigate(`/chat/future_self?quest=${quest.key}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading quests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Compass className="w-5 h-5 text-violet-500" />
          Self-Discovery Quests
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete through conversation with your Future Self
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {quests.map((quest) => {
          const Icon = quest.icon;
          const questProgress = getQuestProgress(quest);
          const isComplete = questProgress.percentage === 100;

          return (
            <motion.div
              key={quest.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-lg border transition-colors",
                quest.locked ? "opacity-50" : "hover:bg-muted/50",
                quest.color
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", quest.color)}>
                  {quest.locked ? (
                    <Lock className="w-5 h-5" />
                  ) : isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{quest.label}</h4>
                    {quest.locked ? (
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    ) : isComplete ? (
                      <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-600">
                        Complete
                      </Badge>
                    ) : questProgress.completed > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {questProgress.completed}/{questProgress.total}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {quest.description}
                  </p>
                  
                  {!quest.locked && (
                    <>
                      <Progress value={questProgress.percentage} className="h-1.5 mb-2" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartQuest(quest)}
                        className="h-7 text-xs"
                        disabled={quest.locked}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {isComplete ? "Review with Future Self" : "Complete with Future Self"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};
